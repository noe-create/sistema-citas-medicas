
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, Globe, CreditCard, CalendarDays, Users as UsersIcon, Smartphone, Mail, MapPin, Hash, Briefcase } from 'lucide-react';
import type { Persona, Titular } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useToast } from '@/hooks/use-toast';
import { PersonaSearch } from './persona-search';
import { Textarea } from './ui/textarea';
import { calculateAge } from '@/lib/utils';
import { DEPARTMENTS_GROUPED, DEPARTMENTS } from '@/lib/departments';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { ScrollArea } from './ui/scroll-area';
import { useDebounce } from '@/hooks/use-debounce';


const patientSchema = z.object({
  primerNombre: z.string().min(1, 'El primer nombre es requerido.'),
  segundoNombre: z.string().optional(),
  primerApellido: z.string().min(1, 'El primer apellido es requerido.'),
  segundoApellido: z.string().optional(),
  nacionalidad: z.enum(['V', 'E']).optional(),
  cedulaNumero: z.string().regex(/^[0-9]*$/, "La cédula solo debe contener números.").min(7, { message: 'La cédula debe tener entre 7 y 8 dígitos.'}).max(8, { message: 'La cédula debe tener entre 7 y 8 dígitos.'}).optional().or(z.literal('')),
  numeroFicha: z.string().regex(/^[0-9]*$/, "La ficha solo debe contener números.").max(4, { message: 'El número de ficha no puede tener más de 4 dígitos.'}).optional(),
  fechaNacimiento: z.date({ required_error: 'La fecha de nacimiento es requerida.' }),
  genero: z.enum(['Masculino', 'Femenino'], { required_error: 'El género es requerido.' }),
  telefono1: z.string().optional(),
  telefono2: z.string().optional(),
  email: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
  direccion: z.string().optional(),
  unidadServicio: z.enum(['Empleado', 'Afiliado Corporativo', 'Privado'], {
    required_error: 'El tipo de cuenta es requerido.',
  }),
  representanteId: z.string().optional(),
}).refine(data => {
    if (data.fechaNacimiento) {
        const age = calculateAge(data.fechaNacimiento);
        if (age < 18 && !data.cedulaNumero) {
            return !!data.representanteId;
        }
    }
    return true;
}, {
    message: "Un representante es requerido para menores de edad sin cédula.",
    path: ["representanteId"],
});


type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  titular: Titular | null;
  onSubmitted: (...args: any[]) => Promise<void>;
  onCancel: () => void;
  excludeIds?: string[];
}

export function PatientForm({ titular, onSubmitted, onCancel, excludeIds = [] }: PatientFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);
  
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
        primerNombre: '',
        segundoNombre: '',
        primerApellido: '',
        segundoApellido: '',
        nacionalidad: 'V',
        cedulaNumero: '',
        numeroFicha: '',
        telefono1: '',
        telefono2: '',
        email: '',
        direccion: '',
        unidadServicio: undefined,
        representanteId: titular?.persona.representanteId || undefined
    },
  });

  const isPersonaSelected = !!selectedPersona;

  const fechaNacimiento = form.watch('fechaNacimiento');
  const cedulaNumero = form.watch('cedulaNumero');
  const unidadServicio = form.watch('unidadServicio');
  const [showRepresentativeField, setShowRepresentativeField] = React.useState(false);
  
  React.useEffect(() => {
    if (unidadServicio !== 'Empleado') {
        form.setValue('numeroFicha', '');
    }
  }, [unidadServicio, form]);

  React.useEffect(() => {
    if (isPersonaSelected) { 
        setShowRepresentativeField(false);
        return;
    }
    if (fechaNacimiento) {
      const age = calculateAge(fechaNacimiento);
      setShowRepresentativeField(age < 18 && !cedulaNumero);
    } else {
      setShowRepresentativeField(false);
    }
  }, [fechaNacimiento, cedulaNumero, isPersonaSelected]);

  const handleRepresentativeSelect = (p: Persona | null) => {
    form.setValue('representanteId', p?.id || '', { shouldValidate: true });
  };

  React.useEffect(() => {
    let personaToLoad: Persona | null = null;
    if (selectedPersona) {
        personaToLoad = selectedPersona;
    } else if (titular) {
        personaToLoad = titular.persona;
    }
    
    if (personaToLoad) {
        const dateString = personaToLoad.fechaNacimiento as unknown as string;
        const date = new Date(dateString);
        const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

        form.reset({
          ...form.getValues(),
          primerNombre: personaToLoad.primerNombre || '',
          segundoNombre: personaToLoad.segundoNombre || '',
          primerApellido: personaToLoad.primerApellido || '',
          segundoApellido: personaToLoad.segundoApellido || '',
          nacionalidad: personaToLoad.nacionalidad,
          cedulaNumero: personaToLoad.cedulaNumero,
          fechaNacimiento: utcDate,
          genero: personaToLoad.genero,
          telefono1: personaToLoad.telefono1,
          telefono2: personaToLoad.telefono2,
          email: personaToLoad.email || '',
          direccion: personaToLoad.direccion || '',
          representanteId: personaToLoad.representanteId || undefined,
        });
    }

    if (!selectedPersona && titular) {
        form.setValue('unidadServicio', titular.unidadServicio as any);
        form.setValue('numeroFicha', titular.numeroFicha);
    }
  }, [selectedPersona, titular, form]);


  async function onSubmit(values: PatientFormValues) {
    setIsSubmitting(true);
    
    const submissionData = {
        ...values,
    };

    if (titular) {
        await onSubmitted(titular.id, titular.personaId, submissionData);
    } else {
        let createData: any;
        if (selectedPersona) {
            createData = {
                personaId: selectedPersona.id,
                unidadServicio: submissionData.unidadServicio,
                numeroFicha: submissionData.numeroFicha,
            };
        } else {
            createData = {
                persona: submissionData,
                unidadServicio: submissionData.unidadServicio,
                numeroFicha: submissionData.numeroFicha,
            };
        }
        await onSubmitted(createData);
    }
    
    setIsSubmitting(false);
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!titular && (
            <div className="space-y-2 mb-6 border-b pb-6">
                <Label>Asignar Rol de Titular a Persona Existente</Label>
                <PersonaSearch 
                    onPersonaSelect={setSelectedPersona} 
                    excludeIds={excludeIds}
                    placeholder="Buscar para vincular..."
                />
                <p className="text-xs text-muted-foreground text-center">O llene los campos de abajo para crear una nueva persona.</p>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
            <FormField control={form.control} name="primerNombre" render={({ field }) => ( <FormItem><FormLabel>Primer Nombre</FormLabel><FormControl><Input {...field} disabled={isPersonaSelected} onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="segundoNombre" render={({ field }) => ( <FormItem><FormLabel>Segundo Nombre (Opcional)</FormLabel><FormControl><Input {...field} disabled={isPersonaSelected} onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="primerApellido" render={({ field }) => ( <FormItem><FormLabel>Primer Apellido</FormLabel><FormControl><Input {...field} disabled={isPersonaSelected} onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="segundoApellido" render={({ field }) => ( <FormItem><FormLabel>Segundo Apellido (Opcional)</FormLabel><FormControl><Input {...field} disabled={isPersonaSelected} onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} /></FormControl><FormMessage /></FormItem>)} />
            
            <FormField
                control={form.control}
                name="nacionalidad"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" />Nacionalidad</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} value={field.value} defaultValue="V" className="flex items-center space-x-4 pt-1" disabled={isPersonaSelected}>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="V" id="v" /></FormControl><Label htmlFor="v" className="font-normal">Venezolano</Label></FormItem>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="E" id="e" /></FormControl><Label htmlFor="e" className="font-normal">Extranjero</Label></FormItem>
                            </RadioGroup>
                        </FormControl>
                         <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                  control={form.control}
                  name="cedulaNumero"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" />Número de Cédula (Opcional)</FormLabel>
                      <FormControl>
                          <Input placeholder="Solo números" {...field} maxLength={8} value={field.value || ''} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))} disabled={isPersonaSelected}/>
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
              />

            <FormField
                control={form.control}
                name="fechaNacimiento"
                render={({ field }) => {
                    const selectedYear = field.value ? field.value.getUTCFullYear() : undefined;
                    const selectedMonth = field.value ? field.value.getUTCMonth() + 1 : undefined;
                    const selectedDay = field.value ? field.value.getUTCDate() : undefined;

                    const handleDateChange = (part: 'year' | 'month' | 'day', value: string) => {
                        let year = selectedYear || new Date().getFullYear();
                        let month = selectedMonth ? selectedMonth - 1 : new Date().getMonth();
                        let day = selectedDay || 1;

                        if (part === 'year') year = parseInt(value, 10);
                        else if (part === 'month') month = parseInt(value, 10) - 1;
                        else if (part === 'day') day = parseInt(value, 10);
                        
                        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
                        if (day > daysInMonth) day = daysInMonth;

                        const newDate = new Date(Date.UTC(year, month, day));
                        field.onChange(newDate);
                    };
                    
                    const years = Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - i);
                    const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('es', { month: 'long' }) }));
                    const daysInSelectedMonth = selectedYear && selectedMonth ? new Date(Date.UTC(selectedYear, selectedMonth, 0)).getUTCDate() : 31;
                    const days = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

                    return (
                        <FormItem className="md:col-span-2">
                            <FormLabel className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" />Fecha de Nacimiento</FormLabel>
                            <div className="grid grid-cols-3 gap-2">
                                <Select disabled={isPersonaSelected} onValueChange={(v) => handleDateChange('day', v)} value={selectedDay ? String(selectedDay) : ''}><FormControl><SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger></FormControl><SelectContent>{days.map((d) => (<SelectItem key={d} value={String(d)}>{d}</SelectItem>))}</SelectContent></Select>
                                <Select disabled={isPersonaSelected} onValueChange={(v) => handleDateChange('month', v)} value={selectedMonth ? String(selectedMonth) : ''}><FormControl><SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger></FormControl><SelectContent>{months.map((m) => (<SelectItem key={m.value} value={String(m.value)}><span className="capitalize">{m.label}</span></SelectItem>))}</SelectContent></Select>
                                <Select disabled={isPersonaSelected} onValueChange={(v) => handleDateChange('year', v)} value={selectedYear ? String(selectedYear) : ''}><FormControl><SelectTrigger><SelectValue placeholder="Año" /></SelectTrigger></FormControl><SelectContent>{years.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent></Select>
                            </div>
                            <FormMessage />
                        </FormItem>
                    );
                }}
            />
            <FormField
                control={form.control}
                name="genero"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2"><UsersIcon className="h-4 w-4 text-muted-foreground" />Género</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isPersonaSelected}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un género" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Femenino">Femenino</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField control={form.control} name="telefono1" render={({ field }) => ( <FormItem><FormLabel>Teléfono 1 (Opcional)</FormLabel><FormControl><Input placeholder="02125551234" {...field} value={field.value || ''} disabled={isPersonaSelected} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}/></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="telefono2" render={({ field }) => ( <FormItem><FormLabel>Teléfono 2 (Opcional)</FormLabel><FormControl><Input placeholder="04141234567" {...field} value={field.value || ''} disabled={isPersonaSelected} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}/></FormControl><FormMessage /></FormItem>)} />
            
            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />Email (Opcional)</FormLabel><FormControl><Input placeholder="juan.perez@email.com" {...field} value={field.value || ''} type="email" disabled={isPersonaSelected}/></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="direccion" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />Dirección (Opcional)</FormLabel><FormControl><Textarea placeholder="Av. Principal, Edificio Central, Piso 4, Oficina 4B, Caracas" {...field} value={field.value || ''} disabled={isPersonaSelected}/></FormControl><FormMessage /></FormItem>)} />

            {showRepresentativeField && (
                <div className="md:col-span-2 space-y-2 rounded-md border border-dashed p-4">
                    <p className="text-sm font-medium text-muted-foreground">Esta persona es un menor de edad sin cédula y requiere un representante.</p>
                    <FormField
                        control={form.control}
                        name="representanteId"
                        render={() => (
                            <FormItem>
                                <FormLabel>Buscar y Asignar Representante</FormLabel>
                                <PersonaSearch
                                    onPersonaSelect={handleRepresentativeSelect}
                                    placeholder="Buscar por nombre o cédula del representante..."
                                />
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </div>
            )}
            
            <FormField
              control={form.control}
              name="unidadServicio"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" />Tipo de Cuenta</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un tipo de cuenta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Empleado">Empleado</SelectItem>
                      <SelectItem value="Afiliado Corporativo">Afiliado Corporativo</SelectItem>
                      <SelectItem value="Privado">Privado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {unidadServicio === 'Empleado' && (
                <FormField
                    control={form.control}
                    name="numeroFicha"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground" />Número de Ficha</FormLabel>
                            <FormControl>
                                <Input placeholder="Máximo 4 dígitos" {...field} maxLength={4} value={field.value || ''} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
        </div>
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {titular ? 'Guardar Cambios' : 'Crear Titular'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
