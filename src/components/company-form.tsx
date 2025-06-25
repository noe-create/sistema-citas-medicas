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
import { Loader2 } from 'lucide-react';
import type { Empresa } from '@/lib/types';
import { Textarea } from './ui/textarea';

const companySchema = z.object({
  name: z.string().min(3, { message: 'El nombre es requerido.' }),
  rif: z.string().min(9, { message: 'El RIF es requerido y debe tener un formato válido (ej. J-12345678-9).' }),
  telefono: z.string().min(10, { message: 'El teléfono es requerido.' }),
  direccion: z.string().min(10, { message: 'La dirección es requerida.' }),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyFormProps {
  empresa: Empresa | null;
  onSubmitted: (values: CompanyFormValues) => Promise<void>;
  onCancel: () => void;
}

export function CompanyForm({ empresa, onSubmitted, onCancel }: CompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: empresa?.name || '',
      rif: empresa?.rif || '',
      telefono: empresa?.telefono || '',
      direccion: empresa?.direccion || '',
    },
  });

  React.useEffect(() => {
    form.reset({
      name: empresa?.name || '',
      rif: empresa?.rif || '',
      telefono: empresa?.telefono || '',
      direccion: empresa?.direccion || '',
    });
  }, [empresa, form.reset]);

  async function onSubmit(values: CompanyFormValues) {
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Innovatech Solutions" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rif"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RIF</FormLabel>
                  <FormControl>
                    <Input placeholder="J-12345678-9" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="0212-555-1122" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                    <FormItem className="md:col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Av. Principal, Edificio Central, Piso 4, Oficina 4B, Caracas" {...field} />
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
                {empresa ? 'Guardar Cambios' : 'Crear Empresa'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
