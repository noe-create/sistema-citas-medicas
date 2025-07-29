'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getPatientSummary } from '@/actions/patient-actions';
import type { PatientSummary, Persona } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, BrainCircuit, HeartPulse, Loader2, Thermometer, User, FileText, Pill, Siren } from 'lucide-react';
import { Badge } from './ui/badge';
import { calculateAge } from '@/lib/utils';

interface PatientSummaryProps {
  persona: Persona;
}

export function PatientSummary({ persona }: PatientSummaryProps) {
  const [summary, setSummary] = React.useState<PatientSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchSummary() {
      if (!persona?.id) return;
      setIsLoading(true);
      try {
        const summaryData = await getPatientSummary(persona.id);
        setSummary(summaryData);
      } catch (error) {
        console.error('Error fetching patient summary:', error);
        toast({
          title: 'Error al cargar el resumen',
          description: 'No se pudo obtener el resumen clínico del paciente.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchSummary();
  }, [persona, toast]);
  
  const age = calculateAge(new Date(persona.fechaNacimiento));
  
  const hasContent = summary && (
    summary.knownAllergies.length > 0 ||
    summary.chronicOrImportantDiagnoses.length > 0 ||
    summary.currentMedications.length > 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
            <CardTitle className="text-2xl">{persona.nombreCompleto}</CardTitle>
            <CardDescription className="flex items-center gap-4">
                <span>{age} años</span>
                <span>C.I: {persona.cedula}</span>
                <span>{persona.genero}</span>
            </CardDescription>
        </CardHeader>
      </Card>

        {isLoading ? (
             <Card>
                <CardContent className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="ml-2">Analizando historial clínico con IA...</p>
                </CardContent>
            </Card>
        ) : !hasContent ? (
            <Card>
                <CardContent className="flex flex-col justify-center items-center h-96 text-center text-muted-foreground">
                    <FileText className="h-10 w-10 mb-2" />
                    <p className="font-semibold">No se encontró información para resumir.</p>
                    <p className="text-sm">El historial del paciente no contiene alergias, diagnósticos crónicos o medicación recurrente registrada.</p>
                </CardContent>
            </Card>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                <SummaryCard
                    title="Alergias Conocidas"
                    icon={<Siren className="text-red-500" />}
                    items={summary.knownAllergies}
                    emptyText="No se registraron alergias."
                />
                <SummaryCard
                    title="Diagnósticos Relevantes"
                    icon={<HeartPulse className="text-blue-500" />}
                    items={summary.chronicOrImportantDiagnoses}
                    emptyText="No se encontraron diagnósticos crónicos o importantes."
                />
                <SummaryCard
                    title="Medicación Crónica"
                    icon={<Pill className="text-green-500" />}
                    items={summary.currentMedications}
                    emptyText="No se registró medicación de uso crónico."
                />
            </div>
        )}
    </div>
  );
}

interface SummaryCardProps {
    title: string;
    icon: React.ReactNode;
    items: string[];
    emptyText: string;
}

const SummaryCard = ({ title, icon, items, emptyText }: SummaryCardProps) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <div className="p-2 bg-muted rounded-md">{icon}</div>
                <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {items.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {items.map((item, index) => (
                            <Badge key={index} variant="secondary">{item}</Badge>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">{emptyText}</p>
                )}
            </CardContent>
        </Card>
    );
}
