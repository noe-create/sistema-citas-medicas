'use client';

import * as React from 'react';
import { getPatientHistory } from '@/actions/patient-actions';
import type { Consultation } from '@/lib/types';
import { Loader2, Calendar, Stethoscope, ClipboardList, Pill, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PatientHistoryProps {
  personaId: string;
}

export function PatientHistory({ personaId }: PatientHistoryProps) {
  const [history, setHistory] = React.useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchHistory() {
      if (!personaId) return;
      setIsLoading(true);
      try {
        const data = await getPatientHistory(personaId);
        setHistory(data.map(c => ({...c, consultationDate: new Date(c.consultationDate)})));
      } catch (error) {
        console.error('Error fetching patient history:', error);
        toast({
          title: 'Error al cargar historial',
          description: 'No se pudo obtener el historial del paciente.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, [personaId, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground bg-secondary/50 rounded-lg">
        <ClipboardList className="h-10 w-10 mb-2" />
        <p className="font-semibold">No hay historial clínico</p>
        <p className="text-sm">Esta es la primera visita del paciente.</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {history.map((consultation) => (
        <AccordionItem value={consultation.id} key={consultation.id}>
          <AccordionTrigger>
            <div className="flex items-center gap-2 text-left">
              <Calendar className="h-4 w-4" />
              <span className="font-semibold">
                {format(consultation.consultationDate, "PPP 'a las' p", { locale: es })}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pl-2">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2"><Stethoscope className="h-4 w-4" />Diagnósticos</h4>
              <div className="flex flex-wrap gap-2">
                {consultation.diagnoses.length > 0 ? consultation.diagnoses.map((dx) => (
                  <Badge key={dx.cie10Code} variant="secondary">
                    {dx.cie10Code}: {dx.cie10Description}
                  </Badge>
                )) : <p className="text-sm text-muted-foreground">N/A</p>}
              </div>
            </div>
             <div>
                <h4 className="font-semibold mb-1">Anamnesis</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{consultation.anamnesis || 'N/A'}</p>
            </div>
            <div>
                <h4 className="font-semibold mb-1">Examen Físico</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{consultation.physicalExam || 'N/A'}</p>
            </div>
            <div>
                <h4 className="font-semibold mb-1 flex items-center gap-2"><Pill className="h-4 w-4" />Plan de Tratamiento</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{consultation.treatmentPlan || 'N/A'}</p>
            </div>
            {consultation.documents && consultation.documents.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2"><Paperclip className="h-4 w-4" />Documentos Adjuntos</h4>
                    <div className="flex flex-col gap-2">
                        {consultation.documents.map(doc => (
                            <a 
                                key={doc.id}
                                href={doc.fileData}
                                download={doc.fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                            >
                                {doc.fileName}
                            </a>
                        ))}
                    </div>
                </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
