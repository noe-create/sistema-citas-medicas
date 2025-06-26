'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const notesSchema = z.object({
  symptoms: z.string().optional(),
  diagnosis: z.string().min(1, 'El diagnóstico es obligatorio.'),
  prescription: z.string().optional(),
  notes: z.string().optional(),
});

interface ConsultationNotesProps {
    patientId: string;
    onConsultationComplete: () => void;
}


export function ConsultationNotes({ patientId, onConsultationComplete }: ConsultationNotesProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const form = useForm<z.infer<typeof notesSchema>>({
        resolver: zodResolver(notesSchema),
        defaultValues: {
            symptoms: '',
            diagnosis: '',
            prescription: '',
            notes: '',
        }
    });

    function onSubmit(values: z.infer<typeof notesSchema>) {
        setIsSubmitting(true);
        console.log("Notas de consulta:", values); // Future: save these notes

        onConsultationComplete();
        
        toast({
            title: 'Consulta Completada',
            description: 'El paciente ha sido marcado como completado.',
        });

        form.reset();
        setIsSubmitting(false);
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notas de Consulta</CardTitle>
        <CardDescription>
          Registre los detalles de la consulta del paciente. Al completar, el paciente saldrá de la cola.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="symptoms"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Síntomas</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej. Fiebre, tos" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="diagnosis"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Diagnóstico</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej. Resfriado común" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="prescription"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Prescripción</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej. Paracetamol 500mg" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Notas Adicionales</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Cualquier otro detalle relevante..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
            <CardFooter>
                 <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Completar Consulta
                 </Button>
            </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
