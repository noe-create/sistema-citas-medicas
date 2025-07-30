
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
import { Loader2, User, Globe, CreditCard, CalendarDays, Users as UsersIcon, Smartphone, Mail, MapPin, Building2 } from 'lucide-react';
import type { Empresa, Persona, ServiceType, TitularType } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { calculateAge } from '@/lib/utils';
import { PersonaSearch } from './persona-search';
import { getEmpresas } from '@/actions/patient-actions';
import { useToast } from '@/hooks/use-toast';

const unifiedPatientSchema = z.object({
  persona: z.object({
    primerNombre: z.string().min(1, 'El primer nombre es requerido.'),
    segundoNombre: z.string().optional(),
    primerApellido: z.string().min(1, 'El primer apellido es requerido.'),
    segundoApellido: z.string().optional(),
    nacionalidad: z.enum(['V', 'E']).optional(),
    cedulaNumero: z.string().regex(/^[0-9]*$/, "La cédula solo debe contener números.").optional(),
    fechaNacimiento: z.date({ required_error: 'La fecha de nacimiento es requerida.' }),
    genero: z.enum(['Masculino', 'Femenino'], { required_error: 'El género es requerido.' }),
    telefono1: z.string().optional(),
    telefono2: z.string().optional(),
    email: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
    direccion: z.string().optional(),
  }),
  role: z.object({
    type: z.enum(['titular', 'beneficiario'], { required_error: 'Debe seleccionar un rol.' }),
    titularType: z.enum(['internal_employee', 'corporate_affiliate', 'private']).optional(),
    empresaId: z.string().optional(),
    titularId: z.string().optional(), // For beneficiaries
  }),
  checkin: z.object({
      serviceType: z.enum(['medicina general', 'consulta pediatrica', 'servicio de enfermeria'], { required_error: "El tipo de servicio es requerido."}),
  }),
})
.refine(data => {
    if (data.role.type === 'titular' && data.role.titularType === 'corporate_affiliate') {
        return !!data.role.empresaId;
    }
    return true;
}, { message: "La empresa es requerida para afiliados corporativos.", path: ["role.empresaId"] })
.refine(data => {
    if (data.role.type === 'beneficiario') {
        return !!data.role.titularId;
    }
    return true;
}, { message: "Debe seleccionar un titular para el beneficiario.", path: ["role.titularId"] });

export type UnifiedPatientFormValues = z.infer<typeof unifiedPatientSchema>;

interface UnifiedPatientFormProps {
  onSubmitted: (values: UnifiedPatientFormValues) => Promise<void>;
  onCancel: () => void;
}

export function UnifiedPatientForm({ onSubmitted, onCancel }: UnifiedPatientFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [empresas, setEmpresas] = React.useState<Empresa[]>([]);

  const form = useForm<UnifiedPatientFormValues>({
    resolver: zodResolver(unifiedPatientSchema),
    defaultValues: {
        persona: {
            primerNombre: '',
            segundoNombre: '',
            primerApellido: '',
            segundoApellido: '',
            nacionalidad: 'V',
            cedulaNumero: '',
            telefono1: '',
            telefono2: '',
            email: '',
            direccion: '',
        },
        role: { type: 'titular', titularType: 'private' },
        checkin: { serviceType: undefined },
    },
  });

  const roleType = form.watch('role.type');
  const titularType = form.watch('role.titularType');
  const fechaNacimiento = form.watch('persona.fechaNacimiento');

  const age = fechaNacimiento ? calculateAge(fechaNacimiento) : null;
  const availableServices = React.useMemo(() => {
    const services: { value: ServiceType; label: string }[] = [];
    if (age === null) return [];
    if (age < 18) {
        services.push({ value: 'consulta pediatrica', label: 'Consulta Pediátrica' });
    } else {
        services.push({ value: 'medicina general', label: 'Medicina General' });
    }
    services.push({ value: 'servicio de enfermeria', label: 'Servicio de Enfermería' });
    return services;
  }, [age]);

  React.useEffect(() => {
    if (titularType === 'corporate_affiliate' && empresas.length === 0) {
      getEmpresas().then(setEmpresas).catch(e => {
        toast({ title: "Error", description: "No se pudieron cargar las empresas.", variant: "destructive"});
        console.error(e);
      });
    }
  }, [titularType, empresas.length, toast]);

  const handleTitularSelectForBeneficiary = (persona: Persona | null) => {
    form.setValue('role.titularId', persona?.id || '', { shouldValidate: true });
  }

  async function onSubmit(values: UnifiedPatientFormValues) {
    setIsSubmitting(true);
    await onSubmitted(values);
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="max-h-[65vh] p-1">
          <div className="space-y-6 p-4">
            <section>
              <h3 className="text-lg font-semibold mb-2">Datos Demográficos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="persona.primerNombre" render={({ field }) => ( <FormItem><FormLabel>Primer Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="persona.segundoNombre" render={({ field }) => ( <FormItem><FormLabel>Segundo Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="persona.primerApellido" render={({ field }) => ( <FormItem><FormLabel>Primer Apellido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="persona.segundoApellido" render={({ field }) => ( <FormItem><FormLabel>Segundo Apellido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="persona.nacionalidad" render={({ field }) => (<FormItem className="space-y-3"><FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" />Nacionalidad</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} defaultValue="V" className="flex items-center space-x-4 pt-1"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="V" id="v_new" /></FormControl><Label htmlFor="v_new" className="font-normal">Venezolano</Label></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="E" id="e_new" /></FormControl><Label htmlFor="e_new" className="font-normal">Extranjero</Label></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="persona.cedulaNumero" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" />Cédula</FormLabel><FormControl><Input placeholder="Solo números" {...field} value={field.value || ''} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="persona.fechaNacimiento" render={({ field }) => { const handleDateChange = (part: 'year' | 'month' | 'day', value: string) => { const d = field.value ? new Date(field.value) : new Date(); let year = d.getFullYear(); let month = d.getMonth(); let day = d.getDate(); if (part === 'year') year = parseInt(value, 10); else if (part === 'month') month = parseInt(value, 10) - 1; else if (part === 'day') day = parseInt(value, 10); const daysInMonth = new Date(year, month + 1, 0).getDate(); if (day > daysInMonth) day = daysInMonth; field.onChange(new Date(year, month, day)); }; const years = Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - i); const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('es', { month: 'long' }) })); const daysInSelectedMonth = field.value ? new Date(field.value.getFullYear(), field.value.getMonth() + 1, 0).getDate() : 31; const days = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1); return (<FormItem className="md:col-span-2"><FormLabel className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" />Fecha de Nacimiento</FormLabel><div className="grid grid-cols-3 gap-2"><Select onValueChange={(v) => handleDateChange('day', v)} value={field.value ? String(field.value.getDate()) : ''}><FormControl><SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger></FormControl><SelectContent>{days.map((d) => (<SelectItem key={d} value={String(d)}>{d}</SelectItem>))}</SelectContent></Select><Select onValueChange={(v) => handleDateChange('month', v)} value={field.value ? String(field.value.getMonth() + 1) : ''}><FormControl><SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger></FormControl><SelectContent>{months.map((m) => (<SelectItem key={m.value} value={String(m.value)}><span className="capitalize">{m.label}</span></SelectItem>))}</SelectContent></Select><Select onValueChange={(v) => handleDateChange('year', v)} value={field.value ? String(field.value.getFullYear()) : ''}><FormControl><SelectTrigger><SelectValue placeholder="Año" /></SelectTrigger></FormControl><SelectContent>{years.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent></Select></div><FormMessage /></FormItem>);}} />
                <FormField control={form.control} name="persona.genero" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><UsersIcon className="h-4 w-4 text-muted-foreground" />Género</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un género" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Femenino">Femenino</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="persona.telefono1" render={({ field }) => ( <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="0212-5551234" {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="persona.email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="correo@ejemplo.com" {...field} value={field.value || ''} type="email" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="persona.direccion" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Dirección</FormLabel><FormControl><Textarea placeholder="Dirección completa" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Afiliación y Servicio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="role.type" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Rol del Paciente</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                        <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="titular" id="titular" /></FormControl><Label htmlFor="titular" className="font-normal">Nuevo Titular</Label></FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="beneficiario" id="beneficiario" /></FormControl><Label htmlFor="beneficiario" className="font-normal">Nuevo Beneficiario</Label></FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )} />
                
                {roleType === 'titular' && (
                  <FormField control={form.control} name="role.titularType" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Titular</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                            <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="private" id="private" /></FormControl><Label htmlFor="private" className="font-normal">Privado</Label></FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="internal_employee" id="internal_employee" /></FormControl><Label htmlFor="internal_employee" className="font-normal">Empleado Interno</Label></FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="corporate_affiliate" id="corporate_affiliate" /></FormControl><Label htmlFor="corporate_affiliate" className="font-normal">Afiliado Corporativo</Label></FormItem>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )} />
                )}

                {roleType === 'titular' && titularType === 'corporate_affiliate' && (
                  <FormField control={form.control} name="role.empresaId" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" />Empresa</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una empresa" /></SelectTrigger></FormControl>
                        <SelectContent>{empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                {roleType === 'beneficiario' && (
                    <div className="md:col-span-2 space-y-2">
                        <FormField control={form.control} name="role.titularId" render={() => (
                            <FormItem>
                                <FormLabel>Buscar y Asignar Titular</FormLabel>
                                <PersonaSearch
                                    onPersonaSelect={handleTitularSelectForBeneficiary}
                                    placeholder="Buscar por nombre o cédula del titular..."
                                />
                                <FormMessage/>
                            </FormItem>
                        )} />
                    </div>
                )}
                
                <FormField control={form.control} name="checkin.serviceType" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                      <FormLabel>Servicio Requerido</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={availableServices.length === 0}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un servicio" /></SelectTrigger></FormControl>
                      <SelectContent>{availableServices.map(service => ( <SelectItem key={service.value} value={service.value} className="capitalize">{service.label}</SelectItem>))}</SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4 px-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear y Añadir a la Cola
          </Button>
        </div>
      </form>
    </Form>
  );
}

    