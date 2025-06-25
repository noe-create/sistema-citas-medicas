
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Empresa, Titular } from '@/lib/types';

const patientSchema = z.object({
  nombreCompleto: z.string().min(3, { message: 'El nombre es requerido.' }),
  nacionalidad: z.enum(['V', 'E'], { required_error: 'La nacionalidad es requerida.' }),
  cedula: z.string().regex(/^[0-9]+$/, "La cédula solo debe contener números.").min(5, { message: 'La cédula debe tener al menos 5 dígitos.' }),
  fechaNacimiento: z.date({
    required_error: 'La fecha de nacimiento es requerida.',
  }),
  genero: z.enum(['Masculino', 'Femenino', 'Otro'], {
    required_error: 'El género es requerido.',
  }),
  telefono: z.string().min(10, { message: 'El teléfono es requerido.' }),
  email: z.string().email({ message: 'Email inválido.' }),
  tipo: z.enum(['internal_employee', 'corporate_affiliate', 'private'], {
    required_error: 'El tipo de titular es requerido.',
  }),
  empresaId: z.string().optional(),
}).refine(data => {
    if (data.tipo === 'corporate_affiliate') {
        return !!data.empresaId;
    }
    return true;
}, {
    message: "La empresa es requerida para afiliados corporativos.",
    path: ["empresaId"],
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  titular: Titular | null;
  empresas: Empresa[];
  onSubmitted: (values: any) => Promise<void>;
  onCancel: () => void;
}

export function PatientForm({ titular, empresas, onSubmitted, onCancel }: PatientFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
        nombreCompleto: '',
        nacionalidad: 'V',
        cedula: '',
        telefono: '',
        email: '',
    },
  });

  const tipo = form.watch('tipo');

  React.useEffect(() => {
    const parseCedula = (cedulaStr?: string): { nacionalidad: 'V' | 'E', cedula: string } => {
        if (!cedulaStr) return { nacionalidad: 'V', cedula: '' };
        const match = cedulaStr.match(/^([VE])-?(\d+)$/);
        if (match) {
            return { nacionalidad: match[1] as 'V' | 'E', cedula: match[2] };
        }
        return { nacionalidad: 'V', cedula: cedulaStr.replace(/\D/g, '') };
    }
    
    if (titular) {
        const { nacionalidad, cedula } = parseCedula(titular.cedula);
        form.reset({
          nombreCompleto: titular.nombreCompleto || '',
          cedula: cedula,
          fechaNacimiento: titular.fechaNacimiento ? new Date(titular.fechaNacimiento) : undefined,
          genero: titular.genero || undefined,
          telefono: titular.telefono || '',
          email: titular.email || '',
          tipo: titular.tipo || undefined,
          empresaId: titular.empresaId || undefined,
          nacionalidad: nacionalidad,
        });
    } else {
        form.reset({
            nombreCompleto: '',
            cedula: '',
            fechaNacimiento: undefined,
            genero: undefined,
            telefono: '',
            email: '',
            tipo: undefined,
            empresaId: undefined,
            nacionalidad: 'V',
        });
    }
  }, [titular, form.reset]);

  async function onSubmit(values: PatientFormValues) {
    setIsSubmitting(true);
    const submissionData = {
        ...values,
        cedula: `${values.nacionalidad}-${values.cedula}`,
    };
    delete (submissionData as any).nacionalidad;
    await onSubmitted(submissionData);
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
            <FormField
              control={form.control}
              name="nombreCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-[auto_1fr] gap-x-3 items-start">
              <FormField
                  control={form.control}
                  name="nacionalidad"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Nac.</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue="V">
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          <SelectItem value="V">V - Venezolano</SelectItem>
                          <SelectItem value="E">E - Extranjero</SelectItem>
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="cedula"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Número de Cédula</FormLabel>
                      <FormControl>
                          <Input placeholder="Solo números" {...field} value={field.value || ''} onChange={(e) => {
                              field.onChange(e.target.value.replace(/\D/g, ''));
                          }}/>
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
              />
            </div>

            <FormField
                control={form.control}
                name="fechaNacimiento"
                render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                    <FormLabel>Fecha de Nacimiento</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP", { locale: es })
                            ) : (
                                <span>Seleccione una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            captionLayout="dropdown-buttons"
                            fromYear={1920}
                            toYear={new Date().getFullYear()}
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
                control={form.control}
                name="genero"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Género</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un género" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                    </Select>
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
                    <Input placeholder="0414-1234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="juan.perez@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tipo de Titular</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un tipo" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="private">Privado</SelectItem>
                            <SelectItem value="internal_employee">Empleado Interno</SelectItem>
                            <SelectItem value="corporate_affiliate">Afiliado Corporativo</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            {tipo === 'corporate_affiliate' && (
                 <FormField
                    control={form.control}
                    name="empresaId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Empresa</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione una empresa" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {empresas.map(empresa => (
                                <SelectItem key={empresa.id} value={empresa.id}>{empresa.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
        </div>
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {titular ? 'Guardar Cambios' : 'Crear Titular'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
