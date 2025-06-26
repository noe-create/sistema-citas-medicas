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
import { searchPeopleForCheckin } from '@/actions/patient-actions';
import type { Persona, SearchResult, ServiceType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  serviceType: z.enum(['medicina general', 'consulta pediatrica', 'servicio de enfermeria'], {
    required_error: "El tipo de servicio es requerido."
  }),
});

type FormValues = z.infer<typeof formSchema>;

export interface RegistrationData {
    serviceType: ServiceType;
    searchResult: SearchResult;
}

interface PatientCheckinFormProps {
  onSubmitted: (data: RegistrationData) => void;
}

export function PatientCheckinForm({ onSubmitted }: PatientCheckinFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedResult, setSelectedResult] = React.useState<SearchResult | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });
  
  React.useEffect(() => {
    form.reset({ serviceType: undefined });
  }, [selectedResult, form]);
  
  const isPersonValid = React.useMemo(() => {
    if (!selectedResult) return false;
    return !!selectedResult.titularInfo || (!!selectedResult.beneficiarioDe && selectedResult.beneficiarioDe.length > 0);
  }, [selectedResult]);


  async function onSubmit(values: FormValues) {
    if (!selectedResult || !isPersonValid) return;
    setIsSubmitting(true);
    
    await onSubmitted({ 
        serviceType: values.serviceType, 
        searchResult: selectedResult,
    });
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
            <PatientSearch selectedResult={selectedResult} onResultSelect={setSelectedResult} />
            
            {selectedResult && !isPersonValid && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/90 rounded-md">
                Esta persona no es titular ni beneficiario y no puede ser registrada. Por favor, añada un rol desde el módulo de Gestión de Titulares.
              </div>
            )}

            {isPersonValid && (
                <>
                  <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Tipo de Servicio</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                </>
            )}
        </div>
        <Button type="submit" disabled={isSubmitting || !isPersonValid || !form.formState.isValid} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Añadir a la Cola
        </Button>
      </form>
    </Form>
  );
}


function PatientSearch({ selectedResult, onResultSelect }: { selectedResult: SearchResult | null, onResultSelect: (result: SearchResult | null) => void }) {
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const data = await searchPeopleForCheckin(query);
                setResults(data);
            } catch (e) {
                console.error("Error searching people:", e);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);
    
    React.useEffect(() => {
        if (isPopoverOpen && results.length === 0 && query === '') {
             const fetchInitialData = async () => {
                setIsLoading(true);
                try {
                    const data = await searchPeopleForCheckin('');
                    setResults(data);
                } catch(e) { console.error(e); } finally { setIsLoading(false); }
            };
            fetchInitialData();
        }
    }, [isPopoverOpen, results.length, query]);

    const handleSelect = (result: SearchResult | null) => {
        onResultSelect(result);
        setIsPopoverOpen(false);
        setQuery('');
    };
    
    return (
        <div className="space-y-2">
            <Label>Persona</Label>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                     <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isPopoverOpen}
                        className="w-full justify-between font-normal text-left h-auto"
                     >
                        {selectedResult ? (
                            <div className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-green-600 flex-shrink-0"/>
                                <div>
                                    <p className="text-sm font-medium">{selectedResult.persona.nombreCompleto}</p>
                                    <p className="text-xs text-muted-foreground">{selectedResult.persona.cedula}</p>
                                </div>
                            </div>
                        ) : 'Buscar por nombre o cédula...' }
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput 
                            placeholder="Buscar persona..."
                            value={query}
                            onValueChange={setQuery}
                            className="h-9"
                        />
                        <CommandList>
                            {isLoading && <CommandItem disabled>Buscando...</CommandItem>}
                            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                             {results.length > 0 && !isLoading && (
                                <CommandGroup>
                                    {results.map((result) => (
                                        <CommandItem
                                            key={result.persona.id}
                                            value={result.persona.nombreCompleto}
                                            onSelect={() => handleSelect(result)}
                                            className="cursor-pointer"
                                        >
                                           <div className="flex items-center gap-2 w-full">
                                                <Users className="h-4 w-4 text-muted-foreground"/>
                                                <div>
                                                    <p className="text-sm">{result.persona.nombreCompleto}</p>
                                                    <p className="text-xs text-muted-foreground">{result.persona.cedula}</p>
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
