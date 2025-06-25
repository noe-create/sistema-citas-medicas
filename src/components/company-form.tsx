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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const rifTypes = ['J', 'G', 'C'] as const;

const companySchema = z.object({
  name: z.string().min(3, { message: 'El nombre es requerido.' }),
  rifType: z.enum(rifTypes, { required_error: 'El tipo de RIF es requerido.'}),
  rifNumber: z.string().regex(/^\d{8}-\d$/, { message: 'El formato debe ser 12345678-9.' }),
  telefono: z.string().min(10, { message: 'El teléfono es requerido.' }),
  direccion: z.string().min(10, { message: 'La dirección es requerida.' }),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyFormProps {
  empresa: Empresa | null;
  onSubmitted: (values: Omit<Empresa, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export function CompanyForm({ empresa, onSubmitted, onCancel }: CompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      rifType: 'J',
      rifNumber: '',
      telefono: '',
      direccion: '',
    },
  });

  React.useEffect(() => {
    const parseRif = (rifStr?: string): { rifType?: typeof rifTypes[number], rifNumber: string } => {
        if (!rifStr) return { rifType: 'J', rifNumber: '' };
        const parts = rifStr.split('-');
        const type = parts[0];
        if (parts.length > 1 && (rifTypes as readonly string[]).includes(type)) {
            return { rifType: type as typeof rifTypes[number], rifNumber: parts.slice(1).join('-') };
        }
        return { rifType: 'J', rifNumber: rifStr }; // Fallback
    }

    if (empresa) {
        const { rifType, rifNumber } = parseRif(empresa.rif);
        form.reset({
          name: empresa.name || '',
          rifType: rifType,
          rifNumber: rifNumber,
          telefono: empresa.telefono || '',
          direccion: empresa.direccion || '',
        });
    } else {
        form.reset({
            name: '',
            rifType: 'J',
            rifNumber: '',
            telefono: '',
            direccion: '',
        });
    }
  }, [empresa, form.reset]);

  const handleRifNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 8) {
      value = `${value.slice(0, 8)}-${value.slice(8, 9)}`;
    }
    form.setValue('rifNumber', value, { shouldValidate: true });
  }

  async function onSubmit(values: CompanyFormValues) {
    setIsSubmitting(true);
    const submissionData = {
        name: values.name,
        rif: `${values.rifType}-${values.rifNumber}`,
        telefono: values.telefono,
        direccion: values.direccion,
    };
    await onSubmitted(submissionData as any);
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
                <FormItem className="md:col-span-2">
                  <FormLabel>Nombre de la Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Innovatech Solutions" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
                <FormLabel>RIF</FormLabel>
                <div className="grid grid-cols-4 gap-2">
                    <FormField
                        control={form.control}
                        name="rifType"
                        render={({ field }) => (
                            <FormItem className="col-span-1">
                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {rifTypes.map(code => <SelectItem key={code} value={code}>{code}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="rifNumber"
                        render={({ field }) => (
                            <FormItem className="col-span-3">
                                <FormControl>
                                    <Input placeholder="12345678-9" {...field} onChange={handleRifNumberChange} maxLength={10} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
            
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
