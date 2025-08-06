
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Printer } from 'lucide-react';
import type { Consultation } from '@/lib/types';
import { PrescriptionDisplay } from './prescription-display';

interface PostConsultationRecipeViewerProps {
  consultation: Consultation;
  onClose: () => void;
}

export function PostConsultationRecipeViewer({ consultation, onClose }: PostConsultationRecipeViewerProps) {
  const printRef = React.useRef<HTMLDivElement>(null);

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
    iframeDoc.body.innerHTML = '';
    iframeDoc.body.appendChild(clonedNode);

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Visor de Récipe Post-Consulta</DialogTitle>
          <DialogDescription>
            Récipe para {consultation.paciente.nombreCompleto} generado el {new Date(consultation.consultationDate).toLocaleDateString()}.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-auto">
          <div ref={printRef}>
            <PrescriptionDisplay consultation={consultation} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>Cerrar Visor</Button>
          <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Imprimir Récipe</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
