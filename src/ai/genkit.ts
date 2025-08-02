import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({
    apiVersion: "v1",
    apiKey: process.env.GEMINI_API_KEY,
  })],
});
