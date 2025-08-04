
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
import { Loader2, Check, ChevronsUpDown, PlusCircle, User, Globe, CreditCard, CalendarDays, Users as UsersIcon, Smartphone, Mail, UserCog, Building2, Phone, MapPin } from 'lucide-react';
import type { Empresa, Persona, Titular } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CompanyForm } from './company-form';
import { createEmpresa } from '@/actions/patient-actions';
import { useToast } from '@/hooks/use-toast';
import { PersonaSearch } from './persona-search';
import { Textarea } from './ui/textarea';
import { calculateAge } from '@/lib/utils';


const patientSchema = z.object({
  primerNombre: z.string().min(1, 'El primer nombre es requerido.'),
  segundoNombre: z.string().optional(),
  primerApellido: z.string().min(1, 'El primer apellido es requerido.'),
  segundoApellido: z.string().optional(),
  nacionalidad: z.enum(['V', 'E']).optional(),
  cedulaNumero: z.string().regex(/^[0-9]*$/, "La cédula solo debe contener números.").min(7, { message: 'La cédula debe tener entre 7 y 8 dígitos.'}).max(8, { message: 'La cédula debe tener entre 7 y 8 dígitos.'}).optional().or(z.literal('')),
  fechaNacimiento: z.date({ required_error: 'La fecha de nacimiento es requerida.' }),
  genero: z.enum(['Masculino', 'Femenino'], { required_error: 'El género es requerido.' }),
  telefono1: z.string().optional(),
  telefono2: z.string().optional(),
  email: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
  direccion: z.string().optional(),
  tipo: z.enum(['internal_employee', 'corporate_affiliate', 'private'], { required_error: 'El tipo de titular es requerido.' }),
  empresaId: z.string().optional(),
  representanteId: z.string().optional(),
}).refine(data => {
    if (data.tipo === 'corporate_affiliate') {
        return !!data.empresaId;
    }
    return true;
}, {
    message: "La empresa es requerida para afiliados corporativos.",
    path: ["empresaId"],
}).refine(data => {
    if (data.fechaNacimiento) {
        const age = calculateAge(data.fechaNacimiento);
        if (age < 18 && !data.cedulaNumero) {
            return !!data.representanteId;
        }
    }
    return true;
}, {
    message: "Un representante es requerido para menores de edad sin cédula.",
    path: ["representanteId"],
});


type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  titular: Titular | null;
  empresas: Empresa[];
  onSubmitted: (...args: any[]) => Promise<void>;
  onCancel: () => void;
  excludeIds?: string[];
}

export function PatientForm({ titular, empresas, onSubmitted, onCancel, excludeIds = [] }: PatientFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [empresaPopoverOpen, setEmpresaPopoverOpen] = React.useState(false);
  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);

  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = React.useState(false);
  const [localEmpresas, setLocalEmpresas] = React.useState<Empresa[]>(empresas);
  
  React.useEffect(() => {
    setLocalEmpresas(empresas);
  }, [empresas]);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
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
        representanteId: titular?.persona.representanteId || undefined
    },
  });

  const tipo = form.watch('tipo');
  const isPersonaSelected = !!selectedPersona;

  const fechaNacimiento = form.watch('fechaNacimiento');
  const cedulaNumero = form.watch('cedulaNumero');
  const [showRepresentativeField, setShowRepresentativeField] = React.useState(false);

  React.useEffect(() => {
    if (isPersonaSelected) { // If linking an existing person, don't show the field
        setShowRepresentativeField(false);
        return;
    }
    if (fechaNacimiento) {
      const age = calculateAge(fechaNacimiento);
      setShowRepresentativeField(age < 18 && !cedulaNumero);
    } else {
      setShowRepresentativeField(false);
    }
  }, [fechaNacimiento, cedulaNumero, isPersonaSelected]);

  const handleRepresentativeSelect = (p: Persona | null) => {
    form.setValue('representanteId', p?.id || '', { shouldValidate: true });
  };

  React.useEffect(() => {
    let personaToLoad: Persona | null = null;
    if (selectedPersona) {
        personaToLoad = selectedPersona;
    } else if (titular) {
        personaToLoad = titular.persona;
    }
    
    if (personaToLoad) {
        form.reset({
          ...form.getValues(), // Keep `tipo` and `empresaId` if they were set
          primerNombre: personaToLoad.primerNombre || '',
          segundoNombre: personaToLoad.segundoNombre || '',
          primerApellido: personaToLoad.primerApellido || '',
          segundoApellido: personaToLoad.segundoApellido || '',
          nacionalidad: personaToLoad.nacionalidad,
          cedulaNumero: personaToLoad.cedulaNumero,
          fechaNacimiento: new Date(personaToLoad.fechaNacimiento),
          genero: personaToLoad.genero,
          telefono1: personaToLoad.telefono1,
          telefono2: personaToLoad.telefono2,
          email: personaToLoad.email || '',
          direccion: personaToLoad.direccion || '',
          representanteId: personaToLoad.representanteId || undefined,
        });
    }

    if (!selectedPersona && titular) {
        form.setValue('tipo', titular.tipo);
        form.setValue('empresaId', titular.empresaId);
    }
  }, [selectedPersona, titular, form]);


  async function onSubmit(values: PatientFormValues) {
    setIsSubmitting(true);
    let submissionData: any;

    if (titular) { // UPDATE
        await onSubmitted(titular.id, titular.personaId, values);
    } else { // CREATE
        if (selectedPersona) {
            submissionData = {
                personaId: selectedPersona.id,
                tipo: values.tipo,
                empresaId: values.empresaId,
            };
        } else {
            submissionData = {
                persona: values,
                tipo: values.tipo,
                empresaId: values.empresaId,
            };
        }
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
        {!titular && (
            <div className="space-y-2 mb-6 border-b pb-6">
                <Label>Asignar Rol de Titular a Persona Existente</Label>
                <PersonaSearch 
                    onPersonaSelect={setSelectedPersona} 
                    excludeIds={excludeIds}
                    placeholder="Buscar para vincular..."
                />
                <p className="text-xs text-muted-foreground text-center">O llene los campos de abajo para crear una nueva persona.</p>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
            <FormField control={form.control} name="primerNombre" render={({ field }) => ( <FormItem><FormLabel>Primer Nombre</FormLabel><FormControl><Input {...field} disabled={isPersonaSelected} onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="segundoNombre" render={({ field }) => ( <FormItem><FormLabel>Segundo Nombre (Opcional)</FormLabel><FormControl><Input {...field} disabled={isPersonaSelected} onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="primerApellido" render={({ field }) => ( <FormItem><FormLabel>Primer Apellido</FormLabel><FormControl><Input {...field} disabled={isPersonaSelected} onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="segundoApellido" render={({ field }) => ( <FormItem><FormLabel>Segundo Apellido (Opcional)</FormLabel><FormControl><Input {...field} disabled={isPersonaSelected} onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} /></FormControl><FormMessage /></FormItem>)} />
            
            <FormField
                control={form.control}
                name="nacionalidad"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" />Nacionalidad</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} value={field.value} defaultValue="V" className="flex items-center space-x-4 pt-1" disabled={isPersonaSelected}>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="V" id="v" /></FormControl><Label htmlFor="v" className="font-normal">Venezolano</Label></FormItem>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="E" id="e" /></FormControl><Label htmlFor="e" className="font-normal">Extranjero</Label></FormItem>
                            </RadioGroup>
                        </FormControl>
                         <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                  control={form.control}
                  name="cedulaNumero"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" />Número de Cédula (Opcional)</FormLabel>
                      <FormControl>
                          <Input placeholder="Solo números" {...field} maxLength={8} value={field.value || ''} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))} disabled={isPersonaSelected}/>
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
                                <Select disabled={isPersonaSelected} onValueChange={(v) => handleDateChange('day', v)} value={selectedDay ? String(selectedDay) : ''}><FormControl><SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger></FormControl><SelectContent>{days.map((d) => (<SelectItem key={d} value={String(d)}>{d}</SelectItem>))}</SelectContent></Select>
                                <Select disabled={isPersonaSelected} onValueChange={(v) => handleDateChange('month', v)} value={selectedMonth ? String(selectedMonth) : ''}><FormControl><SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger></FormControl><SelectContent>{months.map((m) => (<SelectItem key={m.value} value={String(m.value)}><span className="capitalize">{m.label}</span></SelectItem>))}</SelectContent></Select>
                                <Select disabled={isPersonaSelected} onValueChange={(v) => handleDateChange('year', v)} value={selectedYear ? String(selectedYear) : ''}><FormControl><SelectTrigger><SelectValue placeholder="Año" /></SelectTrigger></FormControl><SelectContent>{years.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent></Select>
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
                    <Select onValueChange={field.onChange} value={field.value} disabled={isPersonaSelected}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un género" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Femenino">Femenino</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField control={form.control} name="telefono1" render={({ field }) => ( <FormItem><FormLabel>Teléfono 1 (Opcional)</FormLabel><FormControl><Input placeholder="02125551234" {...field} value={field.value || ''} disabled={isPersonaSelected} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}/></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="telefono2" render={({ field }) => ( <FormItem><FormLabel>Teléfono 2 (Opcional)</FormLabel><FormControl><Input placeholder="04141234567" {...field} value={field.value || ''} disabled={isPersonaSelected} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}/></FormControl><FormMessage /></FormItem>)} />
            
            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />Email (Opcional)</FormLabel><FormControl><Input placeholder="juan.perez@email.com" {...field} value={field.value || ''} type="email" disabled={isPersonaSelected}/></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="direccion" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />Dirección (Opcional)</FormLabel><FormControl><Textarea placeholder="Av. Principal, Edificio Central, Piso 4, Oficina 4B, Caracas" {...field} value={field.value || ''} disabled={isPersonaSelected}/></FormControl><FormMessage /></FormItem>)} />

            {showRepresentativeField && (
                <div className="md:col-span-2 space-y-2 rounded-md border border-dashed p-4">
                    <p className="text-sm font-medium text-muted-foreground">Esta persona es un menor de edad sin cédula y requiere un representante.</p>
                    <FormField
                        control={form.control}
                        name="representanteId"
                        render={() => (
                            <FormItem>
                                <FormLabel>Buscar y Asignar Representante</FormLabel>
                                <PersonaSearch
                                    onPersonaSelect={handleRepresentativeSelect}
                                    placeholder="Buscar por nombre o cédula del representante..."
                                />
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </div>
            )}


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
