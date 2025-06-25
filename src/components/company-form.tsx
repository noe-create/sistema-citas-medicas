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
import { Loader2, Check, ChevronsUpDown, Building2, FileText, Phone, MapPin } from 'lucide-react';
import type { Empresa } from '@/lib/types';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from '@/lib/utils';
import { Label } from './ui/label';

const rifTypes = ['J', 'G', 'C'] as const;

const areaCodes = [
    '0212', '0234', '0235', '0238', '0239', '0241', '0243', '0244', '0245', '0246', '0247',
    '0251', '0253', '0255', '0256', '0258', '0261', '0264', '0265', '0268', '0269', '0271',
    '0272', '0273', '0274', '0275', '0276', '0277', '0278', '0281', '0282', '0283', '0285',
    '0286', '0288', '0291', '0292', '0293', '0294', '0295',
    '0412', '0414', '0416', '0424', '0426'
].sort();


const companySchema = z.object({
  name: z.string().min(3, { message: 'El nombre es requerido.' }),
  rifType: z.enum(rifTypes, { required_error: 'El tipo de RIF es requerido.'}),
  rifNumber: z.string().regex(/^\d{8}-\d$/, { message: 'El formato debe ser 12345678-9.' }),
  areaCode: z.string({ required_error: 'El código de área es requerido.' }),
  phoneNumber: z.string().length(7, { message: 'El número debe tener 7 dígitos.' }).regex(/^[0-9]+$/, 'El número solo debe contener dígitos.'),
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
  const [areaCodePopoverOpen, setAreaCodePopoverOpen] = React.useState(false);
  
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      rifType: 'J',
      rifNumber: '',
      areaCode: undefined,
      phoneNumber: '',
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

    const parseTelefono = (telefonoStr?: string): { areaCode?: string, phoneNumber: string } => {
        if (!telefonoStr || !telefonoStr.includes('-')) return { areaCode: undefined, phoneNumber: '' };
        const parts = telefonoStr.split('-');
        const code = parts[0];
        const number = parts.slice(1).join('');
        if (areaCodes.includes(code)) {
            return { areaCode: code, phoneNumber: number };
        }
        return { areaCode: undefined, phoneNumber: '' }; // Fallback
    }

    if (empresa) {
        const { rifType, rifNumber } = parseRif(empresa.rif);
        const { areaCode, phoneNumber } = parseTelefono(empresa.telefono);
        form.reset({
          name: empresa.name || '',
          rifType: rifType,
          rifNumber: rifNumber,
          areaCode: areaCode,
          phoneNumber: phoneNumber,
          direccion: empresa.direccion || '',
        });
    } else {
        form.reset({
            name: '',
            rifType: 'J',
            rifNumber: '',
            areaCode: undefined,
            phoneNumber: '',
            direccion: '',
        });
    }
  }, [empresa, form]);

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
        telefono: `${values.areaCode}-${values.phoneNumber}`,
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
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Nombre de la Empresa
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Innovatech Solutions" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  RIF
                </Label>
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
            
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Teléfono
                </Label>
                <div className="grid grid-cols-3 gap-2">
                    <FormField
                        control={form.control}
                        name="areaCode"
                        render={({ field }) => (
                            <FormItem className="col-span-1">
                                <Popover open={areaCodePopoverOpen} onOpenChange={setAreaCodePopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-full justify-between px-3 font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value
                                                    ? areaCodes.find((code) => code === field.value)
                                                    : "Código"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Command>
                                            <CommandInput placeholder="Buscar código..." />
                                            <CommandList>
                                                <CommandEmpty>No se encontró código.</CommandEmpty>
                                                <CommandGroup>
                                                    {areaCodes.map((code) => (
                                                        <CommandItem
                                                            value={code}
                                                            key={code}
                                                            onSelect={(value) => {
                                                                form.setValue("areaCode", value, { shouldValidate: true });
                                                                setAreaCodePopoverOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    code === field.value
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            {code}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormControl>
                                    <Input
                                        placeholder="1234567"
                                        maxLength={7}
                                        {...field}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, ''); // Allow only digits
                                            field.onChange(value);
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

             <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                    <FormItem className="md:col-span-2">
                    <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        Dirección
                    </FormLabel>
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
