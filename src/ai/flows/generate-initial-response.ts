'use server';

/**
 * @fileOverview Generates an initial response to a user message using the Gemini API.
 *
 * - generateInitialResponse - A function that generates the initial response.
 * - GenerateInitialResponseInput - The input type for the generateInitialResponse function.
 * - GenerateInitialResponseOutput - The return type for the generateInitialResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getBeverageStock } from '@/services/beverage-service';
import { addOrder } from '@/services/order-service';
import { getClients, findClientByName, addClient } from '@/services/client-service';

const getBeverageStockTool = ai.defineTool(
    {
        name: 'getBeverageStock',
        description: 'Get the stock and price of all beverages available.',
        inputSchema: z.object({}),
        outputSchema: z.array(z.object({
            name: z.string(),
            brand: z.string(),
            price: z.number(),
            stock: z.number(),
        })),
    },
    async () => {
        return getBeverageStock();
    }
);

const createOrderTool = ai.defineTool(
    {
        name: 'createOrder',
        description: 'Create a new order for one or more beverages for a given client. This also adjusts the stock.',
        inputSchema: z.object({
            clientId: z.string().describe("The ID of the client placing the order."),
            items: z.array(z.object({
                productName: z.string().describe("The name of the product to order. This MUST be the `name` field from the product, not the brand."),
                quantity: z.number().int().positive().describe("The quantity of the product to order."),
            })).describe("A list of items to include in the order.")
        }),
        outputSchema: z.object({
            orderId: z.string().describe("The ID of the newly created order."),
            total: z.number().describe("The total price of the order."),
        }),
    },
    async ({items, clientId}) => {
        const order = await addOrder(items, clientId);
        return {
            orderId: order.id,
            total: order.total,
        }
    }
);

const listClientsTool = ai.defineTool(
  {
    name: 'listClients',
    description: 'Get a list of all registered clients.',
    inputSchema: z.object({}),
    outputSchema: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        phone: z.string(),
        address: z.string(),
      })
    ),
  },
  async () => {
    return getClients();
  }
);

const findClientByNameTool = ai.defineTool(
  {
    name: 'findClientByName',
    description: 'Find a client by their name.',
    inputSchema: z.object({ name: z.string().describe('The name of the client to search for.') }),
    outputSchema: z
      .object({
        id: z.string(),
        name: z.string(),
        phone: z.string(),
        address: z.string(),
      })
      .nullable(),
  },
  async ({ name }) => {
    const client = await findClientByName(name);
    return client || null;
  }
);

const createClientTool = ai.defineTool(
  {
    name: 'createClient',
    description: 'Create a new client.',
    inputSchema: z.object({
      name: z.string().describe('The full name of the client.'),
      phone: z.string().describe('The phone number of the client.'),
      address: z.string().describe('The shipping address for the client.'),
    }),
    outputSchema: z.object({
      id: z.string(),
      name: z.string(),
    }),
  },
  async (input) => {
    return addClient(input);
  }
);


const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const GenerateInitialResponseInputSchema = z.object({
  history: z.array(MessageSchema).describe("The history of the conversation so far."),
  message: z.string().describe('The user message to respond to.'),
});
export type GenerateInitialResponseInput = z.infer<typeof GenerateInitialResponseInputSchema>;

const GenerateInitialResponseOutputSchema = z.object({
  response: z.string().describe('The Gemini-generated response to the user message.'),
  order: z.object({
    orderId: z.string(),
    total: z.number(),
  }).optional(),
});
export type GenerateInitialResponseOutput = z.infer<typeof GenerateInitialResponseOutputSchema>;

export async function generateInitialResponse(input: GenerateInitialResponseInput): Promise<GenerateInitialResponseOutput> {
  return generateInitialResponseFlow(input);
}

const initialResponsePrompt = ai.definePrompt({
  name: 'initialResponsePrompt',
  input: {schema: z.any()},
  tools: [getBeverageStockTool, createOrderTool, listClientsTool, findClientByNameTool, createClientTool],
  prompt: `You are a helpful chat assistant for a beverage distribution company.
You must respond in Spanish.
You can answer questions about products and create orders.

**Order Process:**
1.  **Identify Client**: Before creating an order, you MUST know who the client is.
    - Ask the user for their client name (e.g., "¿A nombre de qué cliente se hará el pedido?").
    - Use the \`findClientByName\` tool to check if they exist.
2.  **Client Not Found**: If the client is not found, you MUST ask for their full name, phone number, and address to register them.
    - Then, use the \`createClient\` tool to create the new client.
    - After creating the client, confirm with the user and proceed with their original order request using the new client's ID.
3.  **Create Order**: Once the client is identified (either found or newly created), use the \`createOrder\` tool to place the order. You must provide the \`clientId\`.
4.  **Stock Issues**: If there is not enough stock for an item, inform the user of the available quantity and ask if they want to proceed with that amount. If they confirm, you MUST use the \`createOrder\` tool with the adjusted quantity.
5.  **Confirmation**: When an order is created successfully, you MUST confirm it with the user by saying "¡Pedido creado con éxito! Tu ID de pedido es {{order.orderId}} y el total es de \${{order.total}}." using the \`orderId\` and \`total\` from the \`createOrder\` tool output.

**General Rules:**
- If you need information about beverages, use the \`getBeverageStock\` tool.

Continue the conversation.

{{#each history}}
{{#if this.role.user}}From user: {{this.content}}{{/if}}
{{#if this.role.assistant}}Your response: {{this.content}}{{/if}}
{{/each}}

New user message:
{{message}}`,
});

const generateInitialResponseFlow = ai.defineFlow(
  {
    name: 'generateInitialResponseFlow',
    inputSchema: GenerateInitialResponseInputSchema,
    outputSchema: GenerateInitialResponseOutputSchema,
  },
  async input => {
    const transformedHistory = input.history.map(m => ({
        content: m.content,
        role: {
            user: m.role === 'user',
            assistant: m.role === 'assistant'
        }
    }));
    const llmResponse = await initialResponsePrompt({
        history: transformedHistory,
        message: input.message
    });

    const toolCalls = llmResponse.toolCalls;
    if (toolCalls && toolCalls.length > 0) {
        const createOrderCall = toolCalls.find(tc => tc.tool === 'createOrder');
        if (createOrderCall) {
          const order = await createOrderCall.output();
          return {
            response: llmResponse.text,
            order: order,
          };
        }
    }
    
    return {
        response: llmResponse.text,
    };
  }
);
