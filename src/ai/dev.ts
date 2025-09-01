import { config } from 'dotenv';
config();

import '@/ai/flows/generate-initial-response.ts';
import '@/ai/flows/suggest-alternative-responses.ts';