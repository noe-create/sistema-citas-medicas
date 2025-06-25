
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
import type { Beneficiario } from '@/lib/types';

const beneficiarySchema = z.object({
  nombreCompleto: z.string().min(3, { message: 'El nombre es requerido.' }),
  cedula: z.string().min(5, { message: 'La cédula es requerida.' }),
  fechaNacimiento: z.date({
    required_error: 'La fecha de nacimiento es requerida.',
  }),
  genero: z.enum(['Masculino', 'Femenino', 'Otro'], {
    required_error: 'El género es requerido.',
  }),
});

type BeneficiaryFormValues = z.infer<typeof beneficiarySchema>;

interface BeneficiaryFormProps {
  beneficiario: Omit<Beneficiario, 'titularId'> | null;
  onSubmitted: (values: BeneficiaryFormValues) => Promise<void>;
  onCancel: () => void;
}

export function BeneficiaryForm({ beneficiario, onSubmitted, onCancel }: BeneficiaryFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<BeneficiaryFormValues>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      nombreCompleto: beneficiario?.nombreCompleto || '',
      cedula: beneficiario?.cedula || '',
      fechaNacimiento: beneficiario?.fechaNacimiento ? new Date(beneficiario.fechaNacimiento) : undefined,
      genero: beneficiario?.genero || undefined,
    },
  });

  React.useEffect(() => {
    form.reset({
      nombreCompleto: beneficiario?.nombreCompleto || '',
      cedula: beneficiario?.cedula || '',
      fechaNacimiento: beneficiario?.fechaNacimiento ? new Date(beneficiario.fechaNacimiento) : undefined,
      genero: beneficiario?.genero || undefined,
    });
  }, [beneficiario, form.reset]);

  async function onSubmit(values: BeneficiaryFormValues) {
    setIsSubmitting(true);
    await onSubmitted(values);
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
            <FormField
              control={form.control}
              name="nombreCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Ana Pérez" {...field} />
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
                    <Input placeholder="V-23456789" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
