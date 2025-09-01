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
  input: {schema: GenerateInitialResponseInputSchema},
  output: {schema: GenerateInitialResponseOutputSchema},
  prompt: `You are a helpful chat assistant. Continue the conversation.

{{#each history}}
{{#if (eq this.role "user")}}From user: {{this.content}}{{/if}}
{{#if (eq this.role "assistant")}}Your response: {{this.content}}{{/if}}
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
    const {output} = await initialResponsePrompt(input);
    return output!;
  }
);
