import {genkit} from 'genkit';
import {groq} from 'genkitx-groq';

export const ai = genkit({
  plugins: [groq()],
  model: 'groq/qwen/qwen3.6-27b',
});
