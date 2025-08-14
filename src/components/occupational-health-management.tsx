
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Persona } from '@/lib/types';
import { HceSearch } from '@/components/hce-search';
import { Telescope, ClipboardPlus } from 'lucide-react';
import { OccupationalHealthForm } from './occupational-health-form';
import { Button } from './ui/button';
import { useSearchParams } from 'next/navigation';
import { getPersonaById } from '@/actions/patient-actions';

export function OccupationalHealthManagement() {
  const searchParams = useSearchParams();
  const personaIdParam = searchParams.get('personaId');

  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);
  const [isFormVisible, setIsFormVisible] = React.useState(false);
  const [isLoadingParam, setIsLoadingParam] = React.useState(true);

  React.useEffect(() => {
    if (personaIdParam) {
      const fetchPersona = async () => {
        setIsLoadingParam(true);
        const persona = await getPersonaById(personaIdParam);
        if (persona) {
          setSelectedPersona(persona);
          setIsFormVisible(true);
        }
        setIsLoadingParam(false);
      };
      fetchPersona();
    } else {
        setIsLoadingParam(false);
    }
  }, [personaIdParam]);


  const handleStartConsultation = () => {
    if (selectedPersona) {
      setIsFormVisible(true);
    }
  };
  
  const handleConsultationFinished = () => {
      setIsFormVisible(false);
      setSelectedPersona(null);
  }
  
  if (isLoadingParam) {
    return (
        <Card className="mx-auto max-w-2xl">
            <CardHeader><CardTitle>Cargando...</CardTitle></CardHeader>
            <CardContent>
                <div className="flex justify-center items-center h-48">
                    <Telescope className="h-12 w-12 text-muted-foreground animate-pulse" />
                </div>
            </CardContent>
        </Card>
    )
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
