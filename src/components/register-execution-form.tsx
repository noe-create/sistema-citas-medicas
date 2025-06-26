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
import type { TreatmentOrder } from '@/lib/types';

const executionSchema = z.object({
  observations: z.string().min(1, 'Las observaciones son requeridas.'),
});

type ExecutionFormValues = z.infer<typeof executionSchema>;

interface RegisterExecutionFormProps {
  treatmentOrder: TreatmentOrder;
  onSubmitted: (values: { treatmentOrderId: string; observations: string }) => Promise<void>;
  onCancel: () => void;
}

export function RegisterExecutionForm({ treatmentOrder, onSubmitted, onCancel }: RegisterExecutionFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ExecutionFormValues>({
    resolver: zodResolver(executionSchema),
    defaultValues: {
      observations: '',
    },
  });

  async function onSubmit(values: ExecutionFormValues) {
    setIsSubmitting(true);
    await onSubmitted({
        treatmentOrderId: treatmentOrder.id,
        observations: values.observations
    });
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
            <h3 className="font-medium">Procedimiento:</h3>
            <p className="text-sm text-muted-foreground p-3 border rounded-md bg-secondary/50">{treatmentOrder.procedureDescription}</p>
        </div>
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
