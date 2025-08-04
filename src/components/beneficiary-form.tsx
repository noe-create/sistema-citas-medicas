
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
import { Loader2, User, CreditCard, CalendarDays, Users as UsersIcon, Globe } from 'lucide-react';
import type { Beneficiario, Persona } from '@/lib/types';
import { PersonaSearch } from './persona-search';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { calculateAge } from '@/lib/utils';

const beneficiarySchema = z.object({
  primerNombre: z.string().min(1, 'El primer nombre es requerido.'),
  segundoNombre: z.string().optional(),
  primerApellido: z.string().min(1, 'El primer apellido es requerido.'),
  segundoApellido: z.string().optional(),
  nacionalidad: z.enum(['V', 'E']).optional(),
  cedulaNumero: z.string().regex(/^[0-9]*$/, "La cédula solo debe contener números.").min(7, { message: 'La cédula debe tener entre 7 y 8 dígitos.'}).max(8, { message: 'La cédula debe tener entre 7 y 8 dígitos.'}).optional().or(z.literal('')),
  fechaNacimiento: z.date({ required_error: 'La fecha de nacimiento es requerida.' }),
  genero: z.enum(['Masculino', 'Femenino'], { required_error: 'El género es requerido.' }),
  email: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
  telefono1: z.string().optional(),
  telefono2: z.string().optional(),
  direccion: z.string().optional(),
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


type BeneficiaryFormValues = z.infer<typeof beneficiarySchema>;

interface BeneficiaryFormProps {
  beneficiario: Beneficiario | null;
  onSubmitted: (values: any) => Promise<void>;
  onCancel: () => void;
  excludeIds?: string[];
}

export function BeneficiaryForm({ beneficiario, onSubmitted, onCancel, excludeIds = [] }: BeneficiaryFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);

  const form = useForm<BeneficiaryFormValues>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
        primerNombre: '',
        segundoNombre: '',
        primerApellido: '',
        segundoApellido: '',
        nacionalidad: 'V',
        cedulaNumero: '',
        telefono1: '',
        telefono2: '',
        email: '',
        direccion: '',
        representanteId: beneficiario?.persona.representanteId || undefined
    },
  });

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
    } else if (beneficiario) {
        personaToLoad = beneficiario.persona;
    }

    if (personaToLoad) {
      form.reset({
        primerNombre: personaToLoad.primerNombre || '',
        segundoNombre: personaToLoad.segundoNombre || '',
        primerApellido: personaToLoad.primerApellido || '',
        segundoApellido: personaToLoad.segundoApellido || '',
        nacionalidad: personaToLoad.nacionalidad,
        cedulaNumero: personaToLoad.cedulaNumero,
        fechaNacimiento: new Date(personaToLoad.fechaNacimiento),
        genero: personaToLoad.genero,
        email: personaToLoad.email || '',
        telefono1: personaToLoad.telefono1 || '',
        telefono2: personaToLoad.telefono2 || '',
        direccion: personaToLoad.direccion || '',
        representanteId: personaToLoad.representanteId || undefined
      });
    }
  }, [selectedPersona, beneficiario, form.reset, form]);

  async function onSubmit(values: BeneficiaryFormValues) {
    setIsSubmitting(true);
    if (selectedPersona) {
      await onSubmitted({ personaId: selectedPersona.id });
    } else {
        await onSubmitted({ persona: values }); // For new/update person
    }
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!beneficiario && (
            <div className="space-y-2 mb-6">
                <Label>Vincular Persona Existente como Beneficiario</Label>
                <PersonaSearch 
                    onPersonaSelect={setSelectedPersona}
                    excludeIds={excludeIds}
                    placeholder="Buscar persona para añadir..."
                />
                <p className="text-xs text-muted-foreground">O llene los campos de abajo para crear una nueva persona.</p>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
            <FormField control={form.control} name="primerNombre" render={({ field }) => ( <FormItem><FormLabel>Primer Nombre</FormLabel><FormControl><Input placeholder="Ej. Ana" {...field} disabled={isPersonaSelected} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="segundoNombre" render={({ field }) => ( <FormItem><FormLabel>Segundo Nombre</FormLabel><FormControl><Input {...field} disabled={isPersonaSelected} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="primerApellido" render={({ field }) => ( <FormItem><FormLabel>Primer Apellido</FormLabel><FormControl><Input placeholder="Ej. Pérez" {...field} disabled={isPersonaSelected} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="segundoApellido" render={({ field }) => ( <FormItem><FormLabel>Segundo Apellido</FormLabel><FormControl><Input {...field} disabled={isPersonaSelected} /></FormControl><FormMessage /></FormItem>)} />
            
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
                        <FormControl><Input placeholder="Solo números" {...field} maxLength={8} value={field.value || ''} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))} disabled={isPersonaSelected}/></FormControl>
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

                        if (part === 'year') {
                            year = parseInt(value, 10);
                        } else if (part === 'month') {
                            month = parseInt(value, 10) - 1;
                        } else if (part === 'day') {
                            day = parseInt(value, 10);
                        }
                        
                        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
                        if (day > daysInMonth) {
                            day = daysInMonth;
                        }

                        const newDate = new Date(Date.UTC(year, month, day));
                        field.onChange(newDate);
                    };
                    
                    const years = Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - i);
                    const months = Array.from({ length: 12 }, (_, i) => ({
                        value: i + 1,
                        label: new Date(0, i).toLocaleString('es', { month: 'long' }),
                    }));
                    const daysInSelectedMonth = selectedYear && selectedMonth ? new Date(Date.UTC(selectedYear, selectedMonth, 0)).getUTCDate() : 31;
                    const days = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

                    return (
                        <FormItem className="md:col-span-2">
                            <FormLabel className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" />Fecha de Nacimiento</FormLabel>
                            <div className="grid grid-cols-3 gap-2">
                                <Select onValueChange={(value) => handleDateChange('day', value)} value={selectedDay ? String(selectedDay) : ''} disabled={isPersonaSelected}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger></FormControl>
                                    <SelectContent>{days.map((d) => (<SelectItem key={d} value={String(d)}>{d}</SelectItem>))}</SelectContent>
                                </Select>
                                <Select onValueChange={(value) => handleDateChange('month', value)} value={selectedMonth ? String(selectedMonth) : ''} disabled={isPersonaSelected}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger></FormControl>
                                    <SelectContent>{months.map((m) => (<SelectItem key={m.value} value={String(m.value)}><span className="capitalize">{m.label}</span></SelectItem>))}</SelectContent>
                                </Select>
                                <Select onValueChange={(value) => handleDateChange('year', value)} value={selectedYear ? String(selectedYear) : ''} disabled={isPersonaSelected}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Año" /></SelectTrigger></FormControl>
                                    <SelectContent>{years.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent>
                                </Select>
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
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un género" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="correo@ejemplo.com" {...field} disabled={isPersonaSelected}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showRepresentativeField && (
                <div className="md:col-span-2 space-y-2 rounded-md border border-dashed p-4">
                    <p className="text-sm font-medium text-muted-foreground">Este beneficiario es un menor de edad sin cédula y requiere un representante.</p>
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
        </div>
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {beneficiario ? 'Guardar Cambios' : 'Crear Beneficiario'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
