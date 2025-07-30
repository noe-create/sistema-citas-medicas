'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getServices } from '@/actions/patient-actions';
import type { Service } from '@/lib/types';
import { useDebounce } from '@/hooks/use-debounce';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface ServiceSelectorProps {
  selectedServices: Service[];
  onChange: (services: Service[]) => void;
}

export function ServiceSelector({ selectedServices, onChange }: ServiceSelectorProps) {
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [allServices, setAllServices] = React.useState<Service[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    async function fetchServices() {
      setIsLoading(true);
      try {
        const data = await getServices(debouncedQuery);
        setAllServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchServices();
  }, [debouncedQuery]);
  
  const handleSelect = (service: Service) => {
    if (!selectedServices.some(s => s.id === service.id)) {
      onChange([...selectedServices, service]);
    }
    setQuery('');
    setIsPopoverOpen(false);
  };
  
  const handleRemove = (serviceToRemove: Service) => {
    onChange(selectedServices.filter(s => s.id !== serviceToRemove.id));
  };

  return (
    <div className="space-y-2">
      <div className={cn("flex flex-wrap gap-2 min-h-[4.5rem] p-2 border rounded-md bg-background", selectedServices.length === 0 && "items-center justify-center")}>
        {selectedServices.length === 0 && (
          <span className="text-sm text-muted-foreground">Ningún servicio añadido</span>
        )}
        {selectedServices.map(service => (
          <Badge key={service.id} variant="secondary">
            {service.name}
            <button type="button" onClick={() => handleRemove(service)} className="ml-2 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
      </div>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start font-normal">
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir servicio prestado
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Buscar servicio..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {isLoading && <CommandItem disabled>Buscando...</CommandItem>}
              {!isLoading && allServices.length === 0 && <CommandEmpty>No se encontraron resultados.</CommandEmpty>}
              {allServices.map((service) => (
                <CommandItem
                  key={service.id}
                  value={service.name}
                  onSelect={() => handleSelect(service)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{service.name}</span>
                    <span className="text-muted-foreground text-xs">{service.price.toFixed(2)} VES</span>
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
