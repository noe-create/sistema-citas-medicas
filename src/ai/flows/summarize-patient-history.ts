'use server';
/**
 * @fileOverview This file defines a Genkit flow for summarizing a patient's medical history.
 *
 * - summarizePatientHistory - A function that handles the patient history summarization process.
 * - PatientHistoryInput - The input type for the function.
 * - PatientSummaryOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PatientHistoryInputSchema = z.object({
  history: z.string().describe('El historial médico completo del paciente, compuesto por múltiples entradas de consulta.'),
});
export type {PatientHistoryInput} from 'genkit';

const PatientSummaryOutputSchema = z.object({
  knownAllergies: z.array(z.string()).describe('Una lista de alergias conocidas extraídas del historial. Incluir alergias a medicamentos, alimentos, etc. Si no se mencionan alergias, devolver un array vacío.'),
  chronicOrImportantDiagnoses: z.array(z.string()).describe('Una lista de diagnósticos crónicos o importantes (ej. Hipertensión, Diabetes, Asma). Excluir diagnósticos agudos y de corta duración como "Resfriado común". Si no hay diagnósticos crónicos, devolver un array vacío.'),
  currentMedications: z.array(z.string()).describe('Una lista de medicamentos que el paciente parece estar tomando actualmente o de forma crónica. Excluir tratamientos de corto plazo ya finalizados. Si no se mencionan medicamentos crónicos, devolver un array vacío.'),
});
export type PatientSummaryOutput = z.infer<typeof PatientSummaryOutputSchema>;

export async function summarizePatientHistory(input: z.infer<typeof PatientHistoryInputSchema>): Promise<PatientSummaryOutput> {
  return summarizePatientHistoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePatientHistoryPrompt',
  input: {schema: PatientHistoryInputSchema},
  output: {schema: PatientSummaryOutputSchema},
  prompt: `Eres un asistente médico experto en analizar historiales clínicos. Tu tarea es leer el siguiente historial y extraer información clave de manera estructurada.

**Historial Clínico del Paciente:**
{{{history}}}

**Tu Tarea:**
Basado en TODO el historial proporcionado, extrae la siguiente información:
1.  **knownAllergies**: Identifica y lista TODAS las alergias mencionadas, ya sea a medicamentos, alimentos u otras sustancias. Si no se menciona ninguna, devuelve un array vacío.
2.  **chronicOrImportantDiagnoses**: Identifica y lista SOLO los diagnósticos que parezcan ser crónicos, recurrentes o de gran importancia (ej: "Hipertensión", "Diabetes Mellitus tipo 2", "Asma Bronquial"). IGNORA diagnósticos agudos y autolimitados como "Resfriado común", "Gastroenteritis", "Faringitis". Si no hay diagnósticos crónicos, devuelve un array vacío.
3.  **currentMedications**: Identifica y lista los medicamentos que el paciente esté tomando de manera CRÓNICA o que hayan sido recetados en su consulta más reciente como tratamiento a largo plazo. No incluyas medicamentos para tratamientos cortos que ya hayan finalizado. Si no se mencionan medicamentos de uso crónico, devuelve un array vacío.

Sé preciso y extrae la información textualmente como aparece en el historial cuando sea posible.
`,
});

const summarizePatientHistoryFlow = ai.defineFlow(
  {
    name: 'summarizePatientHistoryFlow',
    inputSchema: PatientHistoryInputSchema,
    outputSchema: PatientSummaryOutputSchema,
  },
  async input => {
    if (!input || !input.history || input.history.trim() === '') {
        return {
            knownAllergies: [],
            chronicOrImportantDiagnoses: [],
            currentMedications: [],
        };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
