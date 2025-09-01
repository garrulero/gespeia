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
import { getBeverageStock, findProduct } from '@/services/beverage-service';
import { addOrder } from '@/services/order-service';
import { findClientByPhone, addClient, Client } from '@/services/client-service';


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

const findClientByPhoneTool = ai.defineTool(
  {
    name: 'findClientByPhone',
    description: "Finds a client by their phone number. Returns the client object or null if not found.",
    inputSchema: z.object({ phone: z.string().describe('The phone number of the client.') }),
    outputSchema: z.object({
        id: z.string(),
        name: z.string(),
        phone: z.string(),
        address: z.string(),
    }).nullable(),
  },
  async ({ phone }) => {
    return findClientByPhone(phone);
  }
);

const createClientTool = ai.defineTool({
    name: 'createClient',
    description: 'Creates a new client. Use this after you have asked the user for their name and address.',
    inputSchema: z.object({
        name: z.string().describe('The full name of the client.'),
        phone: z.string().describe('The phone number of the client.'),
        address: z.string().describe('The full address of the client.'),
    }),
    outputSchema: z.union([
      z.object({
          id: z.string(),
          name: z.string(),
          phone: z.string(),
          address: z.string(),
      }),
      z.object({
          error: z.string(),
          details: z.any().optional(),
      })
    ]),
}, async (clientData) => {
    try {
      const newClient = await addClient(clientData);
      return newClient;
    } catch (error: any) {
      return {
        error: "Failed to create client",
        details: error.message,
      }
    }
});


const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const GenerateInitialResponseInputSchema = z.object({
  history: z.array(MessageSchema).describe("The history of the conversation so far."),
  message: z.string().describe('The user message to respond to.'),
  activeClientPhone: z.string().nullable().describe('The phone number of the currently active client, if any.'),
});
export type GenerateInitialResponseInput = z.infer<typeof GenerateInitialResponseInputSchema>;

const GenerateInitialResponseOutputSchema = z.object({
  response: z.string().describe('The Gemini-generated response to the user message.'),
  order: z.object({
    orderId: z.string(),
    total: z.number(),
  }).optional(),
  toolCalls: z.array(z.object({
    tool: z.string(),
    args: z.any(),
    output: z.any().optional(),
  })).optional(),
  rawInput: GenerateInitialResponseInputSchema.optional(),
});
export type GenerateInitialResponseOutput = z.infer<typeof GenerateInitialResponseOutputSchema>;

export async function generateInitialResponse(input: GenerateInitialResponseInput): Promise<GenerateInitialResponseOutput> {
  return generateInitialResponseFlow(input);
}

const initialResponsePrompt = ai.definePrompt({
  name: 'initialResponsePrompt',
  input: {schema: GenerateInitialResponseInputSchema},
  tools: [getBeverageStockTool, createOrderTool, findClientByPhoneTool, createClientTool],
  prompt: `You are a helpful chat assistant for a beverage distribution company.
You must respond in Spanish.
You can answer questions about products and create orders for clients.

**Client Information & Order Process:**
Your primary goal is to create orders for clients. To do this, you need a client ID.

1.  **Check for Active Client**: When a user wants to place an order or asks who they are, you MUST first check if you have an \`activeClientPhone\`.

2.  **Find Existing Client**: If you have an \`activeClientPhone\`, you MUST use the \`findClientByPhoneTool\` to check if the client exists.

3.  **Handle Existing Client**:
    *   If \`findClientByPhoneTool\` returns a client object, you have their \`id\`. You can now proceed to create an order using the \`createOrderTool\`.
    *   If the user asks who they are, respond with the name from the client object.

4.  **Handle NEW Client**:
    *   If \`findClientByPhoneTool\` returns \`null\`, the client is new.
    *   You MUST NOT create the order yet.
    *   Instead, you MUST respond to the user by asking for their full name and address. For example: "Veo que eres un cliente nuevo. Para poder procesar tu pedido, por favor dime tu nombre completo y tu dirección."
    *   Once the user provides their name and address, you MUST use the \`createClientTool\` to create the new client. Provide the name and address from the user's message, and the \`activeClientPhone\` from the input.
    *   After creating the client, you can then proceed to create their order using \`createOrderTool\`.

5.  **Order Confirmation**: When an order is created successfully, you MUST confirm it with the user by saying "¡Pedido creado con éxito! Tu ID de pedido es {{order.orderId}} y el total es de \${{order.total}}." using the \`orderId\` and \`total\` from the \`createOrderTool\` output.

**General Rules:**
- If you need information about beverages, use the \`getBeverageStock\` tool.

Conversation history:
{{#each history}}
{{this.role}}: {{this.content}}
{{/each}}

Client's Phone Number: {{activeClientPhone}}
User's new message:
{{message}}`,
});

const generateInitialResponseFlow = ai.defineFlow(
  {
    name: 'generateInitialResponseFlow',
    inputSchema: GenerateInitialResponseInputSchema,
    outputSchema: GenerateInitialResponseOutputSchema,
  },
  async (input) => {
    const toolEvents: { tool: string; args: any; output?: any }[] = [];
    let llmResponse = await initialResponsePrompt(input);

    while (llmResponse.toolRequest) {
      
      llmResponse.toolRequest.requests.forEach(req => {
        toolEvents.push({ tool: req.tool, args: req.input });
      });

      const toolResponse = await llmResponse.toolRequest.next();

      if (toolResponse.toolCalls) {
        toolResponse.toolCalls.forEach((call) => {
          // Find the corresponding tool request and add the output
          const matchingEvent = toolEvents.find(
            (event) => event.tool === call.tool && !event.output
          );
          if (matchingEvent) {
            matchingEvent.output = call.output;
          }
        });
      }
      
      llmResponse = toolResponse;
    }
    
    // Check for createOrder tool call to extract order details
    const createOrderEvent = toolEvents.find(tc => tc.tool === 'createOrder' && tc.output);

    return {
        response: llmResponse.text,
        order: createOrderEvent ? createOrderEvent.output : undefined,
        toolCalls: toolEvents,
        rawInput: input,
    };
  }
);

