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

const getBeverageStockTool = ai.defineTool(
    {
        name: 'getBeverageStock',
        description: 'Get the stock of all beverages available.',
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
});
export type GenerateInitialResponseOutput = z.infer<typeof GenerateInitialResponseOutputSchema>;

export async function generateInitialResponse(input: GenerateInitialResponseInput): Promise<GenerateInitialResponseOutput> {
  return generateInitialResponseFlow(input);
}

const initialResponsePrompt = ai.definePrompt({
  name: 'initialResponsePrompt',
  input: {schema: z.any()},
  output: {schema: GenerateInitialResponseOutputSchema},
  tools: [getBeverageStockTool],
  prompt: `You are a helpful chat assistant for a beverage distribution company.
You can answer questions about the products.
If you need information about the beverages, use the getBeverageStock tool.

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
    // Transform the history to a format that Handlebars can use without an 'eq' helper.
    const transformedHistory = input.history.map(m => ({
        content: m.content,
        role: {
            user: m.role === 'user',
            assistant: m.role === 'assistant'
        }
    }));
    const {output} = await initialResponsePrompt({
        history: transformedHistory,
        message: input.message
    });
    return output!;
  }
);
