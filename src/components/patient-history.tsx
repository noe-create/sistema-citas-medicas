

'use client';

import * as React from 'react';
import { getPatientHistory } from '@/actions/patient-actions';
import type { HistoryEntry, LabOrder, Consultation } from '@/lib/types';
import { Loader2, Calendar, ClipboardCheck, Printer, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LabOrderDisplay } from './lab-order-display';
import { MedicalReportDisplay } from './medical-report-display';
import { Button } from './ui/button';
import { PrescriptionDisplay } from './prescription-display';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface PatientHistoryProps {
  personaId: string;
}

type DocumentToView = {
    type: 'informe' | 'recipe' | 'laboratorio';
    data: Consultation | LabOrder;
}

export function PatientHistory({ personaId }: PatientHistoryProps) {
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedEntry, setSelectedEntry] = React.useState<HistoryEntry | null>(null);
  const [documentToView, setDocumentToView] = React.useState<DocumentToView | null>(null);
  const { toast } = useToast();
  
  const printRef = React.useRef<HTMLDivElement>(null);

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
  
  const handlePrint = () => {
    const node = printRef.current;
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
        } else if (styleSheet.cssRules) {
            const style = document.createElement('style');
            style.textContent = Array.from(styleSheet.cssRules).map(rule => rule.cssText).join(' ');
            iframeDoc.head.appendChild(style);
        }
    });

    const printStyles = `
        body { 
            margin: 0; 
            font-family: 'Figtree', sans-serif;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
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
  
  const getModalTitle = () => {
    if (!documentToView) return '';
    switch(documentToView.type) {
        case 'informe': return 'Visor de Informe Médico';
        case 'recipe': return 'Visor de Récipe Médico';
        case 'laboratorio': return 'Visor de Orden de Laboratorio';
    }
  }

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
                    <CardTitle>Documentos de la Visita</CardTitle>
                    <CardDescription>Seleccione un documento del historial y luego utilice los botones para ver o imprimir.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {selectedConsultation ? (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader className="flex-row justify-between items-center">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">Informe Médico</CardTitle>
                                        <CardDescription>Resumen de la consulta médica.</CardDescription>
                                    </div>
                                    <Button onClick={() => setDocumentToView({ type: 'informe', data: selectedConsultation })}>Ver e Imprimir</Button>
                                </CardHeader>
                            </Card>
                            
                            {(selectedConsultation.treatmentPlan || (selectedConsultation.treatmentOrder && selectedConsultation.treatmentOrder.items.length > 0)) && (
                                <Card>
                                    <CardHeader className="flex-row justify-between items-center">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg">Récipe Médico</CardTitle>
                                            <CardDescription>Indicaciones y medicamentos.</CardDescription>
                                        </div>
                                        <Button onClick={() => setDocumentToView({ type: 'recipe', data: selectedConsultation })}>Ver e Imprimir</Button>
                                    </CardHeader>
                                </Card>
                            )}

                            {associatedLabOrder && (
                               <Card>
                                    <CardHeader className="flex-row justify-between items-center">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg">Orden de Laboratorio</CardTitle>
                                            <CardDescription>Exámenes de laboratorio solicitados.</CardDescription>
                                        </div>
                                        <Button onClick={() => setDocumentToView({ type: 'laboratorio', data: associatedLabOrder })}>Ver e Imprimir</Button>
                                    </CardHeader>
                                </Card>
                            )}
                        </div>
                    ) : selectedEntry?.type === 'lab_order' ? (
                        <Card>
                            <CardHeader className="flex-row justify-between items-center">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">Orden de Laboratorio</CardTitle>
                                    <CardDescription>Exámenes de laboratorio solicitados.</CardDescription>
                                </div>
                                <Button onClick={() => setDocumentToView({ type: 'laboratorio', data: selectedEntry.data as LabOrder })}>Ver e Imprimir</Button>
                            </CardHeader>
                        </Card>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center border-dashed border rounded-lg">
                             <FileText className="h-10 w-10 mb-2" />
                            <p>Seleccione una entrada del historial para ver los documentos disponibles.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
        
        <Dialog open={!!documentToView} onOpenChange={(open) => !open && setDocumentToView(null)}>
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle>{getModalTitle()}</DialogTitle>
                    <DialogDescription>
                        Puede usar el botón de abajo para imprimir este documento.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-auto">
                    {documentToView?.type === 'informe' && <div ref={printRef}><MedicalReportDisplay consultation={documentToView.data as Consultation} /></div>}
                    {documentToView?.type === 'recipe' && <div ref={printRef}><PrescriptionDisplay consultation={documentToView.data as Consultation} /></div>}
                    {documentToView?.type === 'laboratorio' && <div ref={printRef}><LabOrderDisplay order={documentToView.data as LabOrder} /></div>}
                </div>
                <div className="flex justify-end pt-4">
                    <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Imprimir Documento</Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
