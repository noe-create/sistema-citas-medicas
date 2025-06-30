

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
import { Loader2, User, Globe, CreditCard, CalendarDays, Users as UsersIcon, Smartphone, Mail, Phone, MapPin } from 'lucide-react';
import type { Persona } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';
import { calculateAge } from '@/lib/utils';
import { PersonaSearch } from './persona-search';

const personSchema = z.object({
  primerNombre: z.string().min(1, 'El primer nombre es requerido.'),
  segundoNombre: z.string().optional(),
  primerApellido: z.string().min(1, 'El primer apellido es requerido.'),
  segundoApellido: z.string().optional(),
  nacionalidad: z.enum(['V', 'E'], { required_error: 'La nacionalidad es requerida.' }),
  cedula: z.string().regex(/^[0-9]*$/, "La cédula solo debe contener números.").optional(),
  fechaNacimiento: z.date({
    required_error: 'La fecha de nacimiento es requerida.',
  }),
  genero: z.enum(['Masculino', 'Femenino', 'Otro'], {
    required_error: 'El género es requerido.',
  }),
  telefono1: z.string().optional(),
  telefono2: z.string().optional(),
  email: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
  direccion: z.string().optional(),
  representanteId: z.string().optional(),
}).refine(data => {
    if (data.fechaNacimiento) {
        const age = calculateAge(data.fechaNacimiento);
        if (age < 18 && !data.cedula) {
            return !!data.representanteId;
        }
    }
    return true;
}, {
    message: "Un representante es requerido para menores de edad sin cédula.",
    path: ["representanteId"],
});


type PersonFormValues = z.infer<typeof personSchema>;

interface PersonFormProps {
  persona: Persona | null;
  onSubmitted: (values: any) => Promise<void>;
  onCancel: () => void;
}

export function PersonForm({ persona, onSubmitted, onCancel }: PersonFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      primerNombre: '',
      segundoNombre: '',
      primerApellido: '',
      segundoApellido: '',
      nacionalidad: 'V',
      cedula: '',
      telefono1: '',
      telefono2: '',
      email: '',
      direccion: '',
      representanteId: persona?.representanteId || undefined
    },
  });

  const fechaNacimiento = form.watch('fechaNacimiento');
  const cedula = form.watch('cedula');
  const [showRepresentativeField, setShowRepresentativeField] = React.useState(false);

  React.useEffect(() => {
    if (fechaNacimiento) {
      const age = calculateAge(fechaNacimiento);
      setShowRepresentativeField(age < 18 && !cedula);
    } else {
      setShowRepresentativeField(false);
    }
  }, [fechaNacimiento, cedula]);

  const handleRepresentativeSelect = (p: Persona | null) => {
    form.setValue('representanteId', p?.id || '', { shouldValidate: true });
  };


  React.useEffect(() => {
    const parseCedula = (cedulaStr?: string): { nacionalidad: 'V' | 'E', cedula: string } => {
        if (!cedulaStr) return { nacionalidad: 'V', cedula: '' };
        const match = cedulaStr.match(/^([VE])-?(\d+)$/);
        if (match) {
            return { nacionalidad: match[1] as 'V' | 'E', cedula: match[2] };
        }
        return { nacionalidad: 'V', cedula: cedulaStr.replace(/\D/g, '') };
    }
    
    if (persona) {
        const { nacionalidad, cedula } = parseCedula(persona.cedula);
        form.reset({
          primerNombre: persona.primerNombre || '',
          segundoNombre: persona.segundoNombre || '',
          primerApellido: persona.primerApellido || '',
          segundoApellido: persona.segundoApellido || '',
          nacionalidad: nacionalidad,
          cedula: cedula,
          fechaNacimiento: persona.fechaNacimiento ? new Date(persona.fechaNacimiento) : undefined,
          genero: persona.genero || undefined,
          telefono1: persona.telefono1 || '',
          telefono2: persona.telefono2 || '',
          email: persona.email || '',
          direccion: persona.direccion || '',
          representanteId: persona.representanteId || undefined,
        });
    } else {
        form.reset({
            primerNombre: '',
            segundoNombre: '',
            primerApellido: '',
            segundoApellido: '',
            nacionalidad: 'V',
            cedula: '',
            fechaNacimiento: undefined,
            genero: undefined,
            telefono1: '',
            telefono2: '',
            email: '',
            direccion: '',
            representanteId: undefined,
        });
    }
  }, [persona, form]);

  async function onSubmit(values: PersonFormValues) {
    setIsSubmitting(true);
    const submissionData: any = {
        ...values,
        cedula: values.cedula ? `${values.nacionalidad}-${values.cedula}` : null,
    };
    delete submissionData.nacionalidad;
    await onSubmitted(submissionData);
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
            <FormField control={form.control} name="primerNombre" render={({ field }) => ( <FormItem><FormLabel>Primer Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="segundoNombre" render={({ field }) => ( <FormItem><FormLabel>Segundo Nombre (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="primerApellido" render={({ field }) => ( <FormItem><FormLabel>Primer Apellido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="segundoApellido" render={({ field }) => ( <FormItem><FormLabel>Segundo Apellido (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            
            <FormField
                control={form.control}
                name="nacionalidad"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            Nacionalidad
                        </FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} value={field.value} defaultValue="V" className="flex items-center space-x-4 pt-1">
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
                  name="cedula"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        Número de Cédula (Opcional)
                      </FormLabel>
                      <FormControl>
                          <Input placeholder="Solo números" {...field} value={field.value || ''} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}/>
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
                                <Select onValueChange={(v) => handleDateChange('day', v)} value={selectedDay ? String(selectedDay) : ''}><FormControl><SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger></FormControl><SelectContent>{days.map((d) => (<SelectItem key={d} value={String(d)}>{d}</SelectItem>))}</SelectContent></Select>
                                <Select onValueChange={(v) => handleDateChange('month', v)} value={selectedMonth ? String(selectedMonth) : ''}><FormControl><SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger></FormControl><SelectContent>{months.map((m) => (<SelectItem key={m.value} value={String(m.value)}><span className="capitalize">{m.label}</span></SelectItem>))}</SelectContent></Select>
                                <Select onValueChange={(v) => handleDateChange('year', v)} value={selectedYear ? String(selectedYear) : ''}><FormControl><SelectTrigger><SelectValue placeholder="Año" /></SelectTrigger></FormControl><SelectContent>{years.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent></Select>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un género" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Femenino">Femenino</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField control={form.control} name="telefono1" render={({ field }) => ( <FormItem><FormLabel>Teléfono 1 (Opcional)</FormLabel><FormControl><Input placeholder="0212-5551234" {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="telefono2" render={({ field }) => ( <FormItem><FormLabel>Teléfono 2 (Opcional)</FormLabel><FormControl><Input placeholder="0414-1234567" {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>)} />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />Email (Opcional)</FormLabel>
                  <FormControl><Input placeholder="juan.perez@email.com" {...field} value={field.value || ''} type="email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />Dirección (Opcional)</FormLabel>
                  <FormControl><Textarea placeholder="Av. Principal, Edificio Central, Piso 4, Oficina 4B, Caracas" {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
        </div>
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {persona ? 'Guardar Cambios' : 'Crear Persona'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
