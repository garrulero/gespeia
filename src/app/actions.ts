'use server';

import { generateInitialResponse } from '@/ai/flows/generate-initial-response';
import { suggestAlternativeResponses } from '@/ai/flows/suggest-alternative-responses';
import { toast } from '@/hooks/use-toast';

export async function getGeminiResponse(message: string) {
  try {
    const result = await generateInitialResponse({ message });
    return { success: true, response: result.response };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to get response from Gemini.' };
  }
}

export async function getAlternativeResponses(text: string) {
  try {
    const result = await suggestAlternativeResponses({ text });
    return { success: true, alternatives: result.alternatives };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to get alternative responses.' };
  }
}
