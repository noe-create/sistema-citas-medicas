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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
                render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                    <FormLabel>Fecha de Nacimiento</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP", { locale: es })
                            ) : (
                                <span>Seleccione una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            captionLayout="dropdown-buttons"
                            fromYear={1920}
                            toYear={new Date().getFullYear()}
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
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
