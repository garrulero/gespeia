'use server';

import { generateInitialResponse } from '@/ai/flows/generate-initial-response';
import { suggestAlternativeResponses } from '@/ai/flows/suggest-alternative-responses';
import type { Message } from '@/lib/types';

export async function getGeminiResponse(history: Message[], message: string) {
  try {
    const result = await generateInitialResponse({
      history: history.map(m => ({ role: m.role, content: m.content })),
      message,
    });
    return { success: true, response: result.response };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `Failed to get response from Gemini: ${errorMessage}` };
  }
}

export async function getAlternativeResponses(text: string) {
  try {
    const result = await suggestAlternativeResponses({ text });
    return { success: true, alternatives: result.alternatives };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `Failed to get alternative responses: ${errorMessage}` };
  }
}
