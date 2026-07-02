'use server';

import { generateInitialResponse } from '@/ai/flows/generate-initial-response';
import type { Message } from '@/lib/types';

const HISTORY_LIMIT = 10;

export async function getGeminiResponse(payload: { history: Message[], message: string, activeClientPhone: string | null }) {
  try {
    const { history, message, activeClientPhone } = payload;
    const limitedHistory = history.slice(-HISTORY_LIMIT);
    
    const inputToAI = {
      history: limitedHistory.map(m => ({ role: m.role, content: m.content })),
      message,
      activeClientPhone: activeClientPhone,
    };

    console.log("Sending to AI:", inputToAI);
    
    const result = await generateInitialResponse(inputToAI);
    return { success: true as const, ...result, rawInput: inputToAI };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false as const, error: `Failed to get response from Gemini: ${errorMessage}` };
  }
}
