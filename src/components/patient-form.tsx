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
import { Loader2, Check, ChevronsUpDown, PlusCircle, User, Globe, CreditCard, CalendarDays, Users as UsersIcon, Smartphone, Mail, UserCog, Building2, Phone } from 'lucide-react';
import type { Empresa, Titular } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CompanyForm } from './company-form';
import { createEmpresa } from '@/actions/patient-actions';
import { useToast } from '@/hooks/use-toast';


const allAreaCodes = [
    '0212', '0234', '0235', '0238', '0239', '0241', '0243', '0244', '0245', '0246', '0247',
    '0251', '0253', '0255', '0256', '0258', '0261', '0264', '0265', '0268', '0269', '0271',
    '0272', '0273', '0274', '0275', '0276', '0277', '0278', '0281', '0282', '0283', '0285',
    '0286', '0288', '0291', '0292', '0293', '0294', '0295',
    '0412', '0414', '0416', '0424', '0426'
].sort();

const mobilePhoneCodes = ['0412', '0414', '0424', '0416', '0426'] as const;

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
  codigoTelefono: z.string().optional(),
  numeroTelefono: z.string().optional(),
  codigoCelular: z.string().optional(),
  numeroCelular: z.string().optional(),
  email: z.string().email({ message: 'Email inválido.' }).optional(),
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
}).superRefine((data, ctx) => {
    const formatPhone = (code?: string, num?: string) => {
        if (code && !num) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Número requerido.", path: [code.startsWith('04') ? "numeroCelular" : "numeroTelefono"] });
        if (!code && num) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Código de área requerido.", path: [code?.startsWith('04') ? "codigoCelular" : "codigoTelefono"] });
        if (code && num) {
            if (num.length !== 7) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El número debe tener 7 dígitos.", path: [code.startsWith('04') ? "numeroCelular" : "numeroTelefono"] });
            if (!/^[0-9]+$/.test(num)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Solo se permiten números.", path: [code.startsWith('04') ? "numeroCelular" : "numeroTelefono"] });
        }
    }
    formatPhone(data.codigoTelefono, data.numeroTelefono);
    formatPhone(data.codigoCelular, data.numeroCelular);
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  titular: Titular | null;
  empresas: Empresa[];
  onSubmitted: (values: any) => Promise<void>;
  onCancel: () => void;
}

export function PatientForm({ titular, empresas, onSubmitted, onCancel }: PatientFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [empresaPopoverOpen, setEmpresaPopoverOpen] = React.useState(false);
  const [areaCodePopoverOpen, setAreaCodePopoverOpen] = React.useState(false);
  const [areaCodeCelularPopoverOpen, setAreaCodeCelularPopoverOpen] = React.useState(false);
  
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = React.useState(false);
  const [localEmpresas, setLocalEmpresas] = React.useState<Empresa[]>(empresas);
  
  React.useEffect(() => {
    setLocalEmpresas(empresas);
  }, [empresas]);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
        nombreCompleto: '',
        nacionalidad: 'V',
        cedula: '',
        numeroTelefono: '',
        numeroCelular: '',
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
    
    const parseTelefono = (telefonoStr?: string): { codigo?: string, numero?: string } => {
        if (!telefonoStr || !telefonoStr.includes('-')) return { codigo: undefined, numero: ''};
        const [codigo, ...numeroParts] = telefonoStr.split('-');
        const numero = numeroParts.join('');
        return { codigo: codigo, numero: numero };
    }

    if (titular) {
        const { nacionalidad, cedula } = parseCedula(titular.persona.cedula);
        const { codigo: codigoTelefono, numero: numeroTelefono } = parseTelefono(titular.persona.telefono);
        const { codigo: codigoCelular, numero: numeroCelular } = parseTelefono(titular.persona.telefonoCelular);
        form.reset({
          nombreCompleto: titular.persona.nombreCompleto || '',
          nacionalidad: nacionalidad,
          cedula: cedula,
          fechaNacimiento: titular.persona.fechaNacimiento ? new Date(titular.persona.fechaNacimiento) : undefined,
          genero: titular.persona.genero || undefined,
          codigoTelefono: codigoTelefono,
          numeroTelefono: numeroTelefono,
          codigoCelular: codigoCelular,
          numeroCelular: numeroCelular,
          email: titular.persona.email || '',
          tipo: titular.tipo || undefined,
          empresaId: titular.empresaId || undefined,
        });
    } else {
        form.reset({
            nombreCompleto: '',
            cedula: '',
            fechaNacimiento: undefined,
            genero: undefined,
            codigoTelefono: undefined,
            numeroTelefono: '',
            codigoCelular: undefined,
            numeroCelular: '',
            email: '',
            tipo: undefined,
            empresaId: undefined,
            nacionalidad: 'V',
        });
    }
  }, [titular, form]);

  async function onSubmit(values: PatientFormValues) {
    setIsSubmitting(true);
    const submissionData: any = {
        ...values,
        cedula: `${values.nacionalidad}-${values.cedula}`,
        telefono: (values.codigoTelefono && values.numeroTelefono) ? `${values.codigoTelefono}-${values.numeroTelefono}` : undefined,
        telefonoCelular: (values.codigoCelular && values.numeroCelular) ? `${values.codigoCelular}-${values.numeroCelular}` : undefined,
    };
    delete submissionData.nacionalidad;
    delete submissionData.codigoTelefono;
    delete submissionData.numeroTelefono;
    delete submissionData.codigoCelular;
    delete submissionData.numeroCelular;

    if (titular) {
        await onSubmitted(titular.id, titular.personaId, submissionData);
    } else {
        await onSubmitted(submissionData);
    }
    setIsSubmitting(false);
  }

  async function handleCreateEmpresa(companyValues: any) {
    try {
        const newEmpresa = await createEmpresa(companyValues);
        setLocalEmpresas(prev => [...prev, newEmpresa]);
        form.setValue('empresaId', newEmpresa.id, { shouldValidate: true });
        toast({ title: "¡Empresa Creada!", description: `${newEmpresa.name} ha sido añadida.` });
        setIsCompanyDialogOpen(false);
    } catch (error: any) {
        console.error("Error creating company:", error);
        toast({ title: 'Error', description: error.message || 'No se pudo crear la empresa.', variant: 'destructive' });
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
            <FormField
              control={form.control}
              name="nombreCompleto"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Nombre Completo
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
                control={form.control}
                name="nacionalidad"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            Nacionalidad
                        </FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                defaultValue="V"
                                className="flex items-center space-x-4 pt-1"
                            >
                                <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                        <RadioGroupItem value="V" id="v" />
                                    </FormControl>
                                    <Label htmlFor="v" className="font-normal">Venezolano</Label>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                        <RadioGroupItem value="E" id="e" />
                                    </FormControl>
                                    <Label htmlFor="e" className="font-normal">Extranjero</Label>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                         <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                  control={form.control}
                  name="cedula"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        Número de Cédula
                      </FormLabel>
                      <FormControl>
                          <Input placeholder="Solo números" {...field} value={field.value || ''} onChange={(e) => {
                              field.onChange(e.target.value.replace(/\D/g, ''));
                          }}/>
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
              />

            <FormField
                control={form.control}
                name="fechaNacimiento"
                render={({ field }) => {
                    const selectedYear = field.value ? field.value.getUTCFullYear() : undefined;
                    const selectedMonth = field.value ? field.value.getUTCMonth() + 1 : undefined;
                    const selectedDay = field.value ? field.value.getUTCDate() : undefined;

                    const handleDateChange = (part: 'year' | 'month' | 'day', value: string) => {
                        let year = selectedYear || new Date().getFullYear();
                        let month = selectedMonth ? selectedMonth - 1 : new Date().getMonth();
                        let day = selectedDay || 1;

                        if (part === 'year') year = parseInt(value, 10);
                        else if (part === 'month') month = parseInt(value, 10) - 1;
                        else if (part === 'day') day = parseInt(value, 10);
                        
                        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
                        if (day > daysInMonth) day = daysInMonth;

                        const newDate = new Date(Date.UTC(year, month, day));
                        field.onChange(newDate);
                    };
                    
                    const years = Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - i);
                    const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('es', { month: 'long' }) }));
                    const daysInSelectedMonth = selectedYear && selectedMonth ? new Date(Date.UTC(selectedYear, selectedMonth, 0)).getUTCDate() : 31;
                    const days = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

                    return (
                        <FormItem className="md:col-span-2">
                            <FormLabel className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" />Fecha de Nacimiento</FormLabel>
                            <div className="grid grid-cols-3 gap-2">
                                <Select onValueChange={(v) => handleDateChange('day', v)} value={selectedDay ? String(selectedDay) : ''}><FormControl><SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger></FormControl><SelectContent>{days.map((d) => (<SelectItem key={d} value={String(d)}>{d}</SelectItem>))}</SelectContent></Select>
                                <Select onValueChange={(v) => handleDateChange('month', v)} value={selectedMonth ? String(selectedMonth) : ''}><FormControl><SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger></FormControl><SelectContent>{months.map((m) => (<SelectItem key={m.value} value={String(m.value)}><span className="capitalize">{m.label}</span></SelectItem>))}</SelectContent></Select>
                                <Select onValueChange={(v) => handleDateChange('year', v)} value={selectedYear ? String(selectedYear) : ''}><FormControl><SelectTrigger><SelectValue placeholder="Año" /></SelectTrigger></FormControl><SelectContent>{years.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent></Select>
                            </div>
                            <FormMessage />
                        </FormItem>
                    );
                }}
            />
            <FormField
                control={form.control}
                name="genero"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2"><UsersIcon className="h-4 w-4 text-muted-foreground" />Género</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un género" /></SelectTrigger></FormControl>
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
            <div className="space-y-2">
                <FormLabel className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />Teléfono</FormLabel>
                <div className="grid grid-cols-3 gap-2">
                     <FormField
                        control={form.control}
                        name="codigoTelefono"
                        render={({ field }) => (
                            <FormItem className="col-span-1">
                                <Popover open={areaCodePopoverOpen} onOpenChange={setAreaCodePopoverOpen}><PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between px-3 font-normal",!field.value && "text-muted-foreground")}>{field.value? allAreaCodes.find((code) => code === field.value): "Código"}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Command><CommandInput placeholder="Buscar código..." /><CommandList><CommandEmpty>No se encontró código.</CommandEmpty><CommandGroup>{allAreaCodes.map((code) => (<CommandItem value={code} key={code} onSelect={(value) => {form.setValue("codigoTelefono", value, { shouldValidate: true }); setAreaCodePopoverOpen(false);}}><Check className={cn("mr-2 h-4 w-4", code === field.value ? "opacity-100" : "opacity-0")}/>{code}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField control={form.control} name="numeroTelefono" render={({ field }) => (<FormItem className="col-span-2"><FormControl><Input placeholder="Solo 7 números" {...field} maxLength={7} value={field.value || ''} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}/></FormControl><FormMessage /></FormItem>)} />
                </div>
            </div>

            <div className="space-y-2">
                <FormLabel className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-muted-foreground" />Teléfono Celular</FormLabel>
                <div className="grid grid-cols-3 gap-2">
                     <FormField
                        control={form.control}
                        name="codigoCelular"
                        render={({ field }) => (
                            <FormItem className="col-span-1">
                                <Popover open={areaCodeCelularPopoverOpen} onOpenChange={setAreaCodeCelularPopoverOpen}><PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between px-3 font-normal",!field.value && "text-muted-foreground")}>{field.value? mobilePhoneCodes.find((code) => code === field.value): "Código"}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Command><CommandInput placeholder="Buscar código..." /><CommandList><CommandEmpty>No se encontró código.</CommandEmpty><CommandGroup>{mobilePhoneCodes.map((code) => (<CommandItem value={code} key={code} onSelect={(value) => {form.setValue("codigoCelular", value, { shouldValidate: true }); setAreaCodeCelularPopoverOpen(false);}}><Check className={cn("mr-2 h-4 w-4", code === field.value ? "opacity-100" : "opacity-0")}/>{code}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField control={form.control} name="numeroCelular" render={({ field }) => (<FormItem className="col-span-2"><FormControl><Input placeholder="Solo 7 números" {...field} maxLength={7} value={field.value || ''} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}/></FormControl><FormMessage /></FormItem>)} />
                </div>
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />Email</FormLabel>
                  <FormControl><Input placeholder="juan.perez@email.com" {...field} value={field.value || ''} type="email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2"><UserCog className="h-4 w-4 text-muted-foreground" />Tipo de Titular</FormLabel>
                        <FormControl>
                             <RadioGroup onValueChange={(value) => { field.onChange(value); if (value !== 'corporate_affiliate') form.setValue('empresaId', undefined); }} value={field.value} className="flex flex-col space-y-1">
                                <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="private" id="private" /></FormControl><Label htmlFor="private" className="font-normal">Privado</Label></FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="internal_employee" id="internal_employee" /></FormControl><Label htmlFor="internal_employee" className="font-normal">Empleado Interno</Label></FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="corporate_affiliate" id="corporate_affiliate" /></FormControl><Label htmlFor="corporate_affiliate" className="font-normal">Afiliado Corporativo</Label></FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            {tipo === 'corporate_affiliate' && (
                 <FormField
                    control={form.control}
                    name="empresaId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" />Empresa</FormLabel>
                            <div className="flex items-center gap-2">
                                <Popover open={empresaPopoverOpen} onOpenChange={setEmpresaPopoverOpen}><PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between font-normal",!field.value && "text-muted-foreground")}>{field.value? localEmpresas.find((empresa) => empresa.id === field.value)?.name: "Seleccione una empresa"}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Buscar empresa..." /><CommandList><CommandEmpty>No se encontró la empresa.</CommandEmpty><CommandGroup>{localEmpresas.map((empresa) => (<CommandItem value={empresa.name} key={empresa.id} onSelect={(currentValue) => { const selectedEmpresa = localEmpresas.find(e => e.name.toLowerCase() === currentValue.toLowerCase()); if (selectedEmpresa) form.setValue("empresaId", selectedEmpresa.id, { shouldValidate: true }); setEmpresaPopoverOpen(false);}}><Check className={cn("mr-2 h-4 w-4", empresa.id === field.value ? "opacity-100": "opacity-0")}/>{empresa.name}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover>
                                <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}><DialogTrigger asChild><Button variant="outline" size="icon"><PlusCircle className="h-4 w-4" /></Button></DialogTrigger><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Crear Nueva Empresa</DialogTitle></DialogHeader><CompanyForm empresa={null} onSubmitted={handleCreateEmpresa} onCancel={() => setIsCompanyDialogOpen(false)}/></DialogContent></Dialog>
                            </div>
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
