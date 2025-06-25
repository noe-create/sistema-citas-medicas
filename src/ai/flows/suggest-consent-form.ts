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
    .describe('El tipo de servicio que recibe el paciente (p. ej., Medicina General, Pediatría, Enfermería).'),
  procedure: z.string().describe('El procedimiento específico que se está realizando (p. ej., vacunación, análisis de sangre).').optional(),
});
export type SuggestConsentFormInput = z.infer<typeof SuggestConsentFormInputSchema>;

const SuggestConsentFormOutputSchema = z.object({
  suggestedFormName: z.string().describe('El nombre del formulario de consentimiento sugerido para ser firmado.'),
  suggestedFormDescription: z.string().describe('Una breve descripción del formulario de consentimiento sugerido.'),
});
export type SuggestConsentFormOutput = z.infer<typeof SuggestConsentFormOutputSchema>;

export async function suggestConsentForm(input: SuggestConsentFormInput): Promise<SuggestConsentFormOutput> {
  return suggestConsentFormFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestConsentFormPrompt',
  input: {schema: SuggestConsentFormInputSchema},
  output: {schema: SuggestConsentFormOutputSchema},
  prompt: `Eres un asistente de IA especializado en sugerir los formularios de consentimiento correctos para los pacientes en función del servicio que reciben y el procedimiento que se les realiza.

  Dado el tipo de servicio: "{{serviceType}}" y el procedimiento: "{{procedure}}", sugiere el formulario de consentimiento más apropiado de la biblioteca. Proporciona también una breve descripción del formulario sugerido.

  Devuelve el nombre del formulario de consentimiento sugerido y una breve descripción del mismo.
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
