'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Persona } from '@/lib/types';
import { PatientHistory } from '@/components/patient-history';
import { HceSearch } from '@/components/hce-search';
import { Telescope } from 'lucide-react';
import { PatientSummary } from '@/components/patient-summary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
            <CardTitle>Buscar Paciente</CardTitle>
            <CardDescription>
              Busque por nombre o cédula para ver el resumen y el historial clínico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HceSearch onPersonaSelect={setSelectedPersona} />
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
            {selectedPersona ? (
                <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="summary">Resumen Clínico con IA</TabsTrigger>
                        <TabsTrigger value="history">Historial Cronológico Completo</TabsTrigger>
                    </TabsList>
                    <TabsContent value="summary" className="mt-4">
                        <PatientSummary persona={selectedPersona} />
                    </TabsContent>
                    <TabsContent value="history" className="mt-4">
                         <Card>
                            <CardHeader>
                                <CardTitle>Historial Completo de: {selectedPersona.nombreCompleto}</CardTitle>
                                <CardDescription>Cédula: {selectedPersona.cedula}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <PatientHistory personaId={selectedPersona.id} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            ) : (
                <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed bg-card/50 p-8 text-center">
                    <Telescope className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Seleccione un paciente</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Use el buscador para encontrar a un paciente y ver su información clínica.
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
