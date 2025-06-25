'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import * as React from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, UserCheck, Users } from 'lucide-react';
import { searchCombinedPatients, getTitularTypeById } from '@/actions/patient-actions';
import type { Patient, SearchResult, ServiceType, TitularType, AccountType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';

const formSchema = z.object({
  serviceType: z.enum(['Medicina General', 'Pediatría', 'Enfermería'], {
    required_error: "El tipo de servicio es requerido."
  }),
});

interface PatientCheckinFormProps {
  onSubmitted: (patient: Patient) => void;
}

const titularTypeToAccountType = (titularType: TitularType): AccountType => {
  switch (titularType) {
    case 'internal_employee': return 'Empleado';
    case 'corporate_affiliate': return 'Afiliado Corporativo';
    case 'private': return 'Privado';
    default: return 'Privado';
  }
};


export function PatientCheckinForm({ onSubmitted }: PatientCheckinFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedPatient, setSelectedPatient] = React.useState<SearchResult | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedPatient) return;

    setIsSubmitting(true);
    try {
        const titularId = selectedPatient.kind === 'titular' ? selectedPatient.id : selectedPatient.titularInfo!.id;
        const titularType = await getTitularTypeById(titularId);

        if (!titularType) {
            throw new Error("No se pudo determinar el tipo de cuenta del titular.");
        }

        const newPatient: Patient = {
            id: `q-${Date.now()}`,
            patientDbId: selectedPatient.id,
            name: selectedPatient.nombreCompleto,
            kind: selectedPatient.kind,
            serviceType: values.serviceType,
            accountType: titularTypeToAccountType(titularType),
            status: 'Esperando',
            checkInTime: new Date(),
        };

        onSubmitted(newPatient);

    } catch (error) {
        console.error("Error al registrar paciente:", error);
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
            <PatientSearch onPatientSelect={setSelectedPatient} />
            
            <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Tipo de Servicio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedPatient}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Seleccione un servicio" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="Medicina General">Medicina General</SelectItem>
                        <SelectItem value="Pediatría">Pediatría</SelectItem>
                        <SelectItem value="Enfermería">Enfermería</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <Button type="submit" disabled={isSubmitting || !selectedPatient} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Añadir a la Cola
        </Button>
      </form>
    </Form>
  );
}


function PatientSearch({ onPatientSelect }: { onPatientSelect: (patient: SearchResult | null) => void }) {
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [selectedPatient, setSelectedPatient] = React.useState<SearchResult | null>(null);

    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 1) {
                setIsLoading(true);
                const data = await searchCombinedPatients(query);
                setResults(data);
                setIsLoading(false);
            } else {
                setResults([]);
            }
        }, 300); // Debounce search

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (result: SearchResult) => {
        setSelectedPatient(result);
        onPatientSelect(result);
        setQuery(result.nombreCompleto);
        setIsPopoverOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setSelectedPatient(null);
        onPatientSelect(null);
        if (!isPopoverOpen) {
            setIsPopoverOpen(true);
        }
    };
    
    return (
        <div className="space-y-2">
            <Label>Paciente</Label>
            {selectedPatient ? (
                <div className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2">
                    <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-green-600"/>
                        <div>
                            <p className="text-sm font-medium">{selectedPatient.nombreCompleto}</p>
                            <p className="text-xs text-muted-foreground">{selectedPatient.cedula} &bull; {selectedPatient.kind === 'titular' ? 'Titular' : 'Beneficiario'}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedPatient(null);
                        onPatientSelect(null);
                        setQuery('');
                    }}>Cambiar</Button>
                </div>
            ) : (
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Input
                            placeholder="Buscar por nombre o cédula..."
                            value={query}
                            onChange={handleInputChange}
                        />
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                        <Command shouldFilter={false}>
                            <CommandList>
                                {isLoading && <div className="p-4 text-sm text-center">Buscando...</div>}
                                {!isLoading && results.length === 0 && query.length > 1 && (
                                     <div className="p-4 text-sm text-center">No se encontraron resultados.</div>
                                )}
                                {results.length > 0 && (
                                    <CommandGroup>
                                        {results.map((result) => (
                                            <CommandItem
                                                key={result.id}
                                                value={result.nombreCompleto}
                                                onSelect={() => handleSelect(result)}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <Users className="h-4 w-4 text-muted-foreground"/>
                                                    <div>
                                                        <p className="text-sm">{result.nombreCompleto}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {result.cedula} &bull; {result.kind === 'titular' 
                                                                ? <span className="font-semibold">Titular</span> 
                                                                : <span>Beneficiario de {result.titularInfo?.nombreCompleto}</span>
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
}

// Minimal Command components to avoid installing a new dependency
const Label = React.forwardRef<
  React.ElementRef<"label">,
  React.ComponentPropsWithoutRef<"label">
>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />
));
Label.displayName = "Label";
