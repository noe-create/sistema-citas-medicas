

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, PlusCircle, Wand2, Paperclip, File as FileIcon, Trash2, UploadCloud, ArrowLeft, ArrowRight, Save, CalendarIcon, Beaker } from 'lucide-react';
import type { Patient, Cie10Code, Diagnosis, CreateConsultationDocumentInput, DocumentType, SignosVitales, AntecedentesPersonales, AntecedentesGinecoObstetricos, AntecedentesPediatricos } from '@/lib/types';
import { searchCie10Codes, createConsultation, createLabOrder } from '@/actions/patient-actions';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Badge } from './ui/badge';
import { generatePrescription } from '@/ai/flows/generate-prescription';
import type { GeneratePrescriptionOutput } from '@/ai/flows/generate-prescription';
import { PrescriptionDisplay } from './prescription-display';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { calculateAge } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Checkbox } from './ui/checkbox';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from './ui/calendar';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc } from './ui/dialog';
import { LabOrderForm } from './lab-order-form';


// --- Zod Schema Definition ---
const alergiasOptions = [
  { id: 'medicamentos', label: 'Medicamentos' },
  { id: 'alimentos', label: 'Alimentos' },
  { id: 'polen', label: 'Polen' },
  { id: 'polvo', label: 'Polvo' },
  { id: 'animales', label: 'Animales' },
  { id: 'picaduras_de_insectos', label: 'Picaduras de Insectos' },
];

const habitosOptions = [
  { id: 'tabaco', label: 'Tabaco' },
  { id: 'alcohol', label: 'Alcohol' },
  { id: 'drogas', label: 'Drogas' },
  { id: 'cafe', label: 'Café' },
  { id: 'actividad_fisica', label: 'Actividad Física' },
  { id: 'dieta_balanceada', label: 'Dieta Balanceada' },
];


const consultationSchema = z.object({
  // Step 1: Anamnesis
  motivoConsulta: z.string().min(1, 'El motivo de consulta es obligatorio.'),
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
});

const documentTypes = ['laboratorio', 'imagenologia', 'informe medico', 'otro'] as const;

interface FileUploadState {
    file: File;
    documentType: DocumentType;
    description: string;
    id: string;
}

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
            { id: 'plan', name: 'Diagnóstico y Plan', fields: ['diagnoses', 'treatmentPlan'] },
        ];
        return baseSteps;
    }, []);

    const form = useForm<z.infer<typeof consultationSchema>>({
        resolver: zodResolver(consultationSchema),
        defaultValues: {
            motivoConsulta: '',
            enfermedadActual: '',
            diagnoses: [],
            treatmentPlan: '',
            examenFisicoGeneral: '',
            antecedentesPersonales: {
              alergicos: [],
              habitos: [],
            },
            signosVitales: {
                tempUnidad: 'C',
                pesoUnidad: 'kg',
                tallaUnidad: 'cm',
                satO2Ambiente: true,
                taBrazo: 'izquierdo',
                taPosicion: 'sentado',
                fcRitmo: 'regular',
                tempSitio: 'oral'
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
            setCurrentStep(step => step + 1);
        }
    };
    
    async function onSubmit(values: z.infer<typeof consultationSchema>) {
        setIsSubmitting(true);
        // This is a placeholder for file upload logic.
        const documentsData: CreateConsultationDocumentInput[] = []; 

        try {
            const createdConsultation = await createConsultation({
                ...values,
                waitlistId: patient.id,
                pacienteId: patient.pacienteId,
                documents: documentsData,
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
                 {/* Stepper Indicator */}
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
                {/* Step Content */}
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


// --- Step Sub-components ---

const FormSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-4 rounded-lg border p-4">
        <h3 className="text-lg font-medium leading-none">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const StepAnamnesis = ({ form }: { form: any }) => (
    <div className="space-y-6">
        <FormSection title="Motivo de Consulta">
            <FormField control={form.control} name="motivoConsulta" render={({ field }) => (
                <FormItem>
                    <FormControl><Textarea placeholder="Describa la razón principal de la visita..." {...field} rows={3} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </FormSection>
        <FormSection title="Enfermedad Actual">
            <FormField control={form.control} name="enfermedadActual" render={({ field }) => (
                <FormItem>
                    <FormControl><Textarea placeholder="Detalle la cronología y características de los síntomas..." {...field} rows={6} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </FormSection>
        <FormSection title="Revisión por Sistemas">
            <FormField control={form.control} name="revisionPorSistemas" render={({ field }) => (
                <FormItem>
                    <FormControl><Textarea placeholder="Detalle cualquier otro síntoma por sistema corporal..." {...field} rows={4} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </FormSection>
    </div>
);

const StepAntecedentes = ({ form, isFemale, isPediatric }: { form: any, isFemale: boolean, isPediatric: boolean }) => (
     <div className="space-y-6">
        <FormSection title="Antecedentes Personales">
            <FormField control={form.control} name="antecedentesPersonales.patologicos" render={({ field }) => ( <FormItem><FormLabel>Patológicos</FormLabel><FormControl><Textarea placeholder="Enfermedades crónicas, previas..." {...field} rows={2} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="antecedentesPersonales.quirurgicos" render={({ field }) => ( <FormItem><FormLabel>Quirúrgicos</FormLabel><FormControl><Textarea placeholder="Cirugías anteriores..." {...field} rows={2} /></FormControl><FormMessage /></FormItem> )} />
            
             <FormField
                control={form.control}
                name="antecedentesPersonales.alergicos"
                render={() => (
                    <FormItem>
                        <FormLabel>Alérgicos</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-md border p-4">
                            {alergiasOptions.map((item) => (
                                <FormField
                                    key={item.id}
                                    control={form.control}
                                    name="antecedentesPersonales.alergicos"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                        const currentValue = field.value || [];
                                                        return checked
                                                            ? field.onChange([...currentValue, item.id])
                                                            : field.onChange(
                                                                currentValue.filter(
                                                                    (value: string) => value !== item.id
                                                                )
                                                            );
                                                    }}
                                                />
                                            </FormControl>
                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                        <FormField
                            control={form.control}
                            name="antecedentesPersonales.alergicosOtros"
                            render={({ field }) => (
                                <FormItem className="mt-2">
                                    <FormControl>
                                        <Input placeholder="Otras alergias, especificar..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField control={form.control} name="antecedentesPersonales.medicamentos" render={({ field }) => ( <FormItem><FormLabel>Medicamentos Actuales</FormLabel><FormControl><Textarea placeholder="Medicamentos que toma regularmente..." {...field} rows={2} /></FormControl><FormMessage /></FormItem> )} />

            <FormField
                control={form.control}
                name="antecedentesPersonales.habitos"
                render={() => (
                    <FormItem>
                        <FormLabel>Hábitos Psicobiológicos</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-md border p-4">
                            {habitosOptions.map((item) => (
                                <FormField
                                    key={item.id}
                                    control={form.control}
                                    name="antecedentesPersonales.habitos"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                        const currentValue = field.value || [];
                                                        return checked
                                                            ? field.onChange([...currentValue, item.id])
                                                            : field.onChange(
                                                                currentValue.filter(
                                                                    (value: string) => value !== item.id
                                                                )
                                                            );
                                                    }}
                                                />
                                            </FormControl>
                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                        <FormField
                            control={form.control}
                            name="antecedentesPersonales.habitosOtros"
                            render={({ field }) => (
                                <FormItem className="mt-2">
                                    <FormControl>
                                        <Input placeholder="Otros hábitos, especificar..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormMessage />
                    </FormItem>
                )}
            />
        </FormSection>
        
        <FormSection title="Antecedentes Familiares">
             <FormField control={form.control} name="antecedentesFamiliares" render={({ field }) => ( <FormItem><FormControl><Textarea placeholder="Enfermedades importantes en familiares directos..." {...field} rows={3} /></FormControl><FormMessage /></FormItem> )} />
        </FormSection>
        
        {isFemale && <StepGineco form={form} />}
        {isPediatric && <StepPediatrico form={form} />}
    </div>
);

const StepGineco = ({ form }: { form: any }) => (
    <FormSection title="Antecedentes Gineco-Obstétricos">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField control={form.control} name="antecedentesGinecoObstetricos.menarquia" render={({ field }) => ( <FormItem><FormLabel>Menarquia (edad)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem> )} />
            <FormField control={form.control} name="antecedentesGinecoObstetricos.ciclos" render={({ field }) => ( <FormItem><FormLabel>Ciclos (días/duración)</FormLabel><FormControl><Input placeholder="28/5" {...field} /></FormControl></FormItem> )} />
            <FormField control={form.control} name="antecedentesGinecoObstetricos.fum" render={({ field }) => ( <FormItem><FormLabel>FUM</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? (format(field.value, 'PPP', {locale: es})) : (<span>Seleccione fecha</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover></FormItem> )} />
            <FormField control={form.control} name="antecedentesGinecoObstetricos.g" render={({ field }) => ( <FormItem><FormLabel>Gestas</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem> )} />
            <FormField control={form.control} name="antecedentesGinecoObstetricos.p" render={({ field }) => ( <FormItem><FormLabel>Partos</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem> )} />
            <FormField control={form.control} name="antecedentesGinecoObstetricos.a" render={({ field }) => ( <FormItem><FormLabel>Abortos</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem> )} />
            <FormField control={form.control} name="antecedentesGinecoObstetricos.c" render={({ field }) => ( <FormItem><FormLabel>Cesáreas</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem> )} />
        </div>
        <FormField control={form.control} name="antecedentesGinecoObstetricos.metodoAnticonceptivo" render={({ field }) => ( <FormItem><FormLabel>Método Anticonceptivo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
    </FormSection>
);

const StepPediatrico = ({ form }: { form: any }) => (
     <FormSection title="Antecedentes Pediátricos">
        <FormField control={form.control} name="antecedentesPediatricos.prenatales" render={({ field }) => ( <FormItem><FormLabel>Prenatales</FormLabel><FormControl><Textarea placeholder="Control del embarazo, complicaciones..." {...field} rows={2} /></FormControl></FormItem> )} />
        <FormField control={form.control} name="antecedentesPediatricos.natales" render={({ field }) => ( <FormItem><FormLabel>Natales</FormLabel><FormControl><Textarea placeholder="Tipo de parto, peso/talla al nacer..." {...field} rows={2} /></FormControl></FormItem> )} />
        <FormField control={form.control} name="antecedentesPediatricos.postnatales" render={({ field }) => ( <FormItem><FormLabel>Postnatales</FormLabel><FormControl><Textarea placeholder="Complicaciones neonatales, lactancia..." {...field} rows={2} /></FormControl></FormItem> )} />
        <FormField control={form.control} name="antecedentesPediatricos.inmunizaciones" render={({ field }) => ( <FormItem><FormLabel>Inmunizaciones</FormLabel><FormControl><Textarea placeholder="Esquema de vacunación, vacunas pendientes..." {...field} rows={2} /></FormControl></FormItem> )} />
        <FormField control={form.control} name="antecedentesPediatricos.desarrolloPsicomotor" render={({ field }) => ( <FormItem><FormLabel>Desarrollo Psicomotor</FormLabel><FormControl><Textarea placeholder="Hitos del desarrollo, lenguaje, socialización..." {...field} rows={2} /></FormControl></FormItem> )} />
    </FormSection>
);


const StepExamenFisico = ({ form }: { form: any }) => {
    const satO2Ambiente = form.watch('signosVitales.satO2Ambiente');

    React.useEffect(() => {
        const peso = form.getValues('signosVitales.peso');
        const pesoUnidad = form.getValues('signosVitales.pesoUnidad');
        const talla = form.getValues('signosVitales.talla');
        const tallaUnidad = form.getValues('signosVitales.tallaUnidad');

        if (peso && talla) {
            const pesoKg = pesoUnidad === 'lb' ? peso / 2.20462 : peso;
            const tallaM = tallaUnidad === 'in' ? talla * 0.0254 : talla / 100;
            if (tallaM > 0) {
                const imc = pesoKg / (tallaM * tallaM);
                form.setValue('signosVitales.imc', parseFloat(imc.toFixed(2)));
            }
        }
    }, [
        form.watch('signosVitales.peso'), 
        form.watch('signosVitales.pesoUnidad'), 
        form.watch('signosVitales.talla'), 
        form.watch('signosVitales.tallaUnidad'), 
        form
    ]);

    return (
        <div className="space-y-6">
            <FormSection title="Signos Vitales">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                    {/* Tensión Arterial */}
                    <div className="lg:col-span-2 space-y-2">
                        <FormLabel>Tensión Arterial (mmHg)</FormLabel>
                        <div className="flex items-center gap-2">
                            <FormField control={form.control} name="signosVitales.taSistolica" render={({ field }) => (<FormItem className="flex-1"><FormControl><Input type="number" placeholder="Sist." {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <span className="text-muted-foreground">/</span>
                            <FormField control={form.control} name="signosVitales.taDiastolica" render={({ field }) => (<FormItem className="flex-1"><FormControl><Input type="number" placeholder="Diast." {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <div className="flex gap-4">
                            <FormField control={form.control} name="signosVitales.taBrazo" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-xs">Brazo</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center"><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="izquierdo" /></FormControl><Label className="font-normal">Izq</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="derecho" /></FormControl><Label className="font-normal">Der</Label></FormItem></RadioGroup></FormControl></FormItem>)} />
                            <FormField control={form.control} name="signosVitales.taPosicion" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-xs">Posición</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center"><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="sentado" /></FormControl><Label className="font-normal">Sentado</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="acostado" /></FormControl><Label className="font-normal">Acostado</Label></FormItem></RadioGroup></FormControl></FormItem>)} />
                        </div>
                    </div>

                    {/* Frecuencia Cardíaca */}
                     <div className="space-y-2">
                        <FormField control={form.control} name="signosVitales.fc" render={({ field }) => (<FormItem><FormLabel>Frec. Cardíaca (lpm)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="signosVitales.fcRitmo" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-xs">Ritmo</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center"><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="regular" /></FormControl><Label className="font-normal">Regular</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="irregular" /></FormControl><Label className="font-normal">Irregular</Label></FormItem></RadioGroup></FormControl></FormItem>)} />
                    </div>

                    {/* Frecuencia Respiratoria */}
                    <FormField control={form.control} name="signosVitales.fr" render={({ field }) => (<FormItem><FormLabel>Frec. Resp. (rpm)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    
                    {/* Temperatura */}
                     <div className="lg:col-span-2 space-y-2">
                        <FormLabel>Temperatura</FormLabel>
                        <div className="flex items-center gap-2">
                            <FormField control={form.control} name="signosVitales.temp" render={({ field }) => (<FormItem className="flex-1"><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="signosVitales.tempUnidad" render={({ field }) => (<FormItem><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center"><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="C" /></FormControl><Label className="font-normal">°C</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="F" /></FormControl><Label className="font-normal">°F</Label></FormItem></RadioGroup></FormControl></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="signosVitales.tempSitio" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-xs">Sitio</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-x-4 gap-y-1"><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="oral" /></FormControl><Label className="font-normal">Oral</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="axilar" /></FormControl><Label className="font-normal">Axilar</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="rectal" /></FormControl><Label className="font-normal">Rectal</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="timpanica" /></FormControl><Label className="font-normal">Timpánica</Label></FormItem></RadioGroup></FormControl></FormItem>)} />
                    </div>
                    
                    {/* Peso y Talla */}
                    <FormField control={form.control} name="signosVitales.peso" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>Peso</FormLabel><div className="flex items-center gap-2"><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormField control={form.control} name="signosVitales.pesoUnidad" render={({ field }) => (<FormItem><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center"><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="kg" /></FormControl><Label className="font-normal">kg</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="lb" /></FormControl><Label className="font-normal">lb</Label></FormItem></RadioGroup></FormControl></FormItem>)} /></div><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="signosVitales.talla" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>Talla</FormLabel><div className="flex items-center gap-2"><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormField control={form.control} name="signosVitales.tallaUnidad" render={({ field }) => (<FormItem><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center"><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="cm" /></FormControl><Label className="font-normal">cm</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="in" /></FormControl><Label className="font-normal">in</Label></FormItem></RadioGroup></FormControl></FormItem>)} /></div><FormMessage /></FormItem>)} />

                    {/* IMC */}
                     <FormField control={form.control} name="signosVitales.imc" render={({ field }) => (<FormItem><FormLabel>IMC (kg/m²)</FormLabel><FormControl><Input type="number" {...field} readOnly className="bg-muted" /></FormControl><FormMessage /></FormItem>)} />

                    {/* Saturación O2 */}
                    <div className="space-y-2">
                         <FormField control={form.control} name="signosVitales.satO2" render={({ field }) => (<FormItem><FormLabel>SatO2 (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name="signosVitales.satO2Ambiente" render={({ field }) => (<FormItem className="flex items-center space-x-2 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><Label className="font-normal text-sm">Aire Ambiente</Label></FormItem>)} />
                         {!satO2Ambiente && <FormField control={form.control} name="signosVitales.satO2Flujo" render={({ field }) => (<FormItem><FormLabel className="text-xs">Flujo O2 (L/min)</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>)} />}
                    </div>
                
                    {/* Dolor */}
                    <div className="lg:col-span-2 space-y-2">
                        <FormField
                            control={form.control}
                            name="signosVitales.dolor"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dolor (0-10): {field.value ?? 'N/A'}</FormLabel>
                                    <FormControl>
                                        <Slider
                                            defaultValue={[0]}
                                            value={[field.value ?? 0]}
                                            max={10}
                                            step={1}
                                            onValueChange={(value) => field.onChange(value[0])}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </FormSection>
            <FormSection title="Examen Físico General">
                 <FormField control={form.control} name="examenFisicoGeneral" render={({ field }) => (
                    <FormItem>
                        <FormControl><Textarea placeholder="Descripción del examen físico por sistemas (cabeza, cuello, tórax, etc.)..." {...field} rows={8} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </FormSection>
        </div>
    );
};


const StepDiagnosticoPlan = ({ form, patient, onLabOrderChange }: { form: any; patient: Patient, onLabOrderChange: (tests: string[]) => void }) => {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [prescription, setPrescription] = React.useState<GeneratePrescriptionOutput | null>(null);
    const [isLabOrderOpen, setIsLabOrderOpen] = React.useState(false);

    const { watch } = form;
    const diagnoses = watch('diagnoses');
    const treatmentPlan = watch('treatmentPlan');
    const canGeneratePrescription = diagnoses.length > 0 && treatmentPlan?.trim().length > 0;

    const handleGeneratePrescription = async () => {
        setIsGenerating(true);
        setPrescription(null);
        try {
            const formData = form.getValues();
            const result = await generatePrescription({
                patientName: patient.name,
                diagnoses: formData.diagnoses,
                treatmentPlan: formData.treatmentPlan,
            });
            setPrescription(result);
             toast({
                title: 'Récipe Generado',
                description: 'El récipe médico ha sido generado por la IA.',
            });
        } catch (e) {
            console.error(e);
            toast({
                title: 'Error al Generar Récipe',
                description: 'No se pudo generar la receta. Por favor, intente de nuevo.',
                variant: 'destructive'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLabOrderSubmit = (selectedTests: string[]) => {
        if (selectedTests.length > 0) {
            onLabOrderChange(selectedTests);
            toast({
                title: 'Exámenes Seleccionados',
                description: `${selectedTests.length} exámenes de laboratorio han sido seleccionados. Se guardarán al completar la consulta.`,
            });
        }
        setIsLabOrderOpen(false);
    };

    return (
        <div className="space-y-6">
            <FormSection title="Diagnósticos">
                <FormField control={form.control} name="diagnoses" render={({ field }) => (
                    <FormItem>
                        <Cie10Autocomplete selected={field.value} onChange={field.onChange} />
                        <FormMessage />
                    </FormItem>
                )} />
            </FormSection>
            <FormSection title="Plan de Tratamiento y Órdenes">
                 <FormField control={form.control} name="treatmentPlan" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Indicaciones Médicas y Plan</FormLabel>
                        <FormControl><Textarea placeholder="Indicaciones, prescripciones, estudios solicitados..." {...field} rows={6} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Dialog open={isLabOrderOpen} onOpenChange={setIsLabOrderOpen}>
                    <Button type="button" variant="outline" onClick={() => setIsLabOrderOpen(true)} className="w-full mt-2">
                        <Beaker className="mr-2 h-4 w-4" />
                        Generar Orden de Laboratorio
                    </Button>
                    <DialogContent className="sm:max-w-2xl p-0 gap-0">
                        <DialogHeader className="p-4 border-b">
                            <DialogTitle>Seleccionar Exámenes de Laboratorio</DialogTitle>
                            <DialogDesc>
                                Busque o seleccione de la lista los exámenes a solicitar.
                            </DialogDesc>
                        </DialogHeader>
                        <LabOrderForm 
                            onSubmitted={handleLabOrderSubmit}
                            onCancel={() => setIsLabOrderOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </FormSection>
            <FormSection title="Asistente de Récipe Médico con IA">
                <Button type="button" onClick={handleGeneratePrescription} disabled={!canGeneratePrescription || isGenerating} className="w-full">
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Generar Récipe con IA
                </Button>
                {!canGeneratePrescription && <p className="text-xs text-center text-muted-foreground">Debe agregar al menos un diagnóstico y un plan de tratamiento.</p>}
                {prescription && <PrescriptionDisplay prescription={prescription} />}
            </FormSection>
        </div>
    );
};


// Sub-component for CIE-10 Autocomplete
interface Cie10AutocompleteProps {
    selected: Diagnosis[];
    onChange: (diagnoses: Diagnosis[]) => void;
}
function Cie10Autocomplete({ selected, onChange }: Cie10AutocompleteProps) {
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<Cie10Code[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    React.useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setIsLoading(true);
            const data = await searchCie10Codes(query);
            setResults(data);
            setIsLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (code: Cie10Code) => {
        if (!selected.some(s => s.cie10Code === code.code)) {
            onChange([...selected, { cie10Code: code.code, cie10Description: code.description }]);
        }
        setQuery('');
        setIsPopoverOpen(false);
    };
    
    const handleRemove = (codeToRemove: string) => {
        onChange(selected.filter(s => s.cie10Code !== codeToRemove));
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2 min-h-[4.5rem] p-2 border rounded-md bg-background">
                {selected.length === 0 && <span className="text-sm text-muted-foreground flex items-center justify-center w-full h-full">Ningún diagnóstico seleccionado</span>}
                {selected.map(diagnosis => (
                    <Badge key={diagnosis.cie10Code} variant="secondary">
                        {diagnosis.cie10Code}: {diagnosis.cie10Description}
                        <button type="button" onClick={() => handleRemove(diagnosis.cie10Code)} className="ml-2 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                    </Badge>
                ))}
            </div>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir diagnóstico
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput 
                            placeholder="Buscar código o descripción CIE-10..."
                            value={query}
                            onValueChange={setQuery}
                        />
                        <CommandList>
                            {isLoading && <CommandItem disabled>Buscando...</CommandItem>}
                            {!isLoading && results.length === 0 && query.length > 1 && <CommandEmpty>No se encontraron resultados.</CommandEmpty>}
                             {results.map((result) => (
                                <CommandItem
                                    key={result.code}
                                    value={result.description}
                                    onSelect={() => handleSelect(result)}
                                    className="cursor-pointer"
                                >
                                    <div className="flex flex-col w-full">
                                        <span className="font-semibold">{result.code}</span>
                                        <span className="text-muted-foreground text-wrap">{result.description}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
