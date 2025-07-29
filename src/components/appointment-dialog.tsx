'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, User, Calendar, Clock, Stethoscope } from 'lucide-react';
import type { Persona, User as Doctor } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getPacienteByPersonaId, createAppointment, getDoctors } from '@/actions/patient-actions';
import { PersonaSearch } from './persona-search';
import { addMinutes, format } from 'date-fns';

const appointmentSchema = z.object({
  pacienteId: z.string().min(1, 'Debe seleccionar un paciente.'),
  doctorId: z.string().min(1, 'Debe seleccionar un médico.'),
  motivo: z.string().min(3, 'El motivo es requerido.'),
  duration: z.coerce.number().min(5, 'La duración mínima es de 5 minutos.'),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentCreated: () => void;
  slotInfo: { start: Date; end: Date };
}

export function AppointmentDialog({ isOpen, onClose, onAppointmentCreated, slotInfo }: AppointmentDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [doctors, setDoctors] = React.useState<Doctor[]>([]);
  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      pacienteId: '',
      doctorId: '',
      motivo: '',
      duration: 30,
    },
  });

  React.useEffect(() => {
    async function fetchDocs() {
      try {
        const docs = await getDoctors();
        setDoctors(docs as Doctor[]);
      } catch (error) {
        toast({ title: 'Error', description: 'No se pudieron cargar los doctores.', variant: 'destructive' });
      }
    }
    fetchDocs();
  }, [toast]);
  
  React.useEffect(() => {
    const fetchPacienteId = async () => {
      if (selectedPersona) {
        const paciente = await getPacienteByPersonaId(selectedPersona.id);
        if (paciente) {
          form.setValue('pacienteId', paciente.id, { shouldValidate: true });
        } else {
          toast({
            title: 'Error',
            description: 'Esta persona no tiene un registro de paciente asociado. Créelo desde el módulo de Personas.',
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


  async function onSubmit(values: AppointmentFormValues) {
    setIsSubmitting(true);
    try {
        const start = slotInfo.start;
        const end = addMinutes(start, values.duration);

        await createAppointment({
            pacienteId: values.pacienteId,
            doctorId: values.doctorId,
            start,
            end,
            motivo: values.motivo,
            status: 'programada',
        });

      toast({ title: 'Cita Creada', description: 'La cita ha sido agendada correctamente.' });
      onAppointmentCreated();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo crear la cita.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar Nueva Cita</DialogTitle>
          <DialogDescription>
            {format(slotInfo.start, "eeee, d 'de' MMMM 'de' yyyy 'a las' hh:mm a")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <FormLabel className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/>Paciente</FormLabel>
              <PersonaSearch onPersonaSelect={setSelectedPersona} />
              <FormField control={form.control} name="pacienteId" render={() => <FormMessage />} />
            </div>

            <FormField
              control={form.control}
              name="doctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-muted-foreground"/>Médico</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un médico" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctors.map(doc => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de la Cita</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Consulta de control, evaluación de resultados..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duración (minutos)</FormLabel>
                  <FormControl>
                    <Input type="number" step="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Agendar Cita
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
