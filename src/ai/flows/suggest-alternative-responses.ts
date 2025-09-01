'use server';

/**
 * @fileOverview An AI agent that suggests alternative responses to a given text.
 *
 * - suggestAlternativeResponses - A function that handles the suggestion of alternative responses.
 * - SuggestAlternativeResponsesInput - The input type for the suggestAlternativeResponses function.
 * - SuggestAlternativeResponsesOutput - The return type for the suggestAlternativeResponses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAlternativeResponsesInputSchema = z.object({
  text: z.string().describe('The text to generate alternative responses for.'),
});
export type SuggestAlternativeResponsesInput = z.infer<
  typeof SuggestAlternativeResponsesInputSchema
>;

const SuggestAlternativeResponsesOutputSchema = z.object({
  alternatives: z
    .array(z.string())
    .describe('An array of alternative responses.'),
});
export type SuggestAlternativeResponsesOutput = z.infer<
  typeof SuggestAlternativeResponsesOutputSchema
>;

export async function suggestAlternativeResponses(
  input: SuggestAlternativeResponsesInput
): Promise<SuggestAlternativeResponsesOutput> {
  return suggestAlternativeResponsesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestAlternativeResponsesPrompt',
  input: {schema: SuggestAlternativeResponsesInputSchema},
  output: {schema: SuggestAlternativeResponsesOutputSchema},
  prompt: `You are an AI assistant that suggests alternative responses to a given text.

  Generate three alternative responses for the following text:
  {{text}}

  Return the alternatives as an array of strings.`,
});

const suggestAlternativeResponsesFlow = ai.defineFlow(
  {
    name: 'suggestAlternativeResponsesFlow',
    inputSchema: SuggestAlternativeResponsesInputSchema,
    outputSchema: SuggestAlternativeResponsesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
