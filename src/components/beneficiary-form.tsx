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
import { Loader2 } from 'lucide-react';
import type { Beneficiario, Persona } from '@/lib/types';
import { PersonaSearch } from './persona-search';
import { Label } from './ui/label';

const beneficiarySchema = z.object({
  nombreCompleto: z.string().min(3, { message: 'El nombre es requerido.' }),
  cedula: z.string().min(5, { message: 'La cédula es requerida.' }),
  fechaNacimiento: z.date({
    required_error: 'La fecha de nacimiento es requerida.',
  }),
  genero: z.enum(['Masculino', 'Femenino', 'Otro'], {
    required_error: 'El género es requerido.',
  }),
  email: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
  telefono: z.string().optional(),
  telefonoCelular: z.string().optional(),
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
      nombreCompleto: beneficiario?.persona.nombreCompleto || '',
      cedula: beneficiario?.persona.cedula || '',
      fechaNacimiento: beneficiario?.persona.fechaNacimiento ? new Date(beneficiario.persona.fechaNacimiento) : undefined,
      genero: beneficiario?.persona.genero || undefined,
      email: beneficiario?.persona.email || '',
      telefono: beneficiario?.persona.telefono || '',
      telefonoCelular: beneficiario?.persona.telefonoCelular || '',
    },
  });

  const isPersonaSelected = !!selectedPersona;

  React.useEffect(() => {
    // Populate form if an existing person is selected
    if (selectedPersona) {
      form.reset({
        nombreCompleto: selectedPersona.nombreCompleto,
        cedula: selectedPersona.cedula,
        fechaNacimiento: new Date(selectedPersona.fechaNacimiento),
        genero: selectedPersona.genero,
        email: selectedPersona.email || '',
        telefono: selectedPersona.telefono || '',
        telefonoCelular: selectedPersona.telefonoCelular || '',
      });
    }
  }, [selectedPersona, form]);
  
  React.useEffect(() => {
    // Populate form if editing an existing beneficiary
    if (beneficiario) {
        form.reset({
            nombreCompleto: beneficiario.persona.nombreCompleto,
            cedula: beneficiario.persona.cedula,
            fechaNacimiento: new Date(beneficiario.persona.fechaNacimiento),
            genero: beneficiario.persona.genero,
            email: beneficiario.persona.email || '',
            telefono: beneficiario.persona.telefono || '',
            telefonoCelular: beneficiario.persona.telefonoCelular || '',
        });
    }
  }, [beneficiario, form]);

  async function onSubmit(values: BeneficiaryFormValues) {
    setIsSubmitting(true);
    if (selectedPersona) {
      await onSubmitted({ personaId: selectedPersona.id });
    } else if (beneficiario) {
      await onSubmitted(values) // For updates
    } else {
      await onSubmitted({ persona: values }); // For new person creation
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
            <FormField
              control={form.control}
              name="nombreCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Ana Pérez" {...field} disabled={isPersonaSelected} />
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
                  <FormLabel>Cédula</FormLabel>
                  <FormControl>
                    <Input placeholder="V-23456789" {...field} disabled={isPersonaSelected}/>
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
                            <FormLabel>Fecha de Nacimiento</FormLabel>
                            <div className="grid grid-cols-3 gap-2">
                                <Select
                                    onValueChange={(value) => handleDateChange('day', value)}
                                    value={selectedDay ? String(selectedDay) : ''}
                                    disabled={isPersonaSelected}
                                >
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Día" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {days.map((d) => (
                                        <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    onValueChange={(value) => handleDateChange('month', value)}
                                    value={selectedMonth ? String(selectedMonth) : ''}
                                    disabled={isPersonaSelected}
                                >
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Mes" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {months.map((m) => (
                                        <SelectItem key={m.value} value={String(m.value)}>
                                        <span className="capitalize">{m.label}</span>
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    onValueChange={(value) => handleDateChange('year', value)}
                                    value={selectedYear ? String(selectedYear) : ''}
                                    disabled={isPersonaSelected}
                                >
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Año" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {years.map((y) => (
                                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                                    </SelectContent>
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
                    <FormLabel>Género</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isPersonaSelected}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un género" />
                        </SelectTrigger>
                        </FormControl>
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
