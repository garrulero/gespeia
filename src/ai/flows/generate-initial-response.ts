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
        description: 'Get the stock and price of beverages. You can search by name or brand to filter the results. Highly recommended to use query and limit to avoid token limits.',
        inputSchema: z.object({
            query: z.string().optional().describe('An optional search query to filter beverages by name or brand (e.g. "Coca-Cola", "Vino", "Agua").'),
            limit: z.number().int().positive().optional().describe('Maximum number of results to return. Default is 15. Use a larger number only if specifically requested.')
        }),
        outputSchema: z.array(z.object({
            name: z.string(),
            brand: z.string(),
            price: z.number(),
            stock: z.number(),
        })),
    },
    async ({ query, limit = 15 }) => {
        let allProducts = await getBeverageStock();
        if (query) {
            const lowerQuery = query.toLowerCase();
            allProducts = allProducts.filter(p => 
                p.name.toLowerCase().includes(lowerQuery) || 
                p.brand.toLowerCase().includes(lowerQuery)
            );
        }
        return allProducts.slice(0, limit);
    }
);

const createOrderTool = ai.defineTool(
    {
        name: 'createOrder',
        description: 'Create a new order for one or more beverages for a given client. This also adjusts the stock. DO NOT exceed 10-15 items per call to avoid token limit errors.',
        inputSchema: z.object({
            clientId: z.union([z.string(), z.number()]).transform(String).describe("The ID of the client placing the order."),
            items: z.array(z.object({
                p: z.string().describe("The precise 'name' of the product to order."),
                q: z.number().int().positive().describe("The quantity of the product to order."),
            })).describe("A list of items to include in the order.")
        }),
        outputSchema: z.union([
            z.object({
                orderId: z.string().describe("The ID of the newly created order."),
                total: z.number().describe("The total price of the order."),
            }),
            z.object({
                error: z.string().describe("Error message if the order failed (e.g. out of stock).")
            })
        ]),
    },
    async ({items, clientId}) => {
        try {
            // Map the abbreviated keys back to what addOrder expects
            const mappedItems = items.map(item => ({ productName: item.p, quantity: item.q }));
            const order = await addOrder(mappedItems, clientId);
            return {
                orderId: order.id,
                total: order.total,
            }
        } catch (error: any) {
            return { error: error.message };
        }
    }
);

const createRandomAssortmentTool = ai.defineTool(
    {
        name: 'createRandomAssortment',
        description: 'Creates a large, varied order automatically based on a budget without needing to specify individual items. Ideal for "give me a bit of everything for 1000 euros".',
        inputSchema: z.object({
            clientId: z.union([z.string(), z.number()]).transform(String),
            budget: z.number().positive().describe("The total maximum budget for this assortment."),
            query: z.string().optional().describe("Optional filter, e.g. 'vinos' or 'cervezas', to focus the assortment.")
        }),
        outputSchema: z.union([
            z.object({
                orderId: z.string(),
                total: z.number(),
                itemCount: z.number()
            }),
            z.object({
                error: z.string()
            })
        ])
    },
    async ({ clientId, budget, query }) => {
        try {
            let allProducts = await getBeverageStock();
            if (query) {
                const lowerQuery = query.toLowerCase();
                allProducts = allProducts.filter(prod => 
                    prod.name.toLowerCase().includes(lowerQuery) || 
                    prod.brand.toLowerCase().includes(lowerQuery)
                );
            }
            
            // shuffle products
            const shuffled = allProducts.sort(() => 0.5 - Math.random());
            const items = [];
            let currentTotal = 0;

            for (const product of shuffled) {
                // try to add a reasonable batch of this product
                const batchSize = Math.floor(Math.random() * 10) + 5; // 5 to 14 items
                if (product.stock >= batchSize) {
                    const cost = product.price * batchSize;
                    if (currentTotal + cost <= budget) {
                        items.push({ productName: product.name, quantity: batchSize });
                        currentTotal += cost;
                    }
                }
            }
            
            if (items.length === 0) {
                return { error: "No hay suficiente stock o presupuesto para crear el surtido." };
            }

            const order = await addOrder(items, clientId);
            return { orderId: order.id, total: order.total, itemCount: items.length };
        } catch (error: any) {
            return { error: error.message };
        }
    }
);

const findClientByPhoneTool = ai.defineTool(
  {
    name: 'findClientByPhone',
    description: "Finds a client by their phone number. Returns the client object or an error if not found.",
    inputSchema: z.object({ phone: z.union([z.string(), z.number()]).transform(String).describe('The phone number of the client.') }),
    outputSchema: z.union([
        z.object({
            id: z.string(),
            name: z.string(),
            phone: z.string(),
            address: z.string(),
        }),
        z.object({
            error: z.string(),
        })
    ]),
  },
  async ({ phone }) => {
    const client = await findClientByPhone(phone);
    if (client) {
        return {
            id: String(client.id),
            name: String(client.name),
            phone: String(client.phone),
            address: String(client.address),
        };
    }
    return { error: 'Client not found' };
  }
);

const createClientTool = ai.defineTool({
    name: 'createClient',
    description: 'Creates a new client. Use this after you have asked the user for their name and address.',
    inputSchema: z.object({
        name: z.string().describe('The full name of the client.'),
        phone: z.union([z.string(), z.number()]).transform(String).describe('The phone number of the client.'),
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
      return {
          id: String(newClient.id),
          name: String(newClient.name),
          phone: String(newClient.phone),
          address: String(newClient.address),
      };
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
  tools: [getBeverageStockTool, createOrderTool, createRandomAssortmentTool, findClientByPhoneTool, createClientTool],
  prompt: `You are a helpful chat assistant for a beverage distribution company.
You must respond in Spanish.
You can answer questions about products and create orders for clients.

**Client Information & Order Process:**
Your primary goal is to create orders for clients. To do this, you need a client ID.

1.  **Check for Active Client**: When a user wants to place an order or asks who they are, you MUST first check if you have an \`activeClientPhone\`.

2.  **Find Existing Client**: If you have an \`activeClientPhone\`, you MUST use the \`findClientByPhoneTool\` to check if the client exists.

3.  **Handle Existing Client**:
    *   If \`findClientByPhoneTool\` returns a client object (without an 'error' field), you have their \`id\`. You can now proceed to create an order using the \`createOrderTool\` or \`createRandomAssortmentTool\`.
    *   If the user asks who they are, respond with the name from the client object.

4.  **Handle NEW Client**:
    *   If \`findClientByPhoneTool\` returns an object with an 'error' field, the client is new.
    *   You MUST NOT create the order yet.
    *   Instead, you MUST respond to the user by asking for their full name and address. For example: "Veo que eres un cliente nuevo. Para poder procesar tu pedido, por favor dime tu nombre completo y tu dirección."
    *   Once the user provides their name and address, you MUST use the \`createClientTool\` to create the new client. Provide the name and address from the user's message, and the \`activeClientPhone\` from the input.
    *   After creating the client, you can then proceed to create their order using \`createOrderTool\`.

5.  **Order Confirmation**: When an order is created successfully, you MUST confirm it with the user by saying "¡Pedido creado con éxito! Tu ID de pedido es {{order.orderId}} y el total es de \${{order.total}}." using the \`orderId\` and \`total\` from the \`createOrderTool\` output.

**Product & Order Rules:**
- If you need information about beverages, use the \`getBeverageStock\` tool. Always specify a \`query\` filter when searching for specific products or brands (e.g. 'ramon bilbao', 'agua', 'cerveza') to avoid hitting system token limits.
- When you use \`createOrderTool\`, you MUST use the exact product \`name\` from the data you get from \`getBeverageStock\`. Do not use the brand or a combination of brand and name. For example, if a product is { name: 'Cola', brand: 'Coca-Cola' }, you must use 'Cola' as the \`p\` parameter.

**IMPORTANT NEW LIMITS & TOOLS:**
- Use \`createRandomAssortment\` if the client asks for "un presupuesto variado de X euros", "un surtido", or "un poco de todo". This generates the order automatically in the backend without you needing to specify items, saving token limits.
- If you must use \`createOrder\` manually, NUNCA incluyas más de 10 productos distintos por pedido. If the user asks for more, split it into multiple messages or suggest a random assortment.
- In \`getBeverageStock\`, use \`limit\` if you need to fetch more or fewer than 15 results.
- **Stock Error Handling**: If \`createOrderTool\` returns an error about insufficient stock (e.g., "No hay suficiente stock... Solo quedan X unidades"), you MUST apologize and explicitly offer to place the order for the maximum available units mentioned in the error, to avoid losing the sale. For example: "Lo siento, solo nos quedan 120 unidades de Coca-Cola. ¿Te parece bien si hacemos el pedido por esas 120 unidades disponibles?"

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
    const toolEvents: { tool: string; args: any; output?: any, processed: boolean }[] = [];
    let llmResponse: any;
    try {
      llmResponse = await initialResponsePrompt(input);
    } catch (error: any) {
      if (error.message && (error.message.includes('503') || error.message.includes('overloaded'))) {
        // Retry with the fallback model if the primary is overloaded
        llmResponse = await initialResponsePrompt(input, { model: 'groq/qwen/qwen3.6-27b' });
      } else {
        // Re-throw other errors
        throw error;
      }
    }


    while (llmResponse.toolRequest || (llmResponse.toolRequests && llmResponse.toolRequests.length > 0)) {
      const requests = llmResponse.toolRequest ? llmResponse.toolRequest.requests : llmResponse.toolRequests;
      if (requests) {
          requests.forEach((req: any) => {
            toolEvents.push({ tool: req.tool || req.name, args: req.input || req.args, processed: false });
          });
      }

      const toolResponse = llmResponse.toolRequest ? await llmResponse.toolRequest.next() : await llmResponse.next();

      if (toolResponse.toolCalls) {
        toolResponse.toolCalls.forEach((call: any) => {
          const matchingEvent = toolEvents.find(
            (event) => event.tool === call.tool && !event.processed
          );
          if (matchingEvent) {
            matchingEvent.output = call.output;
            matchingEvent.processed = true;
          }
        });
      }
      
      llmResponse = toolResponse;
    }
    
    // Check for createOrder tool call to extract order details
    const createOrderEvent = toolEvents.find((tc: any) => tc.tool === 'createOrder' && tc.output);

    return {
        response: llmResponse.text,
        order: createOrderEvent ? createOrderEvent.output : undefined,
        toolCalls: toolEvents.map(({ processed, ...rest}) => rest),
        rawInput: input,
    };
  }
);
