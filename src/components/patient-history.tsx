
'use client';

import * as React from 'react';
import { getPatientHistory } from '@/actions/patient-actions';
import type { HistoryEntry } from '@/lib/types';
import { Loader2, Calendar, Stethoscope, Pill, Paperclip, FileText, ClipboardCheck, HeartPulse, User, Users, Baby, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface PatientHistoryProps {
  personaId: string;
}

export function PatientHistory({ personaId }: PatientHistoryProps) {
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchHistory() {
      if (!personaId) return;
      setIsLoading(true);
      try {
        const data = await getPatientHistory(personaId);
        setHistory(data);
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
        <ClipboardCheck className="h-10 w-10 mb-2" />
        <p className="font-semibold">No hay historial clínico</p>
        <p className="text-sm">Esta es la primera visita del paciente.</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full" defaultValue={history[0]?.data.id}>
      {history.map((entry) => {
        if (entry.type === 'consultation') {
            const consultation = entry.data;
            return (
                <AccordionItem value={consultation.id} key={consultation.id}>
                    <AccordionTrigger>
                        <div className="flex items-center gap-2 text-left">
                        <Calendar className="h-4 w-4" />
                        <span className="font-semibold">
                            Consulta: {format(consultation.consultationDate, "PPP 'a las' p", { locale: es })}
                        </span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pl-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <HistorySection icon={<HeartPulse/>} title="Anamnesis">
                                <HistoryDetail label="Motivo de Consulta" value={consultation.motivoConsulta} />
                                <HistoryDetail label="Enfermedad Actual" value={consultation.enfermedadActual} />
                                <HistoryDetail label="Revisión por Sistemas" value={consultation.revisionPorSistemas} />
                            </HistorySection>

                             <HistorySection icon={<HeartPulse/>} title="Examen Físico">
                                {consultation.signosVitales && (
                                    <div className="mb-2">
                                        <h4 className="font-semibold mb-1 text-sm">Signos Vitales</h4>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>TA</TableHead>
                                                    <TableHead>FC</TableHead>
                                                    <TableHead>FR</TableHead>
                                                    <TableHead>T°</TableHead>
                                                    <TableHead>Peso</TableHead>
                                                    <TableHead>Talla</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell>{consultation.signosVitales.ta || 'N/A'}</TableCell>
                                                    <TableCell>{consultation.signosVitales.fc || 'N/A'}</TableCell>
                                                    <TableCell>{consultation.signosVitales.fr || 'N/A'}</TableCell>
                                                    <TableCell>{consultation.signosVitales.temp || 'N/A'}</TableCell>
                                                    <TableCell>{consultation.signosVitales.peso || 'N/A'}</TableCell>
                                                    <TableCell>{consultation.signosVitales.talla || 'N/A'}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                                <HistoryDetail label="Examen General" value={consultation.examenFisicoGeneral} />
                            </HistorySection>

                            <HistorySection icon={<User/>} title="Antecedentes Personales">
                                <HistoryDetail label="Patológicos" value={consultation.antecedentesPersonales?.patologicos} />
                                <HistoryDetail label="Quirúrgicos" value={consultation.antecedentesPersonales?.quirurgicos} />
                                <HistoryDetailList label="Alérgicos" values={consultation.antecedentesPersonales?.alergicos} otherValue={consultation.antecedentesPersonales?.alergicosOtros} />
                                <HistoryDetail label="Medicamentos" value={consultation.antecedentesPersonales?.medicamentos} />
                                <HistoryDetailList label="Hábitos Psicobiológicos" values={consultation.antecedentesPersonales?.habitos} otherValue={consultation.antecedentesPersonales?.habitosOtros} />
                            </HistorySection>
                            
                            <HistorySection icon={<Users/>} title="Antecedentes Familiares">
                                <HistoryDetail value={consultation.antecedentesFamiliares} />
                            </HistorySection>

                            {consultation.antecedentesGinecoObstetricos &&
                                <HistorySection icon={<Stethoscope/>} title="Antecedentes Gineco-Obstétricos">
                                    <HistoryDetail label="Menarquia" value={consultation.antecedentesGinecoObstetricos.menarquia} />
                                    <HistoryDetail label="Ciclos" value={consultation.antecedentesGinecoObstetricos.ciclos} />
                                    <HistoryDetail label="FUM" value={consultation.antecedentesGinecoObstetricos.fum ? format(new Date(consultation.antecedentesGinecoObstetricos.fum), 'PPP', {locale: es}) : 'N/A'} />
                                    <HistoryDetail label="G" value={consultation.antecedentesGinecoObstetricos.g} />
                                    <HistoryDetail label="P" value={consultation.antecedentesGinecoObstetricos.p} />
                                    <HistoryDetail label="A" value={consultation.antecedentesGinecoObstetricos.a} />
                                    <HistoryDetail label="C" value={consultation.antecedentesGinecoObstetricos.c} />
                                    <HistoryDetail label="MAC" value={consultation.antecedentesGinecoObstetricos.metodoAnticonceptivo} />
                                </HistorySection>
                            }

                            {consultation.antecedentesPediatricos &&
                                <HistorySection icon={<Baby/>} title="Antecedentes Pediátricos">
                                    <HistoryDetail label="Prenatales" value={consultation.antecedentesPediatricos.prenatales} />
                                    <HistoryDetail label="Natales" value={consultation.antecedentesPediatricos.natales} />
                                    <HistoryDetail label="Postnatales" value={consultation.antecedentesPediatricos.postnatales} />
                                    <HistoryDetail label="Inmunizaciones" value={consultation.antecedentesPediatricos.inmunizaciones} />
                                    <HistoryDetail label="Desarrollo Psicomotor" value={consultation.antecedentesPediatricos.desarrolloPsicomotor} />
                                </HistorySection>
                            }
                        </div>

                        <HistorySection icon={<BrainCircuit/>} title="Impresión Diagnóstica">
                             <div className="flex flex-wrap gap-2">
                                {consultation.diagnoses.length > 0 ? consultation.diagnoses.map((dx) => (
                                <Badge key={dx.cie10Code} variant="secondary">
                                    {dx.cie10Code}: {dx.cie10Description}
                                </Badge>
                                )) : <p className="text-sm text-muted-foreground">N/A</p>}
                            </div>
                        </HistorySection>

                        <HistorySection icon={<Pill/>} title="Plan de Tratamiento">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{consultation.treatmentPlan || 'N/A'}</p>
                        </HistorySection>

                        {consultation.documents && consultation.documents.length > 0 && (
                            <HistorySection icon={<Paperclip/>} title="Documentos Adjuntos">
                                <div className="flex flex-col gap-3">
                                    {consultation.documents.map(doc => (
                                        <div key={doc.id} className="p-3 rounded-md border bg-secondary/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 font-medium text-primary">
                                                    <FileText className="h-4 w-4" />
                                                    <a 
                                                        href={doc.fileData}
                                                        download={doc.fileName}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hover:underline"
                                                    >
                                                        {doc.fileName}
                                                    </a>
                                                </div>
                                                <Badge variant="outline" className="capitalize">{doc.documentType}</Badge>
                                            </div>
                                            {doc.description && <p className="text-sm text-muted-foreground mt-1 pl-6">{doc.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            </HistorySection>
                        )}
                    </AccordionContent>
                </AccordionItem>
            )
        } else if (entry.type === 'treatment_execution') {
            const execution = entry.data;
            return (
                <AccordionItem value={execution.id} key={execution.id}>
                    <AccordionTrigger>
                        <div className="flex items-center gap-2 text-left">
                        <ClipboardCheck className="h-4 w-4" />
                        <span className="font-semibold">
                            Ejecución de Tratamiento: {format(execution.executionTime, "PPP 'a las' p", { locale: es })}
                        </span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pl-2">
                        <HistoryDetail label="Procedimiento" value={execution.procedureDescription} />
                        <HistoryDetail label="Observaciones" value={execution.observations} />
                        <HistoryDetail label="Ejecutado por" value={execution.executedBy} />
                    </AccordionContent>
                </AccordionItem>
            )
        }
        return null;
      })}
    </Accordion>
  );
}


const HistorySection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <div className="space-y-2 rounded-lg border bg-card p-4">
        <h3 className="font-semibold flex items-center gap-2"><span className="text-primary">{icon}</span>{title}</h3>
        <div className="space-y-2 pl-6">{children}</div>
    </div>
);


const HistoryDetail = ({ label, value }: { label?: string, value: any }) => {
    const displayValue = value === undefined || value === null || value === '' ? 'N/A' : String(value);
    
    return (
        <div>
            {label && <h4 className="font-semibold text-sm">{label}</h4>}
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{displayValue}</p>
        </div>
    );
};

const HistoryDetailList = ({ label, values, otherValue }: { label: string, values?: string[], otherValue?: string }) => {
    const formatLabel = (id: string) => {
        return id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    if ((!values || values.length === 0) && !otherValue) {
        return <HistoryDetail label={label} value="N/A" />;
    }
    
    const allItems: string[] = [...(values || []).map(formatLabel)];
    if (otherValue) {
        allItems.push(`Otros: ${otherValue}`);
    }

    return (
        <div>
            <h4 className="font-semibold text-sm">{label}</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
                {allItems.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    );
};
