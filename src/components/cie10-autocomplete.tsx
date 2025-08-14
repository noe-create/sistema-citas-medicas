
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  X,
  PlusCircle,
  Wand2,
  FilePenLine,
  Trash2,
} from 'lucide-react';
import type { Patient, Cie10Code, Diagnosis } from '@/lib/types';
import { searchCie10Codes } from '@/actions/patient-actions';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDesc,
} from '@/components/ui/dialog';

// Sub-component for CIE-10 Autocomplete
interface Cie10AutocompleteProps {
  selected: Diagnosis[];
  onChange: (diagnoses: Diagnosis[]) => void;
}
export function Cie10Autocomplete({ selected, onChange }: Cie10AutocompleteProps) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Cie10Code[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      const data = await searchCie10Codes(query);
      setResults(data);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (code: Cie10Code) => {
    if (!selected.some((s) => s.cie10Code === code.code)) {
      onChange([
        ...selected,
        { cie10Code: code.code, cie10Description: code.description },
      ]);
    }
    setQuery('');
    setIsPopoverOpen(false);
  };

  const handleRemove = (codeToRemove: string) => {
    onChange(selected.filter((s) => s.cie10Code !== codeToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[4.5rem] p-2 border rounded-md bg-background">
        {selected.length === 0 && (
          <span className="text-sm text-muted-foreground flex items-center justify-center w-full h-full">
            Ningún diagnóstico seleccionado
          </span>
        )}
        {selected.map((diagnosis) => (
          <Badge key={diagnosis.cie10Code} variant="secondary">
            {diagnosis.cie10Code}: {diagnosis.cie10Description}
            <button
              type="button"
              onClick={() => handleRemove(diagnosis.cie10Code)}
              className="ml-2 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
      </div>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start font-normal"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir diagnóstico del catálogo
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-[--radix-popover-trigger-width]"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar código o descripción CIE-10..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {isLoading && <CommandItem disabled>Buscando...</CommandItem>}
              {!isLoading && results.length === 0 && query.length > 1 && (
                <CommandEmpty>No se encontraron resultados.</CommandEmpty>
              )}
              {results.map((result) => (
                <CommandItem
                  key={result.code}
                  value={result.description}
                  onSelect={() => handleSelect(result)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col w-full">
                    <span className="font-semibold">{result.code}</span>
                    <span className="text-muted-foreground text-wrap">
                      {result.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
