'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import type { Persona } from '@/lib/types';
import { HceSearch } from './hce-search';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getPacienteByPersonaId } from '@/actions/patient-actions';
import { useToast } from '@/hooks/use-toast';

const orderSchema = z.object({
  pacienteId: z.string().min(1, 'Debe seleccionar un paciente.'),
  procedureDescription: z.string().min(10, 'La descripción es requerida y debe ser detallada.'),
  frequency: z.string().min(3, 'La frecuencia es requerida.'),
  dateRange: z.object({
    from: z.date({ required_error: 'La fecha de inicio es requerida.' }),
    to: z.date({ required_error: 'La fecha de fin es requerida.' }),
  }),
  notes: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface TreatmentOrderFormProps {
  onSubmitted: (values: {
    pacienteId: string;
    procedureDescription: string;
    frequency: string;
    startDate: Date;
    endDate: Date;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function TreatmentOrderForm({ onSubmitted, onCancel }: TreatmentOrderFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      pacienteId: '',
      procedureDescription: '',
      frequency: '',
      dateRange: { from: new Date(), to: new Date() },
      notes: '',
    },
  });

  React.useEffect(() => {
    const fetchPacienteId = async () => {
      if (selectedPersona) {
        const paciente = await getPacienteByPersonaId(selectedPersona.id);
        if (paciente) {
          form.setValue('pacienteId', paciente.id, { shouldValidate: true });
        } else {
          toast({
            title: 'Error',
            description: 'Esta persona no tiene un registro de paciente asociado.',
            variant: 'destructive',
          });
          form.setValue('pacienteId', '', { shouldValidate: true });
        }
      } else {
        form.setValue('pacienteId', '', { shouldValidate: true });
      }
    };
    fetchPacienteId();
  }, [selectedPersona, form, toast]);

  async function onSubmit(values: OrderFormValues) {
    setIsSubmitting(true);
    await onSubmitted({
      pacienteId: values.pacienteId,
      procedureDescription: values.procedureDescription,
      frequency: values.frequency,
      startDate: values.dateRange.from,
      endDate: values.dateRange.to,
      notes: values.notes,
    });
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <FormLabel>Paciente</FormLabel>
          <HceSearch onPersonaSelect={setSelectedPersona} />
           <FormField
              control={form.control}
              name="pacienteId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <FormField
          control={form.control}
          name="procedureDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción del Procedimiento</FormLabel>
              <FormControl>
                <Textarea placeholder="Ej. Cura de herida en miembro inferior izquierdo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frecuencia</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Interdiaria, Semanal, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Controller
            control={form.control}
            name="dateRange"
            render={({ field, fieldState }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Vigencia del Tratamiento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value.from && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value.from ? (
                          field.value.to ? (
                            <>
                              {format(field.value.from, 'LLL dd, y', { locale: es })} -{' '}
                              {format(field.value.to, 'LLL dd, y', { locale: es })}
                            </>
                          ) : (
                            format(field.value.from, 'LLL dd, y', { locale: es })
                          )
                        ) : (
                          <span>Seleccione un rango de fechas</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={field.value.from}
                      selected={{ from: field.value.from, to: field.value.to }}
                      onSelect={(range) => field.onChange({ from: range?.from, to: range?.to })}
                      numberOfMonths={2}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage>{fieldState.error?.from?.message || fieldState.error?.to?.message}</FormMessage>
              </FormItem>
            )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas Adicionales (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Instrucciones especiales para el personal, etc." {...field} />
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
            Crear Orden
          </Button>
        </div>
      </form>
    </Form>
  );
}
