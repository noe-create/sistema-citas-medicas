
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
import { Loader2, Check, ChevronsUpDown, User, Globe, CreditCard, CalendarDays, Users as UsersIcon, Smartphone, Mail, MapPin, Hash, Briefcase } from 'lucide-react';
import type { Persona, Titular } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PersonaSearch } from './persona-search';
import { Textarea } from './ui/textarea';
import { calculateAge } from '@/lib/utils';
import { DEPARTMENTS } from '@/lib/departments';


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
  unidadServicio: z.string().min(1, 'La unidad/servicio es requerida.'),
  unidadServicioOtro: z.string().optional(),
  representanteId: z.string().optional(),
}).refine(data => {
    if (data.unidadServicio === 'Otro') {
        return !!data.unidadServicioOtro && data.unidadServicioOtro.trim().length > 0;
    }
    return true;
}, {
    message: "Por favor, especifique la otra unidad/servicio.",
    path: ["unidadServicioOtro"],
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
  const [unitPopoverOpen, setUnitPopoverOpen] = React.useState(false);
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
        unidadServicio: '',
        unidadServicioOtro: '',
        representanteId: titular?.persona.representanteId || undefined
    },
  });

  const unidadServicio = form.watch('unidadServicio');
  const isPersonaSelected = !!selectedPersona;

  const fechaNacimiento = form.watch('fechaNacimiento');
  const cedulaNumero = form.watch('cedulaNumero');
  const [showRepresentativeField, setShowRepresentativeField] = React.useState(false);

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
        form.reset({
          ...form.getValues(),
          primerNombre: personaToLoad.primerNombre || '',
          segundoNombre: personaToLoad.segundoNombre || '',
          primerApellido: personaToLoad.primerApellido || '',
          segundoApellido: personaToLoad.segundoApellido || '',
          nacionalidad: personaToLoad.nacionalidad,
          cedulaNumero: personaToLoad.cedulaNumero,
          fechaNacimiento: new Date(personaToLoad.fechaNacimiento),
          genero: personaToLoad.genero,
          telefono1: personaToLoad.telefono1,
          telefono2: personaToLoad.telefono2,
          email: personaToLoad.email || '',
          direccion: personaToLoad.direccion || '',
          representanteId: personaToLoad.representanteId || undefined,
        });
    }

    if (!selectedPersona && titular) {
        const isStandardUnit = DEPARTMENTS.includes(titular.unidadServicio);
        form.setValue('unidadServicio', isStandardUnit ? titular.unidadServicio : 'Otro');
        form.setValue('unidadServicioOtro', isStandardUnit ? '' : titular.unidadServicio);
        form.setValue('numeroFicha', titular.numeroFicha);
    }
  }, [selectedPersona, titular, form]);


  async function onSubmit(values: PatientFormValues) {
    setIsSubmitting(true);
    
    const finalUnidadServicio = values.unidadServicio === 'Otro' ? values.unidadServicioOtro : values.unidadServicio;
    
    const submissionData = {
        ...values,
        unidadServicio: finalUnidadServicio,
    };
    delete (submissionData as any).unidadServicioOtro;

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
                  name="numeroFicha"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground" />Número de Ficha (Opcional)</FormLabel>
                          <FormControl>
                              <Input placeholder="Máximo 4 dígitos" {...field} maxLength={4} value={field.value || ''} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))} />
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
            
            <div className="md:col-span-2 space-y-2">
                <FormField
                    control={form.control}
                    name="unidadServicio"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" />Unidad/Servicio</FormLabel>
                            <Popover open={unitPopoverOpen} onOpenChange={setUnitPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant="outline" role="combobox" className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? DEPARTMENTS.find((unit) => unit === field.value) || field.value : "Seleccione una unidad/servicio"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Buscar unidad o servicio..." />
                                        <CommandList>
                                            <CommandEmpty>No se encontró la unidad.</CommandEmpty>
                                            <CommandGroup>
                                                {[...DEPARTMENTS, 'Otro'].map((unit) => (
                                                    <CommandItem
                                                        value={unit}
                                                        key={unit}
                                                        onSelect={() => {
                                                            form.setValue("unidadServicio", unit, { shouldValidate: true });
                                                            setUnitPopoverOpen(false);
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", unit === field.value ? "opacity-100" : "opacity-0")} />
                                                        {unit}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {unidadServicio === 'Otro' && (
                    <FormField
                        control={form.control}
                        name="unidadServicioOtro"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Especifique la Unidad/Servicio</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nombre del departamento" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
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
