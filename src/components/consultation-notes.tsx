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
  diagnosis: z.string().min(1, 'Diagnosis is required.'),
  prescription: z.string().optional(),
  notes: z.string().optional(),
});

export function ConsultationNotes() {
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
        console.log("Consultation Notes:", values);

        setTimeout(() => {
            toast({
                title: 'Consultation Complete',
                description: 'Notes have been saved successfully.',
            });
            setIsSubmitting(false);
            form.reset();
        }, 1500);
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultation Notes</CardTitle>
        <CardDescription>
          Record the details of the patient consultation.
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
                        <FormLabel>Symptoms</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Fever, cough" {...field} />
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
                        <FormLabel>Diagnosis</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Common cold" {...field} />
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
                        <FormLabel>Prescription</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Paracetamol 500mg" {...field} />
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
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Any other relevant details..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
            <CardFooter>
                 <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Complete Consultation
                 </Button>
            </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
