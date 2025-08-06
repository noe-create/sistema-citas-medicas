

'use client';

import * as React from 'react';
import { getPatientHistory } from '@/actions/patient-actions';
import type { HistoryEntry, LabOrder, Consultation } from '@/lib/types';
import { Loader2, Calendar, ClipboardCheck, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LabOrderDisplay } from './lab-order-display';
import { MedicalReportDisplay } from './medical-report-display';
import { Button } from './ui/button';
import { PrescriptionDisplay } from './prescription-display';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface PatientHistoryProps {
  personaId: string;
}

export function PatientHistory({ personaId }: PatientHistoryProps) {
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedEntry, setSelectedEntry] = React.useState<HistoryEntry | null>(null);
  const { toast } = useToast();
  
  const medicalReportRef = React.useRef<HTMLDivElement>(null);
  const prescriptionRef = React.useRef<HTMLDivElement>(null);
  const labOrderRef = React.useRef<HTMLDivElement>(null);


  React.useEffect(() => {
    async function fetchHistory() {
      if (!personaId) return;
      setIsLoading(true);
      try {
        const data = await getPatientHistory(personaId);
        setHistory(data);
        if (data.length > 0) {
            const firstConsultation = data.find(e => e.type === 'consultation') || data[0];
            setSelectedEntry(firstConsultation);
        }
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

  const handlePrint = (nodeRef: React.RefObject<HTMLDivElement>) => {
    const node = nodeRef.current;
    if (!node) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const stylesheets = Array.from(document.styleSheets);
    stylesheets.forEach(styleSheet => {
        if (styleSheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = styleSheet.href;
            iframeDoc.head.appendChild(link);
        }
    });

    const printStyles = `
        @import url('https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap');
        
        body { 
            margin: 0; 
            font-family: 'Figtree', sans-serif;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
        }
        @page {
            size: auto;
            margin: 0;
        }
    `;
    const styleEl = iframeDoc.createElement('style');
    styleEl.innerHTML = printStyles;
    iframeDoc.head.appendChild(styleEl);
    
    const clonedNode = node.cloneNode(true) as HTMLElement;
    iframeDoc.body.innerHTML = ''; // Clear previous content
    iframeDoc.body.appendChild(clonedNode);

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center text-muted-foreground bg-card rounded-lg border border-dashed">
        <ClipboardCheck className="h-12 w-12 mb-4" />
        <h3 className="text-xl font-semibold">No hay historial clínico</h3>
        <p className="text-sm max-w-sm">Esta persona aún no tiene consultas ni órdenes de laboratorio registradas en el sistema.</p>
      </div>
    );
  }
  
  const findLabOrderForConsultation = (consultationId: string): LabOrder | undefined => {
    const labOrderEntry = history.find(entry => entry.type === 'lab_order' && entry.data.consultationId === consultationId);
    return labOrderEntry ? (labOrderEntry.data as LabOrder) : undefined;
  };

  const selectedConsultation = selectedEntry?.type === 'consultation' ? selectedEntry.data as Consultation : null;
  const associatedLabOrder = selectedConsultation ? findLabOrderForConsultation(selectedConsultation.id) : null;
  
  return (
    <div className="flex gap-6">
        <aside className="w-1/4">
            <h3 className="font-semibold mb-2">Historial de Visitas</h3>
            <div className="flex flex-col gap-2">
                {history.map(entry => (
                    <Button 
                        key={entry.data.id}
                        variant={selectedEntry?.data.id === entry.data.id ? 'secondary' : 'ghost'}
                        onClick={() => setSelectedEntry(entry)}
                        className="w-full justify-start text-left h-auto py-2"
                    >
                        <div className="flex flex-col">
                            <span className="font-medium capitalize">{entry.type === 'consultation' ? `Consulta` : 'Orden de Laboratorio'}</span>
                            <span className="text-xs text-muted-foreground">{format(entry.data.consultationDate || entry.data.orderDate, "PPP", { locale: es })}</span>
                        </div>
                    </Button>
                ))}
            </div>
        </aside>
        <main className="w-3/4">
            <Card>
                <CardHeader>
                    <CardTitle>Visor de Documentos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {selectedConsultation ? (
                        <>
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-semibold">Informe Médico</h4>
                                <div ref={medicalReportRef}><MedicalReportDisplay consultation={selectedConsultation} /></div>
                                <Button onClick={() => handlePrint(medicalReportRef)} className="mt-2 w-full"><Printer className="mr-2 h-4 w-4"/>Imprimir Informe</Button>
                            </div>
                            
                            {selectedConsultation.treatmentOrder && selectedConsultation.treatmentOrder.items.length > 0 && (
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-semibold">Récipe Médico</h4>
                                    <div ref={prescriptionRef}><PrescriptionDisplay consultation={selectedConsultation} /></div>
                                    <Button onClick={() => handlePrint(prescriptionRef)} className="mt-2 w-full"><Printer className="mr-2 h-4 w-4"/>Imprimir Récipe</Button>
                                </div>
                            )}

                            {associatedLabOrder && (
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-semibold">Orden de Laboratorio</h4>
                                    <div ref={labOrderRef}><LabOrderDisplay order={associatedLabOrder} /></div>
                                    <Button onClick={() => handlePrint(labOrderRef)} className="mt-2 w-full"><Printer className="mr-2 h-4 w-4"/>Imprimir Orden de Laboratorio</Button>
                                </div>
                            )}
                        </>
                    ) : selectedEntry?.type === 'lab_order' ? (
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold">Orden de Laboratorio</h4>
                            <div ref={labOrderRef}><LabOrderDisplay order={selectedEntry.data as LabOrder} /></div>
                            <Button onClick={() => handlePrint(labOrderRef)} className="mt-2 w-full"><Printer className="mr-2 h-4 w-4"/>Imprimir Orden de Laboratorio</Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>Seleccione una entrada del historial para ver los detalles.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    </div>
  );
}

