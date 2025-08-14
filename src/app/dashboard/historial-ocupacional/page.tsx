
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Persona, OccupationalHealthEvaluation } from '@/lib/types';
import { HceSearch } from '@/components/hce-search';
import { Telescope, ClipboardCheck, Printer, BookHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import { getOccupationalHealthHistory } from '@/actions/patient-actions';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const OccupationalHealthReportDisplay = dynamic(() => import('@/components/occupational-health-report-display').then(mod => mod.default), {
  loading: () => <p>Cargando informe...</p>,
});

export default function HistorialOcupacionalPage() {
  const { toast } = useToast();
  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);
  const [history, setHistory] = React.useState<OccupationalHealthEvaluation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = React.useState<any | null>(null);
  const [isReportVisible, setIsReportVisible] = React.useState(false);
  const printRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (selectedPersona) {
      const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
          const historyData = await getOccupationalHealthHistory(selectedPersona.id);
          setHistory(historyData);
        } catch (error) {
          toast({
            title: 'Error',
            description: 'No se pudo cargar el historial ocupacional.',
            variant: 'destructive',
          });
        } finally {
          setIsLoadingHistory(false);
        }
      };
      fetchHistory();
    } else {
      setHistory([]);
    }
  }, [selectedPersona, toast]);
  
  const handleViewReport = (evaluation: OccupationalHealthEvaluation) => {
    setSelectedEvaluation(evaluation);
    setIsReportVisible(true);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2 bg-background p-4 rounded-lg shadow-sm border">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Historial de Salud Ocupacional</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Buscar Trabajador</CardTitle>
            <CardDescription>
              Busque por nombre o cédula para ver su historial.
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
                        {isLoadingHistory ? (
                            <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div>
                        ) : history.length > 0 ? (
                            <ul className="space-y-3">
                                {history.map(evalItem => (
                                    <li key={evalItem.id} className="flex justify-between items-center p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors">
                                        <div>
                                            <p className="font-semibold">{evalItem.consultationPurpose}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(evalItem.evaluationDate), 'PPP', { locale: es })}
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => handleViewReport(evalItem)}>Ver Informe</Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed bg-card/50 p-8 text-center">
                                <BookHeart className="h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">Sin Historial</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Este trabajador no tiene evaluaciones de salud ocupacional previas.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed bg-card/50 p-8 text-center">
                    <Telescope className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Seleccione un trabajador</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Use el buscador para encontrar a un trabajador y ver su historial.
                    </p>
                </div>
            )}
        </div>
      </div>
      
       <Dialog open={isReportVisible} onOpenChange={setIsReportVisible}>
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Informe de Salud Ocupacional</DialogTitle>
                    <DialogDescription>
                        Puede usar el botón de abajo para imprimir este documento.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-auto">
                    {selectedEvaluation && selectedPersona && (
                        <div ref={printRef}>
                            <OccupationalHealthReportDisplay 
                                data={selectedEvaluation}
                                persona={selectedPersona}
                            />
                        </div>
                    )}
                </div>
                <div className="flex justify-end pt-4">
                    <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Imprimir Documento</Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
