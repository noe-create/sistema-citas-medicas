
'use client';

import * as React from 'react';
import { ChevronsUpDown, Loader2, User, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getPersonas } from '@/actions/patient-actions';
import type { Persona } from '@/lib/types';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

interface PersonaSearchProps {
  onPersonaSelect: (persona: Persona | null) => void;
  excludeIds?: string[];
  placeholder?: string;
  className?: string;
}

export function PersonaSearch({ onPersonaSelect, excludeIds = [], placeholder = "Buscar persona...", className }: PersonaSearchProps) {
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = React.useState<Persona[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);

  // By stringifying the `excludeIds` array with useMemo, we create a stable dependency for the useEffect hook.
  // This prevents the infinite re-render loop caused by the parent component creating a new array reference on every render.
  const stableExcludeIds = React.useMemo(() => JSON.stringify(excludeIds.sort()), [excludeIds]);

  React.useEffect(() => {
    if (debouncedQuery.length < 1 && !isPopoverOpen) {
        setResults([]);
        return;
    }
    
    async function search() {
        setIsLoading(true);
        try {
            const currentExcludeIds = JSON.parse(stableExcludeIds);
            const data = await getPersonas(debouncedQuery);
            const filteredData = data.personas.filter(p => !currentExcludeIds.includes(p.id));
            setResults(filteredData);
        } catch (e) {
            console.error("Error searching people:", e);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }
    search();
  }, [debouncedQuery, stableExcludeIds, isPopoverOpen]);

  const handleSelect = (persona: Persona | null) => {
    setSelectedPersona(persona);
    onPersonaSelect(persona);
    setIsPopoverOpen(false);
    setQuery('');
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
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
            ) : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </PopoverTrigger>
        {selectedPersona && (
            <Button variant="ghost" size="icon" onClick={() => handleSelect(null)} aria-label="Limpiar selección">
                <UserX className="h-4 w-4" />
            </Button>
        )}
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
            <Command shouldFilter={false}>
            <CommandInput
                placeholder="Buscar por nombre o cédula..."
                value={query}
                onValueChange={setQuery}
                className="h-9"
            />
            <CommandList>
                {isLoading && <CommandItem disabled><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Buscando...</CommandItem>}
                <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                {results.length > 0 && !isLoading && (
                <CommandGroup>
                    {results.map((persona) => (
                    <CommandItem
                        key={persona.id}
                        value={persona.nombreCompleto}
                        onSelect={() => handleSelect(persona)}
                        className="cursor-pointer"
                    >
                        <div className="flex items-center gap-2 w-full">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-sm">{persona.nombreCompleto}</p>
                            <p className="text-xs text-muted-foreground">
                            {persona.cedula}
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
