
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LAB_TESTS, type LabTest, type LabTestCategory } from '@/lib/lab-tests';
import { useDebounce } from '@/hooks/use-debounce';
import { Beaker } from 'lucide-react';

interface LabOrderFormProps {
  onSubmitted: (selectedTests: string[]) => void;
  onCancel: () => void;
}

export function LabOrderForm({ onSubmitted, onCancel }: LabOrderFormProps) {
  const [selectedTests, setSelectedTests] = React.useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const handleToggleTest = (testId: string) => {
    setSelectedTests(prev => ({ ...prev, [testId]: !prev[testId] }));
  };

  const filteredCategories = React.useMemo(() => {
    if (!debouncedSearchTerm) {
      return LAB_TESTS;
    }
    const lowercasedFilter = debouncedSearchTerm.toLowerCase();
    const filtered: LabTestCategory[] = [];

    LAB_TESTS.forEach(category => {
      const tests = category.tests.filter(test =>
        test.name.toLowerCase().includes(lowercasedFilter)
      );
      if (tests.length > 0) {
        filtered.push({ ...category, tests });
      }
    });

    return filtered;
  }, [debouncedSearchTerm]);
  
  const defaultOpenAccordionItems = React.useMemo(() => {
    if (debouncedSearchTerm) {
        return filteredCategories.map(c => c.category);
    }
    return [];
  }, [debouncedSearchTerm, filteredCategories]);

  const handleSubmit = () => {
    const selected = Object.entries(selectedTests)
      .filter(([, isSelected]) => isSelected)
      .map(([testId]) => {
          for (const category of LAB_TESTS) {
              const found = category.tests.find(t => t.id === testId);
              if (found) return found.name;
          }
          return '';
      }).filter(Boolean);
    
    onSubmitted(selected);
  };

  const selectedCount = Object.values(selectedTests).filter(Boolean).length;

  return (
    <div className="flex flex-col h-[70vh]">
      <div className="p-4 border-b">
        <Input
          placeholder="Buscar examen de laboratorio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={defaultOpenAccordionItems} className="p-4">
          {filteredCategories.map((category) => (
            <AccordionItem value={category.category} key={category.category}>
              <AccordionTrigger>{category.category}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-4">
                  {category.tests.map((test) => (
                    <div key={test.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={test.id}
                        checked={selectedTests[test.id] || false}
                        onCheckedChange={() => handleToggleTest(test.id)}
                      />
                      <Label htmlFor={test.id} className="font-normal">
                        {test.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
      <div className="flex justify-between items-center p-4 border-t bg-background">
        <div className="text-sm text-muted-foreground">
          <span className="font-bold">{selectedCount}</span> examen(es) seleccionado(s)
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button onClick={handleSubmit}>
                <Beaker className="mr-2 h-4 w-4" />
                Añadir a la Orden
            </Button>
        </div>
      </div>
    </div>
  );
}
