'use server';

import { generateInitialResponse } from '@/ai/flows/generate-initial-response';
import { suggestAlternativeResponses } from '@/ai/flows/suggest-alternative-responses';
import type { Message } from '@/lib/types';

const HISTORY_LIMIT = 10;

export async function getGeminiResponse(history: Message[], message: string, activeClientPhone: string | null) {
  try {
    const limitedHistory = history.slice(-HISTORY_LIMIT);
    // Pass the history array directly. The flow will handle the logic for an empty array.
    const result = await generateInitialResponse({
      history: limitedHistory.map(m => ({ role: m.role, content: m.content })),
      message,
      activeClientPhone,
    });
    return { success: true, ...result };
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
