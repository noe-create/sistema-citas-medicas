
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Persona } from '@/lib/types';
import { HceSearch } from '@/components/hce-search';
import { Telescope, ClipboardPlus } from 'lucide-react';
import { OccupationalHealthForm } from './occupational-health-form';
import { Button } from './ui/button';

export function OccupationalHealthManagement() {
  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);
  const [isFormVisible, setIsFormVisible] = React.useState(false);

  const handleStartConsultation = () => {
    if (selectedPersona) {
      setIsFormVisible(true);
    }
  };
  
  const handleConsultationFinished = () => {
      setIsFormVisible(false);
      setSelectedPersona(null);
  }

  return (
    <div className="space-y-6">
      {!isFormVisible ? (
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Iniciar Evaluación Ocupacional</CardTitle>
            <CardDescription>
              Busque un trabajador por nombre o cédula para comenzar una nueva
              evaluación de salud ocupacional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <HceSearch onPersonaSelect={setSelectedPersona} />
            {selectedPersona && (
              <Button onClick={handleStartConsultation} className="w-full">
                <ClipboardPlus className="mr-2 h-4 w-4" />
                Iniciar Evaluación para {selectedPersona.nombreCompleto}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        selectedPersona && <OccupationalHealthForm persona={selectedPersona} onFinished={handleConsultationFinished} />
      )}
    </div>
  );
}
