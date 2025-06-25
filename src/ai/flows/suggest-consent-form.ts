// src/ai/flows/suggest-consent-form.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting consent forms based on the service type.
 *
 * The flow takes the service type and procedure as input and returns a suggested consent form.
 *
 * @remarks
 * - suggestConsentForm - A function that handles the consent form suggestion process.
 * - SuggestConsentFormInput - The input type for the suggestConsentForm function.
 * - SuggestConsentFormOutput - The return type for the suggestConsentForm function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestConsentFormInputSchema = z.object({
  serviceType: z
    .string()
    .describe('The type of service the patient is receiving (e.g., General Medicine, Pediatrics, Nursing).'),
  procedure: z.string().describe('The specific procedure being performed (e.g., vaccination, blood test).').optional(),
});
export type SuggestConsentFormInput = z.infer<typeof SuggestConsentFormInputSchema>;

const SuggestConsentFormOutputSchema = z.object({
  suggestedFormName: z.string().describe('The name of the suggested consent form to be signed.'),
  suggestedFormDescription: z.string().describe('A brief description of the suggested consent form.'),
});
export type SuggestConsentFormOutput = z.infer<typeof SuggestConsentFormOutputSchema>;

export async function suggestConsentForm(input: SuggestConsentFormInput): Promise<SuggestConsentFormOutput> {
  return suggestConsentFormFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestConsentFormPrompt',
  input: {schema: SuggestConsentFormInputSchema},
  output: {schema: SuggestConsentFormOutputSchema},
  prompt: `You are an AI assistant specialized in suggesting the correct consent forms for patients based on the service they are receiving and the procedure being performed.

  Given the service type: "{{serviceType}}" and procedure: "{{procedure}}", suggest the most appropriate consent form from the library. Also provide a short description of the suggested form.

  Return the name of suggested consent form and a brief description of it.
  `,
});

const suggestConsentFormFlow = ai.defineFlow(
  {
    name: 'suggestConsentFormFlow',
    inputSchema: SuggestConsentFormInputSchema,
    outputSchema: SuggestConsentFormOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
