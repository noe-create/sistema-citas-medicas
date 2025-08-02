

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import type { Patient, Service } from '@/lib/types';
import { createConsultation, createLabOrder } from '@/actions/patient-actions';
import { calculateAge, cn } from '@/lib/utils';
import { StepAnamnesis } from './consultation-form-steps/step-anamnesis';
import { StepAntecedentes } from './consultation-form-steps/step-antecedentes';
import { StepExamenFisico } from './consultation-form-steps/step-examen-fisico';
import { StepDiagnosticoPlan } from './consultation-form-steps/step-diagnostico-plan';


// --- Zod Schema Definition ---
const treatmentItemSchema = z.object({
    id: z.string().optional(),
    medicamentoProcedimiento: z.string().min(1, 'El medicamento o procedimiento es requerido.'),
    dosis: z.string().optional(),
    via: z.string().optional(),
    frecuencia: z.string().optional(),
    duracion: z.string().optional(),
    instrucciones: z.string().optional(),
});


const consultationSchema = z.object({
  // Step 1: Anamnesis
  motivoConsulta: z.object({
    sintomas: z.array(z.string()),
    otros: z.string().optional(),
  }).refine(data => data.sintomas.length > 0 || (!!data.otros && data.otros.trim().length > 0), {
    message: "Debe seleccionar al menos un síntoma o describir otro.",
    path: ["otros"], 
  }),
  enfermedadActual: z.string().min(1, 'La historia de la enfermedad actual es obligatoria.'),
  revisionPorSistemas: z.string().optional(),

  // Step 2: Antecedentes
  antecedentesPersonales: z.object({
    patologicos: z.string().optional(),
    quirurgicos: z.string().optional(),
    alergicos: z.array(z.string()).optional(),
    alergicosOtros: z.string().optional(),
    medicamentos: z.string().optional(),
    habitos: z.array(z.string()).optional(),
    habitosOtros: z.string().optional(),
  }).optional(),
  antecedentesFamiliares: z.string().optional(),
  antecedentesGinecoObstetricos: z.object({
    menarquia: z.coerce.number().optional(),
    ciclos: z.string().optional(),
    fum: z.date().optional(),
    g: z.coerce.number().optional(),
    p: z.coerce.number().optional(),
    a: z.coerce.number().optional(),
    c: z.coerce.number().optional(),
    metodoAnticonceptivo: z.string().optional(),
  }).optional(),
  antecedentesPediatricos: z.object({
    prenatales: z.string().optional(),
    natales: z.string().optional(),
    postnatales: z.string().optional(),
    inmunizaciones: z.string().optional(),
    desarrolloPsicomotor: z.string().optional(),
  }).optional(),

  // Step 3: Examen Físico
  signosVitales: z.object({
    taSistolica: z.coerce.number().optional(),
    taDiastolica: z.coerce.number().optional(),
    taBrazo: z.enum(['izquierdo', 'derecho']).optional(),
    taPosicion: z.enum(['sentado', 'acostado']).optional(),
    fc: z.coerce.number().optional(),
    fcRitmo: z.enum(['regular', 'irregular']).optional(),
    fr: z.coerce.number().optional(),
    temp: z.coerce.number().optional(),
    tempUnidad: z.enum(['C', 'F']).optional(),
    tempSitio: z.enum(['oral', 'axilar', 'rectal', 'timpanica']).optional(),
    peso: z.coerce.number().optional(),
    pesoUnidad: z.enum(['kg', 'lb']).optional(),
    talla: z.coerce.number().optional(),
    tallaUnidad: z.enum(['cm', 'in']).optional(),
    imc: z.coerce.number().optional(),
    satO2: z.coerce.number().min(0).max(100).optional(),
    satO2Ambiente: z.boolean().optional(),
    satO2Flujo: z.coerce.number().optional(),
    dolor: z.coerce.number().min(0).max(10).optional(),
  }).optional(),
  examenFisicoGeneral: z.string().min(1, 'El examen físico es obligatorio.'),

  // Step 4: Diagnóstico y Plan
  diagnoses: z.array(z.object({
    cie10Code: z.string(),
    cie10Description: z.string(),
  })).min(1, 'Se requiere al menos un diagnóstico.'),
  treatmentPlan: z.string().min(1, 'El plan de tratamiento es obligatorio.'),
  treatmentItems: z.array(treatmentItemSchema).optional(),
});

interface ConsultationFormProps {
    patient: Patient;
    onConsultationComplete: () => void;
}

// --- Main Form Component ---
export function ConsultationForm({ patient, onConsultationComplete }: ConsultationFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [currentStep, setCurrentStep] = React.useState(0);
    const [selectedLabTests, setSelectedLabTests] = React.useState<string[]>([]);
    
    const age = React.useMemo(() => calculateAge(new Date(patient.fechaNacimiento)), [patient.fechaNacimiento]);
    const isFemale = patient.genero === 'Femenino';
    const isPediatric = age < 18;

    const steps = React.useMemo(() => {
        const baseSteps = [
            { id: 'anamnesis', name: 'Anamnesis', fields: ['motivoConsulta', 'enfermedadActual', 'revisionPorSistemas'] },
            { id: 'antecedentes', name: 'Antecedentes', fields: ['antecedentesPersonales', 'antecedentesFamiliares', 'antecedentesGinecoObstetricos', 'antecedentesPediatricos'] },
            { id: 'examen', name: 'Examen Físico', fields: ['signosVitales', 'examenFisicoGeneral'] },
            { id: 'plan', name: 'Diagnóstico y Plan', fields: ['diagnoses', 'treatmentPlan', 'treatmentItems'] },
        ];
        return baseSteps;
    }, []);

    const form = useForm<z.infer<typeof consultationSchema>>({
        resolver: zodResolver(consultationSchema),
        defaultValues: {
            motivoConsulta: { sintomas: [], otros: '' },
            enfermedadActual: '',
            revisionPorSistemas: '',
            diagnoses: [],
            treatmentPlan: '',
            treatmentItems: [],
            examenFisicoGeneral: '',
            antecedentesFamiliares: '',
            antecedentesPersonales: {
              patologicos: '',
              quirurgicos: '',
              alergicos: [],
              alergicosOtros: '',
              medicamentos: '',
              habitos: [],
              habitosOtros: '',
            },
            antecedentesGinecoObstetricos: {
                menarquia: undefined, ciclos: '', fum: undefined, g: undefined, p: undefined, a: undefined, c: undefined, metodoAnticonceptivo: '',
            },
            antecedentesPediatricos: {
                prenatales: '', natales: '', postnatales: '', inmunizaciones: '', desarrolloPsicomotor: '',
            },
            signosVitales: {
                taSistolica: undefined, taDiastolica: undefined, taBrazo: 'izquierdo', taPosicion: 'sentado', fc: undefined,
                fcRitmo: 'regular', fr: undefined, temp: undefined, tempUnidad: 'C', tempSitio: 'oral',
                peso: undefined, pesoUnidad: 'kg', talla: undefined, tallaUnidad: 'cm', imc: undefined,
                satO2: undefined, satO2Ambiente: true, satO2Flujo: undefined, dolor: 0,
            }
        }
    });

    const handleNext = async () => {
        const fields = steps[currentStep].fields;
        const output = await form.trigger(fields as any, { shouldFocus: true });

        if (!output) return;

        if (currentStep < steps.length - 1) {
            setCurrentStep(step => step + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(step => step - 1);
        }
    };
    
    async function onSubmit(values: z.infer<typeof consultationSchema>) {
        setIsSubmitting(true);
        
        try {
            const createdConsultation = await createConsultation({
                waitlistId: patient.id,
                pacienteId: patient.pacienteId,
                motivoConsulta: values.motivoConsulta,
                enfermedadActual: values.enfermedadActual,
                revisionPorSistemas: values.revisionPorSistemas || undefined,
                antecedentesPersonales: values.antecedentesPersonales,
                antecedentesFamiliares: values.antecedentesFamiliares || undefined,
                antecedentesGinecoObstetricos: isFemale ? values.antecedentesGinecoObstetricos : undefined,
                antecedentesPediatricos: isPediatric ? values.antecedentesPediatricos : undefined,
                signosVitales: values.signosVitales,
                examenFisicoGeneral: values.examenFisicoGeneral,
                diagnoses: values.diagnoses,
                treatmentPlan: values.treatmentPlan,
                treatmentItems: values.treatmentItems,
                renderedServices: [],
            });

            if (createdConsultation && selectedLabTests.length > 0) {
                await createLabOrder(createdConsultation.id, createdConsultation.pacienteId, selectedLabTests);
                toast({
                    variant: 'info',
                    title: 'Orden de Laboratorio Creada',
                    description: 'La orden ha sido guardada en el historial del paciente.',
                });
            }
            
            toast({
                title: 'Consulta Guardada y Completada',
                description: `La historia clínica de ${patient.name} ha sido actualizada.`,
            });
            
            form.reset();
            onConsultationComplete();

        } catch (error) {
            console.error("Error saving consultation:", error);
            toast({
                title: 'Error al guardar la consulta',
                description: 'No se pudo registrar la consulta. Intente de nuevo.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
                <CardTitle>Formulario de Consulta</CardTitle>
                <CardDescription>
                Registre los detalles de la consulta. Al guardar, el paciente saldrá de la cola de espera.
                </CardDescription>
                <div className="flex items-center justify-center pt-2">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors',
                                        currentStep === index ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
                                        currentStep > index && 'bg-primary/50 text-primary-foreground'
                                    )}
                                >
                                    {index + 1}
                                </div>
                                <p className="text-xs mt-1 text-center">{step.name}</p>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={cn("flex-auto border-t-2 transition-colors", currentStep > index ? 'border-primary/50' : 'border-secondary')}></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6 min-h-[400px]">
                {currentStep === 0 && <StepAnamnesis form={form} />}
                {currentStep === 1 && <StepAntecedentes form={form} isFemale={isFemale} isPediatric={isPediatric} />}
                {currentStep === 2 && <StepExamenFisico form={form} />}
                {currentStep === 3 && <StepDiagnosticoPlan form={form} patient={patient} onLabOrderChange={setSelectedLabTests} />}
            </CardContent>
            <CardFooter className="flex justify-between gap-4">
                 <Button type="button" variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                 </Button>

                 {currentStep < steps.length - 1 && (
                    <Button type="button" onClick={handleNext}>
                        Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                 )}

                 {currentStep === steps.length - 1 && (
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar y Completar Consulta
                    </Button>
                 )}
            </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
