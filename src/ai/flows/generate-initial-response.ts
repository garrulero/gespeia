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
import { findOrCreateClientByPhone } from '@/services/client-service';


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

const findOrCreateClientByPhoneTool = ai.defineTool(
  {
    name: 'findOrCreateClientByPhone',
    description: "Finds a client by their phone number. If the client doesn't exist, it creates a new one.",
    inputSchema: z.object({ phone: z.string().describe('The phone number of the client.') }),
    outputSchema: z.object({
        id: z.string(),
        name: z.string(),
        phone: z.string(),
        address: z.string(),
      }),
  },
  async ({ phone }) => {
    return findOrCreateClientByPhone(phone);
  }
);


const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const GenerateInitialResponseInputSchema = z.object({
  history: z.array(MessageSchema).describe("The history of the conversation so far."),
  message: z.string().describe('The user message to respond to.'),
  activeClientPhone: z.string().nullable().describe('The phone number of the currently active client, if any. This is passed on every message.'),
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
  tools: [getBeverageStockTool, createOrderTool, findOrCreateClientByPhoneTool],
  prompt: `You are a helpful chat assistant for a beverage distribution company.
You must respond in Spanish.
You can answer questions about products and create orders.

**Client Information:**
- If the user asks about their own identity (e.g., 'who am I?', 'what is my name?'), you MUST use the \`findOrCreateClientByPhone\` tool with the \`activeClientPhone\` to get their name and respond with the name provided by the tool.

**Order Process:**
1.  **Get Client ID**: Before creating an order, you MUST have a client ID. An \`activeClientPhone\` is always provided. You MUST use the \`findOrCreateClientByPhone\` tool with that phone number to get the client's ID.
2.  **No Active Client**: If the user asks to create an order but you don't have an \`activeClientPhone\`, you MUST tell the user they need to select a client first using the button in the header.
3.  **Confirmation**: When an order is created successfully, you MUST confirm it with the user by saying "¡Pedido creado con éxito! Tu ID de pedido es {{order.orderId}} y el total es de \${{order.total}}." using the \`orderId\` and \`total\` from the \`createOrder\` tool output.

**General Rules:**
- If you need information about beverages, use the \`getBeverageStock\` tool.

Continue the conversation.

{{#each history}}
{{this.role}}: {{this.content}}
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
  async (input) => {
    // THIS IS THE FIX: Handle initial greeting OUTSIDE of the main prompt logic.
    if (input.history.length === 0 && input.activeClientPhone) {
        const client = await findOrCreateClientByPhone(input.activeClientPhone);
        const greetingPrompt = ai.definePrompt({
            name: 'greetingPrompt',
            prompt: `You are a helpful chat assistant for a beverage distribution company. You must respond in Spanish.
            A user has just started a conversation. Greet them by name and ask how you can help.
            Client Name: "${client.name}"
            User Message: "${input.message}"
            `,
        });
        const llmResponse = await greetingPrompt();
        return { response: llmResponse.text };
    }


    let llmResponse = await initialResponsePrompt(input);
    
    while (llmResponse.toolRequest) {
      llmResponse = await llmResponse.toolRequest.next();
    }
    
    const toolCalls = llmResponse.toolCalls;
    if (toolCalls && toolCalls.length > 0) {
        const createOrderCall = toolCalls.find(tc => tc.tool === 'createOrder');
        if (createOrderCall) {
          const order = createOrderCall.output;
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
