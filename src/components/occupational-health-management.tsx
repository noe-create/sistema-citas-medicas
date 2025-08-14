
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Persona, Empresa } from '@/lib/types';
import { HceSearch } from '@/components/hce-search';
import { Telescope, ClipboardPlus, Printer } from 'lucide-react';
import { OccupationalHealthForm } from './occupational-health-form';
import { Button } from './ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { getPersonaById, createOccupationalHealthEvaluation, getEmpresas } from '@/actions/patient-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';

const OccupationalHealthReportDisplay = dynamic(() => import('./occupational-health-report-display').then(mod => mod.default), {
  loading: () => <p>Cargando informe...</p>,
});

export function OccupationalHealthManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const personaIdParam = searchParams.get('personaId');
  const { toast } = useToast();

  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);
  const [isFormVisible, setIsFormVisible] = React.useState(false);
  const [isLoadingParam, setIsLoadingParam] = React.useState(true);
  const [evaluationData, setEvaluationData] = React.useState<any | null>(null);
  const [isReportVisible, setIsReportVisible] = React.useState(false);
  const printRef = React.useRef<HTMLDivElement>(null);
  const [empresas, setEmpresas] = React.useState<Empresa[]>([]);

  React.useEffect(() => {
    getEmpresas().then(data => setEmpresas(data.empresas));
  }, []);

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
      setEvaluationData(null); // Clear previous evaluation data
    }
  };
  
  const handleConsultationFinished = async (data: any) => {
      try {
        const companyName = data.companyId ? empresas.find(e => e.id === data.companyId)?.name : undefined;
        const savedEvaluation = await createOccupationalHealthEvaluation(selectedPersona!.id, { ...data, companyName });
        setEvaluationData(savedEvaluation);
        setIsFormVisible(false);
        toast({
            title: 'Evaluación Guardada',
            description: `La evaluación de ${selectedPersona?.nombreCompleto} ha sido registrada.`,
            variant: 'success'
        });
      } catch (error) {
         toast({
            title: 'Error al Guardar',
            description: 'No se pudo registrar la evaluación. Por favor, intente de nuevo.',
            variant: 'destructive'
        });
        console.error("Error saving evaluation:", error);
      }
  }

  const handleReturnToSearch = () => {
    setIsFormVisible(false);
    setSelectedPersona(null);
    setEvaluationData(null);
    router.push('/dashboard/salud-ocupacional');
  }

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
      {!isFormVisible && !evaluationData ? (
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
      ) : isFormVisible && selectedPersona ? (
        <OccupationalHealthForm persona={selectedPersona} onFinished={handleConsultationFinished} onCancel={handleReturnToSearch} empresas={empresas} />
      ) : evaluationData && selectedPersona ? (
        <Card className="mx-auto max-w-2xl">
           <CardHeader>
            <CardTitle>Evaluación Completada</CardTitle>
            <CardDescription>
              La evaluación para {selectedPersona.nombreCompleto} ha sido registrada.
            </CardDescription>
          </CardHeader>
           <CardContent className="flex flex-col items-center gap-4">
            <p>Puede ver el informe generado o iniciar una nueva búsqueda.</p>
            <div className="flex gap-4">
                <Button onClick={() => setIsReportVisible(true)}>Ver Informe</Button>
                <Button variant="outline" onClick={handleReturnToSearch}>Nueva Búsqueda</Button>
            </div>
           </CardContent>
        </Card>
      ) : null}

        <Dialog open={isReportVisible} onOpenChange={setIsReportVisible}>
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Informe de Salud Ocupacional</DialogTitle>
                    <DialogDescription>
                        Puede usar el botón de abajo para imprimir este documento.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-auto">
                    {evaluationData && selectedPersona && (
                        <div ref={printRef}>
                            <OccupationalHealthReportDisplay 
                                data={evaluationData}
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
