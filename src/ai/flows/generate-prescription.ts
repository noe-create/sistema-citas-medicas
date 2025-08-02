'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a medical prescription.
 *
 * - generatePrescription - A function that handles the prescription generation process.
 * - GeneratePrescriptionInput - The input type for the function.
 * - GeneratePrescriptionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiagnosisSchema = z.object({
    cie10Code: z.string(),
    cie10Description: z.string(),
});

const GeneratePrescriptionInputSchema = z.object({
  patientName: z.string().describe('El nombre completo del paciente.'),
  diagnoses: z.array(DiagnosisSchema).describe('La lista de diagnósticos para el paciente.'),
  treatmentPlan: z.string().describe('El plan de tratamiento detallado, incluyendo indicaciones y medicamentos.'),
});
export type {GeneratePrescriptionInput} from 'genkit';

const GeneratePrescriptionOutputSchema = z.object({
  doctorName: z.string().describe('El nombre del médico que emite la receta.'),
  doctorLicense: z.string().describe('El número de licencia o colegiado del médico.'),
  date: z.string().describe('La fecha de emisión de la receta en formato "dd de mmmm de yyyy".'),
  patientName: z.string().describe('El nombre completo del paciente.'),
  prescriptionBody: z.string().describe('El cuerpo principal de la receta, formateado en Markdown. Debe incluir claramente los medicamentos, dosis e instrucciones. Cada medicamento debe estar en una nueva línea con viñetas.'),
});
export type GeneratePrescriptionOutput = z.infer<typeof GeneratePrescriptionOutputSchema>;

export async function generatePrescription(input: z.infer<typeof GeneratePrescriptionInputSchema>): Promise<GeneratePrescriptionOutput> {
  return generatePrescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePrescriptionPrompt',
  input: {schema: GeneratePrescriptionInputSchema},
  output: {schema: GeneratePrescriptionOutputSchema},
  prompt: `Eres un asistente médico experto encargado de generar récipes médicos formales.
  
  **Información del Paciente:**
  - Nombre: {{{patientName}}}
  
  **Información de la Consulta:**
  - Diagnósticos:
  {{#each diagnoses}}
    - {{this.cie10Code}}: {{this.cie10Description}}
  {{/each}}
  - Plan de Tratamiento (indicaciones del doctor): {{{treatmentPlan}}}
  
  **Tu Tarea:**
  Basado en el plan de tratamiento proporcionado por el doctor, genera un récipe médico formal y estructurado.
  
  **Requisitos de formato de salida:**
  1.  **doctorName**: Usa "Dr. Smith".
  2.  **doctorLicense**: Usa "MPPS 12345".
  3.  **date**: Genera la fecha actual en formato "dd de mmmm de yyyy" en español (ej. 25 de mayo de 2024).
  4.  **patientName**: Usa el nombre del paciente proporcionado.
  5.  **prescriptionBody**: 
      - Extrae **SOLAMENTE los medicamentos, indicaciones y tratamientos** del plan de tratamiento y formatéalos como una lista con viñetas.
      - Asegúrate de que cada indicación o medicamento esté en una nueva línea separada.
      - No incluyas información de diagnóstico o notas subjetivas en el cuerpo de la receta.
      - El formato debe ser claro y profesional. Usa Markdown para la lista.
  
  Ejemplo del formato esperado para 'prescriptionBody':
  *   Amoxicilina 500mg, 1 tableta cada 8 horas por 7 días.
  *   Ibuprofeno 400mg, 1 tableta cada 6 horas si hay dolor.
  *   Reposo relativo por 48 horas.
  *   Control en 72 horas si no hay mejoría.
  `,
});

const generatePrescriptionFlow = ai.defineFlow(
  {
    name: 'generatePrescriptionFlow',
    inputSchema: GeneratePrescriptionInputSchema,
    outputSchema: GeneratePrescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
