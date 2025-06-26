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
import { Loader2, Code2, FileText } from 'lucide-react';
import type { Cie10Code } from '@/lib/types';
import { Textarea } from './ui/textarea';

const cie10Schema = z.object({
  code: z.string().min(3, { message: 'El código es requerido y debe tener al menos 3 caracteres.' }).regex(/^[A-Z0-9.]+$/, 'El código solo puede contener letras mayúsculas, números y puntos.'),
  description: z.string().min(10, { message: 'La descripción es requerida y debe tener al menos 10 caracteres.' }),
});

type Cie10FormValues = z.infer<typeof cie10Schema>;

interface Cie10FormProps {
  cie10Code: Cie10Code | null;
  onSubmitted: (values: Cie10Code) => Promise<void>;
  onCancel: () => void;
}

export function Cie10Form({ cie10Code, onSubmitted, onCancel }: Cie10FormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<Cie10FormValues>({
    resolver: zodResolver(cie10Schema),
    defaultValues: {
      code: cie10Code?.code || '',
      description: cie10Code?.description || '',
    },
  });

  async function onSubmit(values: Cie10FormValues) {
    setIsSubmitting(true);
    await onSubmitted(values);
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-muted-foreground" />
                    Código
                  </FormLabel>
                  <FormControl>
                    <Input 
                        placeholder="Ej. J00" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        disabled={!!cie10Code} // Disable editing of primary key
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Descripción
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej. Nasofaringitis aguda (resfriado común)" {...field} rows={3}/>
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
                {cie10Code ? 'Guardar Cambios' : 'Crear Código'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
