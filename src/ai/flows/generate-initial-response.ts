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
        description: 'Create a new order for one or more beverages. This also adjusts the stock.',
        inputSchema: z.object({
            items: z.array(z.object({
                productName: z.string().describe("The name of the product to order."),
                quantity: z.number().int().positive().describe("The quantity of the product to order."),
            })).describe("A list of items to include in the order.")
        }),
        outputSchema: z.object({
            orderId: z.string().describe("The ID of the newly created order."),
            total: z.number().describe("The total price of the order."),
        }),
    },
    async ({items}) => {
        const order = await addOrder(items);
        return {
            orderId: order.id,
            total: order.total,
        }
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
  tools: [getBeverageStockTool, createOrderTool],
  prompt: `You are a helpful chat assistant for a beverage distribution company.
You must respond in Spanish.
You can answer questions about the products and create orders for the user.
If you need information about the beverages, use the getBeverageStock tool.
If the user wants to place an order, use the createOrder tool.
If there is not enough stock, inform the user of the available quantity and ask if they want to proceed with that amount. If they confirm, you MUST use the createOrder tool with the adjusted quantity.
When an order is created successfully, you MUST confirm it with the user by saying "¡Pedido creado con éxito! Tu ID de pedido es {{order.orderId}} y el total es de \${{order.total}}." using the orderId and total from the createOrder tool output.

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
