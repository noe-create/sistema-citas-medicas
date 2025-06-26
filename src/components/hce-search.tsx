'use client';

import * as React from 'react';
import { ChevronsUpDown, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { searchPeopleForCheckin } from '@/actions/patient-actions';
import type { Persona, SearchResult } from '@/lib/types';

interface HceSearchProps {
  onPersonaSelect: (persona: Persona | null) => void;
}

export function HceSearch({ onPersonaSelect }: HceSearchProps) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);

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

  // Fetch all people when the popover opens for the first time
  React.useEffect(() => {
    if (isPopoverOpen && results.length === 0 && query === '') {
      const fetchInitialData = async () => {
        setIsLoading(true);
        try {
          const data = await searchPeopleForCheckin('');
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
    const persona = result ? result.persona : null;
    onPersonaSelect(persona);
    setSelectedPersona(persona);
    setIsPopoverOpen(false);
    setQuery(''); // Reset search query on select
  };
  
  const getRoles = (result: SearchResult) => {
    const roles = [];
    if (result.titularInfo) roles.push('Titular');
    if (result.beneficiarioDe && result.beneficiarioDe.length > 0) roles.push('Beneficiario');
    return roles.join(', ');
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isPopoverOpen}
          className="w-full justify-between font-normal text-left h-auto"
        >
          {selectedPersona ? (
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm font-medium">{selectedPersona.nombreCompleto}</p>
                <p className="text-xs text-muted-foreground">{selectedPersona.cedula}</p>
              </div>
            </div>
          ) : 'Buscar por nombre o cédula...'}
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
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm">{result.persona.nombreCompleto}</p>
                        <p className="text-xs text-muted-foreground">
                          {result.persona.cedula} &bull; <span className="font-semibold">{getRoles(result)}</span> 
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
