'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, DollarSign, FileText, Package } from 'lucide-react';
import type { Service } from '@/lib/types';

const serviceSchema = z.object({
  name: z.string().min(3, { message: 'El nombre es requerido.' }),
  description: z.string().min(1, 'La descripción es requerida.'),
  price: z.coerce.number().min(0, { message: 'El precio debe ser un número positivo.' }),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  service: Service | null;
  onSubmitted: (values: Omit<Service, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export function ServiceForm({ service, onSubmitted, onCancel }: ServiceFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service?.name || '',
      description: service?.description || '',
      price: service?.price || 0,
    },
  });

  async function onSubmit(values: ServiceFormValues) {
    setIsSubmitting(true);
    await onSubmitted(values);
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Package className="h-4 w-4 text-muted-foreground"/>Nombre del Servicio</FormLabel>
              <FormControl><Input placeholder="Ej. Consulta Pediátrica" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground"/>Descripción</FormLabel>
              <FormControl><Textarea placeholder="Describe brevemente el servicio" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground"/>Precio (VES)</FormLabel>
              <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {service ? 'Guardar Cambios' : 'Crear Servicio'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
