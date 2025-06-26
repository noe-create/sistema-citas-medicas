'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Persona } from '@/lib/types';
import { PatientHistory } from '@/components/patient-history';
import { HceSearch } from '@/components/hce-search';
import { Telescope } from 'lucide-react';

export default function HcePage() {
  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Historia Clínica Electrónica (HCE)</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Buscar Persona</CardTitle>
            <CardDescription>
              Busque por nombre o cédula para ver el historial clínico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HceSearch onPersonaSelect={setSelectedPersona} />
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
            {selectedPersona ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de: {selectedPersona.nombreCompleto}</CardTitle>
                        <CardDescription>Cédula: {selectedPersona.cedula}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PatientHistory personaId={selectedPersona.id} />
                    </CardContent>
                </Card>
            ) : (
                <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed bg-card/50 p-8 text-center">
                    <Telescope className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Seleccione una persona</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Use el buscador para encontrar a una persona y ver su historial clínico completo.
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
