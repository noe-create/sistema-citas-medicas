
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Save,
  Briefcase,
  HeartPulse,
  ClipboardCheck,
  Building,
  UserCheck,
  FileQuestion,
  Stethoscope,
  Vote,
  Forward,
  User,
  Check
} from 'lucide-react';
import type { Persona, Empresa } from '@/lib/types';
import { cn, calculateAge } from '@/lib/utils';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { ChevronsUpDown } from 'lucide-react';
import { Cie10Autocomplete } from './cie10-autocomplete';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

const occupationalHealthSchema = z.object({
  // Initial Info
  patientType: z.enum(['Empleado Interno', 'Beneficiario', 'Afiliado Externo']),
  consultationPurpose: z.enum([
    'Pre-ingreso',
    'Periódica',
    'Post-incapacidad',
    'Retiro',
    'Consulta de Morbilidad',
  ]),
  companyId: z.string().optional(),
  // Occupational History
  jobPosition: z.string().min(1, 'El puesto es requerido.'),
  jobDescription: z.string().min(1, 'La descripción de tareas es requerida.'),
  occupationalRisks: z
    .array(z.string())
    .refine((value) => value.some((item) => item), {
      message: 'Debe seleccionar al menos un riesgo.',
    }),
  riskDetails: z.string().min(1, 'Debe detallar la exposición.'),
  // Health History
  personalHistory: z.string().min(1, 'Los antecedentes personales son requeridos.'),
  familyHistory: z.string().min(1, 'Los antecedentes familiares son requeridos.'),
  lifestyle: z.object({
    diet: z.string().optional(),
    physicalActivity: z.string().optional(),
    sleepQuality: z.string().optional(),
    smoking: z.string().optional(),
    alcohol: z.string().optional(),
  }),
  mentalHealth: z.string().optional(),
  // Physical Exam
  vitalSigns: z.object({
    ta: z.string().optional(),
    fc: z.string().optional(),
    fr: z.string().optional(),
    temp: z.string().optional(),
  }),
  anthropometry: z.object({
    weight: z.coerce.number().positive('El peso debe ser positivo'),
    height: z.coerce.number().positive('La talla debe ser positiva'),
    imc: z.string(),
  }),
  physicalExamFindings: z
    .string()
    .min(1, 'Los hallazgos del examen físico son requeridos.'),
  // Diagnosis and Plan
  diagnoses: z
    .array(
      z.object({
        cie10Code: z.string(),
        cie10Description: z.string(),
      })
    )
    .min(1, 'Debe añadir al menos un diagnóstico.'),
  fitnessForWork: z.enum(['Apto', 'Apto con Restricciones', 'No Apto']),
  occupationalRecommendations: z
    .string()
    .min(1, 'Las recomendaciones son requeridas.'),
  generalHealthPlan: z
    .string()
    .min(1, 'El plan de salud general es requerido.'),
  interconsultation: z.string().optional(),
  nextFollowUp: z.date().optional(),
}).refine(data => {
    if (data.patientType === 'Afiliado Externo') {
        return !!data.companyId;
    }
    return true;
}, {
    message: 'Debe seleccionar una empresa para afiliados externos.',
    path: ['companyId'],
});


interface OccupationalHealthFormProps {
  persona: Persona;
  empresas: Empresa[];
  onFinished: (data: z.infer<typeof occupationalHealthSchema>) => void;
  onCancel: () => void;
}

const steps = [
  {
    id: 'info',
    name: 'Información',
    icon: FileQuestion,
    fields: ['patientType', 'consultationPurpose', 'companyId'],
  },
  {
    id: 'occupational',
    name: 'Historia Ocupacional',
    icon: Briefcase,
    fields: ['jobPosition', 'jobDescription', 'occupationalRisks', 'riskDetails'],
  },
  {
    id: 'health',
    name: 'Salud Integral',
    icon: HeartPulse,
    fields: ['personalHistory', 'familyHistory', 'lifestyle', 'mentalHealth'],
  },
  {
    id: 'exam',
    name: 'Examen Físico',
    icon: Stethoscope,
    fields: ['vitalSigns', 'anthropometry', 'physicalExamFindings'],
  },
  {
    id: 'plan',
    name: 'Diagnóstico y Plan',
    icon: ClipboardCheck,
    fields: [
      'diagnoses',
      'fitnessForWork',
      'occupationalRecommendations',
      'generalHealthPlan',
      'interconsultation',
      'nextFollowUp',
    ],
  },
];

const riskOptions = [
  { id: 'ergonomicos', label: 'Ergonómicos' },
  { id: 'psicosociales', label: 'Psicosociales' },
  { id: 'biologicos', label: 'Biológicos' },
  { id: 'quimicos', label: 'Químicos' },
  { id: 'fisicos', label: 'Físicos' },
];

function CompanySelector({ field, empresas }: { field: any, empresas: Empresa[] }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              'w-full justify-between',
              !field.value && 'text-muted-foreground'
            )}
          >
            {field.value
              ? empresas.find((e) => e.id === field.value)?.name
              : 'Seleccione una empresa'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar empresa..." />
          <CommandEmpty>No se encontró empresa.</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {empresas.map((empresa) => (
                <CommandItem
                  value={empresa.name}
                  key={empresa.id}
                  onSelect={() => {
                    field.onChange(empresa.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      empresa.id === field.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {empresa.name}
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function OccupationalHealthForm({
  persona,
  empresas,
  onFinished,
  onCancel,
}: OccupationalHealthFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);

  const form = useForm<z.infer<typeof occupationalHealthSchema>>({
    resolver: zodResolver(occupationalHealthSchema),
    defaultValues: {
      patientType: undefined,
      consultationPurpose: undefined,
      jobPosition: '',
      jobDescription: '',
      occupationalRisks: [],
      riskDetails: '',
      personalHistory: '',
      familyHistory: '',
      lifestyle: {
        diet: '',
        physicalActivity: '',
        sleepQuality: '',
        smoking: '',
        alcohol: '',
      },
      mentalHealth: '',
      vitalSigns: {
        ta: '',
        fc: '',
        fr: '',
        temp: '',
      },
      anthropometry: { weight: 0, height: 0, imc: '0.00' },
      physicalExamFindings: '',
      diagnoses: [],
      fitnessForWork: undefined,
      occupationalRecommendations: '',
      generalHealthPlan: '',
      interconsultation: '',
    },
  });

  const { watch, setValue } = form;
  const patientType = watch('patientType');
  const weight = watch('anthropometry.weight');
  const height = watch('anthropometry.height');

  React.useEffect(() => {
    if (weight > 0 && height > 0) {
      const heightInMeters = height / 100;
      const imc = weight / (heightInMeters * heightInMeters);
      setValue('anthropometry.imc', imc.toFixed(2));
    }
  }, [weight, height, setValue]);

  const handleNext = async () => {
    const fields = steps[currentStep].fields;
    const output = await form.trigger(fields as any, { shouldFocus: true });
    if (!output) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
    }
  };

  async function onSubmit(values: z.infer<typeof occupationalHealthSchema>) {
    setIsSubmitting(true);
    await onFinished(values);
    setIsSubmitting(false);
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">
                  Evaluación de Salud Ocupacional
                </CardTitle>
                <CardDescription>
                  Paciente: {persona.nombreCompleto} ({calculateAge(new Date(persona.fechaNacimiento))} años)
                </CardDescription>
              </div>
               <Button variant="ghost" onClick={onCancel} type="button">Volver</Button>
            </div>
             <div className="flex items-center justify-center pt-4">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center text-center w-20">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors',
                        currentStep === index
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground',
                        currentStep > index && 'bg-primary/50 text-primary-foreground'
                      )}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs mt-1">{step.name}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'flex-auto border-t-2 transition-colors',
                        currentStep > index ? 'border-primary/50' : 'border-secondary'
                      )}
                    ></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 min-h-[400px]">
            {/* Step 0: Initial Info */}
            {currentStep === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="patientType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><User className="h-4 w-4"/>Tipo de Paciente</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Empleado Interno">
                            Empleado Interno
                          </SelectItem>
                          <SelectItem value="Beneficiario">Beneficiario</SelectItem>
                          <SelectItem value="Afiliado Externo">
                            Afiliado Externo
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="consultationPurpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><FileQuestion className="h-4 w-4"/>Propósito de la Consulta</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un propósito" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pre-ingreso">Pre-ingreso</SelectItem>
                          <SelectItem value="Periódica">Periódica</SelectItem>
                          <SelectItem value="Post-incapacidad">Post-incapacidad</SelectItem>
                          <SelectItem value="Retiro">Retiro</SelectItem>
                          <SelectItem value="Consulta de Morbilidad">Consulta de Morbilidad</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {patientType === 'Afiliado Externo' && (
                   <FormField
                      control={form.control}
                      name="companyId"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="flex items-center gap-2"><Building className="h-4 w-4"/>Empresa del Afiliado</FormLabel>
                          <CompanySelector field={field} empresas={empresas} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                )}
              </div>
            )}
             {/* Step 1: Occupational History */}
            {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="jobPosition" render={({ field }) => ( <FormItem><FormLabel>Puesto de Trabajo</FormLabel><FormControl><Input placeholder="Ej. Asistente Administrativo" {...field}/></FormControl><FormMessage/></FormItem>)} />
                    <FormField control={form.control} name="jobDescription" render={({ field }) => ( <FormItem><FormLabel>Descripción de Tareas</FormLabel><FormControl><Textarea placeholder="Describa las principales funciones..." {...field} rows={3}/></FormControl><FormMessage/></FormItem>)} />
                    <FormField control={form.control} name="occupationalRisks" render={() => (
                        <FormItem className="md:col-span-2">
                            <FormLabel>Riesgos Laborales</FormLabel>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 rounded-md border p-4">
                                {riskOptions.map((item) => (
                                    <FormField key={item.id} control={form.control} name="occupationalRisks"
                                        render={({ field }) => (
                                            <FormItem key={item.id} className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                                    const currentValue = field.value || [];
                                                    return checked ? field.onChange([...currentValue, item.id]) : field.onChange(currentValue.filter((value: string) => value !== item.id))
                                                }}/>
                                                </FormControl>
                                                <FormLabel className="font-normal">{item.label}</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                            <FormMessage/>
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="riskDetails" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Detalle Cualitativo de Exposición</FormLabel><FormControl><Textarea placeholder="Describa cómo y con qué frecuencia ocurre la exposición a los riesgos marcados..." {...field} rows={3}/></FormControl><FormMessage/></FormItem>)} />
                </div>
            )}
            {/* Step 2: Health History */}
            {currentStep === 2 && (
                <div className="space-y-6">
                    <FormField control={form.control} name="personalHistory" render={({ field }) => ( <FormItem><FormLabel>Antecedentes Personales (Enfermedades crónicas, alergias)</FormLabel><FormControl><Textarea placeholder="Ej. Hipertensión controlada, alergia a la penicilina..." {...field} rows={3}/></FormControl><FormMessage/></FormItem>)} />
                    <FormField control={form.control} name="familyHistory" render={({ field }) => ( <FormItem><FormLabel>Antecedentes Familiares</FormLabel><FormControl><Textarea placeholder="Ej. Padre con Diabetes, madre con cáncer de mama..." {...field} rows={3}/></FormControl><FormMessage/></FormItem>)} />
                    <div className="space-y-2 rounded-md border p-4">
                        <h4 className="font-medium text-sm">Estilo de Vida</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="lifestyle.diet" render={({ field }) => ( <FormItem><FormLabel className="font-normal">Alimentación</FormLabel><FormControl><Input placeholder="Ej. Balanceada, rica en vegetales" {...field}/></FormControl></FormItem>)} />
                            <FormField control={form.control} name="lifestyle.physicalActivity" render={({ field }) => ( <FormItem><FormLabel className="font-normal">Actividad Física</FormLabel><FormControl><Input placeholder="Ej. Camina 3 veces por semana" {...field}/></FormControl></FormItem>)} />
                            <FormField control={form.control} name="lifestyle.sleepQuality" render={({ field }) => ( <FormItem><FormLabel className="font-normal">Calidad del Sueño</FormLabel><FormControl><Input placeholder="Ej. Duerme 7-8 horas, reparador" {...field}/></FormControl></FormItem>)} />
                            <FormField control={form.control} name="lifestyle.smoking" render={({ field }) => ( <FormItem><FormLabel className="font-normal">Consumo de Tabaco</FormLabel><FormControl><Input placeholder="Ej. No fumador" {...field}/></FormControl></FormItem>)} />
                            <FormField control={form.control} name="lifestyle.alcohol" render={({ field }) => ( <FormItem><FormLabel className="font-normal">Consumo de Alcohol</FormLabel><FormControl><Input placeholder="Ej. Socialmente, fines de semana" {...field}/></FormControl></FormItem>)} />
                        </div>
                    </div>
                     <FormField control={form.control} name="mentalHealth" render={({ field }) => ( <FormItem><FormLabel>Salud Mental (Estrés, estado de ánimo)</FormLabel><FormControl><Textarea placeholder="Describa el estado de ánimo general, niveles de estrés, etc." {...field} rows={2}/></FormControl><FormMessage/></FormItem>)} />
                </div>
            )}
            {/* Step 3: Physical Exam */}
            {currentStep === 3 && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormField control={form.control} name="vitalSigns.ta" render={({ field }) => ( <FormItem><FormLabel>Tensión Arterial</FormLabel><FormControl><Input placeholder="Ej. 120/80 mmHg" {...field}/></FormControl></FormItem>)} />
                        <FormField control={form.control} name="vitalSigns.fc" render={({ field }) => ( <FormItem><FormLabel>Frec. Cardíaca</FormLabel><FormControl><Input placeholder="Ej. 75 lpm" {...field}/></FormControl></FormItem>)} />
                        <FormField control={form.control} name="vitalSigns.fr" render={({ field }) => ( <FormItem><FormLabel>Frec. Resp.</FormLabel><FormControl><Input placeholder="Ej. 16 rpm" {...field}/></FormControl></FormItem>)} />
                        <FormField control={form.control} name="vitalSigns.temp" render={({ field }) => ( <FormItem><FormLabel>Temperatura</FormLabel><FormControl><Input placeholder="Ej. 36.5 °C" {...field}/></FormControl></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <FormField control={form.control} name="anthropometry.weight" render={({ field }) => ( <FormItem><FormLabel>Peso (kg)</FormLabel><FormControl><Input type="number" placeholder="Ej. 70" {...field}/></FormControl><FormMessage/></FormItem>)} />
                         <FormField control={form.control} name="anthropometry.height" render={({ field }) => ( <FormItem><FormLabel>Talla (cm)</FormLabel><FormControl><Input type="number" placeholder="Ej. 175" {...field}/></FormControl><FormMessage/></FormItem>)} />
                         <FormField control={form.control} name="anthropometry.imc" render={({ field }) => ( <FormItem><FormLabel>IMC (kg/m²)</FormLabel><FormControl><Input readOnly className="bg-muted" {...field}/></FormControl><FormMessage/></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="physicalExamFindings" render={({ field }) => ( <FormItem><FormLabel>Hallazgos del Examen Físico Dirigido</FormLabel><FormControl><Textarea placeholder="Enfoque: osteomuscular (columna, hombros, muñecas), agudeza visual, audición, piel..." {...field} rows={5}/></FormControl><FormMessage/></FormItem>)} />
                </div>
            )}
            {/* Step 4: Diagnosis and Plan */}
            {currentStep === 4 && (
                <div className="space-y-6">
                    <FormField control={form.control} name="diagnoses" render={({ field }) => ( <FormItem><FormLabel>Diagnósticos (CIE-10)</FormLabel><Cie10Autocomplete selected={field.value} onChange={field.onChange}/><FormMessage/></FormItem>)} />
                    <FormField control={form.control} name="fitnessForWork" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><Vote className="h-4 w-4"/>Concepto de Aptitud Laboral</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un concepto"/></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Apto">Apto</SelectItem>
                                    <SelectItem value="Apto con Restricciones">Apto con Restricciones</SelectItem>
                                    <SelectItem value="No Apto">No Apto</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage/>
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="occupationalRecommendations" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Briefcase className="h-4 w-4"/>Recomendaciones Ocupacionales</FormLabel><FormControl><Textarea placeholder="Dirigidas al trabajador y la empresa (pausas activas, mejoras ergonómicas, etc.)" {...field} rows={3}/></FormControl><FormMessage/></FormItem>)} />
                    <FormField control={form.control} name="generalHealthPlan" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><HeartPulse className="h-4 w-4"/>Plan de Manejo de Salud General</FormLabel><FormControl><Textarea placeholder="Tratamientos, promoción de la salud, etc." {...field} rows={3}/></FormControl><FormMessage/></FormItem>)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <FormField control={form.control} name="interconsultation" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Forward className="h-4 w-4"/>Interconsultas (Opcional)</FormLabel><FormControl><Input placeholder="Ej. Referir a Fisioterapia" {...field}/></FormControl><FormMessage/></FormItem>)} />
                         <FormField control={form.control} name="nextFollowUp" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="flex items-center gap-2"><CalendarIcon className="h-4 w-4"/>Próximo Seguimiento (Opcional)</FormLabel>
                                <Popover><PopoverTrigger asChild><FormControl>
                                    <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                        {field.value ? format(field.value, 'PPP', {locale: es}) : <span>Seleccione fecha</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50"/>
                                    </Button>
                                </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent></Popover>
                                <FormMessage/>
                            </FormItem>
                         )} />
                    </div>
                </div>
            )}

          </CardContent>
          <CardFooter className="flex justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>

            {currentStep < steps.length - 1 && (
              <Button type="button" onClick={handleNext}>
                Siguiente <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {currentStep === steps.length - 1 && (
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar y Completar Evaluación
              </Button>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
