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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown, Loader2, UserCheck, Users } from 'lucide-react';
import { searchCombinedPatients } from '@/actions/patient-actions';
import type { Patient, SearchResult, ServiceType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  serviceType: z.enum(['medicina general', 'consulta pediatrica', 'servicio de enfermeria'], {
    required_error: "El tipo de servicio es requerido."
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface PatientCheckinFormProps {
  onSubmitted: (data: { serviceType: ServiceType, patient: SearchResult }) => void;
}

export function PatientCheckinForm({ onSubmitted }: PatientCheckinFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedPatient, setSelectedPatient] = React.useState<SearchResult | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: FormValues) {
    if (!selectedPatient) return;
    setIsSubmitting(true);
    await onSubmitted({ serviceType: values.serviceType, patient: selectedPatient });
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
            <PatientSearch selectedPatient={selectedPatient} onPatientSelect={setSelectedPatient} />
            
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
                        <SelectItem value="medicina general" className="capitalize">Medicina General</SelectItem>
                        <SelectItem value="consulta pediatrica" className="capitalize">Consulta Pediátrica</SelectItem>
                        <SelectItem value="servicio de enfermeria" className="capitalize">Servicio de Enfermería</SelectItem>
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


function PatientSearch({ selectedPatient, onPatientSelect }: { selectedPatient: SearchResult | null, onPatientSelect: (patient: SearchResult | null) => void }) {
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const data = await searchCombinedPatients(query);
                setResults(data);
            } catch (e) {
                console.error("Error searching patients:", e);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);
    
    // Fetch all patients when the popover opens for the first time
    React.useEffect(() => {
        if (isPopoverOpen && results.length === 0 && query === '') {
             const fetchInitialData = async () => {
                setIsLoading(true);
                try {
                    const data = await searchCombinedPatients('');
                    setResults(data);
                } catch(e) {
                    console.error(e);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchInitialData();
        }
    }, [isPopoverOpen, results.length, query]);

    const handleSelect = (result: SearchResult | null) => {
        onPatientSelect(result);
        setIsPopoverOpen(false);
        setQuery(''); // Reset search query on select
    };
    
    return (
        <div className="space-y-2">
            <Label>Paciente</Label>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                     <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isPopoverOpen}
                        className="w-full justify-between font-normal text-left h-auto"
                     >
                        {selectedPatient ? (
                            <div className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-green-600 flex-shrink-0"/>
                                <div>
                                    <p className="text-sm font-medium">{selectedPatient.nombreCompleto}</p>
                                    <p className="text-xs text-muted-foreground">{selectedPatient.cedula} &bull; {selectedPatient.kind === 'titular' ? 'Titular' : 'Beneficiario'}</p>
                                </div>
                            </div>
                        ) : 'Buscar por nombre o cédula...' }
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput 
                            placeholder="Buscar paciente..."
                            value={query}
                            onValueChange={setQuery}
                            className="h-9"
                        />
                        <CommandList>
                            {isLoading && <CommandItem disabled>Buscando...</CommandItem>}
                            <CommandEmpty>
                                No se encontraron resultados.
                            </CommandEmpty>
                             {results.length > 0 && !isLoading && (
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
        </div>
    );
}
