'use client';

import * as React from 'react';
import { ChevronsUpDown, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { searchCombinedPatients } from '@/actions/patient-actions';
import type { SearchResult } from '@/lib/types';
import { cn } from '@/lib/utils';

interface HceSearchProps {
  onPatientSelect: (patient: SearchResult | null) => void;
}

export function HceSearch({ onPatientSelect }: HceSearchProps) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [selectedPatient, setSelectedPatient] = React.useState<SearchResult | null>(null);

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
        } catch (e) {
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
    setSelectedPatient(result);
    setIsPopoverOpen(false);
    setQuery(''); // Reset search query on select
  };

  return (
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
              <div>
                <p className="text-sm font-medium">{selectedPatient.nombreCompleto}</p>
                <p className="text-xs text-muted-foreground">{selectedPatient.cedula}</p>
              </div>
            </div>
          ) : 'Buscar por nombre o cédula...'}
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
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
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
                      <Users className="h-4 w-4 text-muted-foreground" />
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
  );
}
