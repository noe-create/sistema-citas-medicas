
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { TreatmentOrderItem } from '@/lib/types';

const executionSchema = z.object({
  observations: z.string().min(1, 'Las observaciones son requeridas.'),
});

type ExecutionFormValues = z.infer<typeof executionSchema>;

interface RegisterExecutionFormProps {
  treatmentOrderItem: TreatmentOrderItem;
  onSubmitted: (values: { treatmentOrderItemId: string; observations: string }) => Promise<void>;
  onCancel: () => void;
}

export function RegisterExecutionForm({ treatmentOrderItem, onSubmitted, onCancel }: RegisterExecutionFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ExecutionFormValues>({
    resolver: zodResolver(executionSchema),
    defaultValues: {
      observations: 'Procedimiento realizado según lo indicado.',
    },
  });

  async function onSubmit(values: ExecutionFormValues) {
    setIsSubmitting(true);
    await onSubmitted({
        treatmentOrderItemId: treatmentOrderItem.id,
        observations: values.observations
    });
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observaciones de la Ejecución</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describa cómo se realizó el procedimiento, cualquier evento notable, etc."
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Ejecución
          </Button>
        </div>
      </form>
    </Form>
  );
}
