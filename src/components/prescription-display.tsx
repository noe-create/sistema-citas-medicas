

'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Consultation } from '@/lib/types';
import { Button } from './ui/button';
import { Printer } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PrescriptionDisplayProps {
  consultation: Consultation;
}

export function PrescriptionDisplay({ consultation }: PrescriptionDisplayProps) {

  const formatPrescriptionBody = () => {
    if (!consultation.treatmentOrder || !consultation.treatmentOrder.items) return '';
    return consultation.treatmentOrder.items.map(item => {
        const parts = [
            `**${item.medicamentoProcedimiento}**`,
            item.dosis,
            item.via,
            item.frecuencia,
            item.duracion
        ].filter(Boolean).join(', ');
        
        return `- ${parts}${item.instrucciones ? `\\n  - *Instrucciones: ${item.instrucciones}*` : ''}`;
    }).join('\\n');
  };
  
  const prescriptionBody = formatPrescriptionBody();

  return (
    <Card className="h-full border-primary/50 text-sm printable-area">
       <div className="p-4 printable-content">
            <header className="flex justify-between items-start pb-2 border-b-2 border-black">
                <div className="w-1/3">
                    <img src="/logo_si.png" alt="Salud Integral Logo" className="h-auto w-32" />
                </div>
                <div className="w-2/3 flex justify-end text-right text-[8px] leading-tight">
                    <div>
                        <p className="font-bold">CENTRO POLICLINICO VALENCIA C.A</p>
                        <p>Rif.: J075055861 Nit.: 0028937032</p>
                        <p>URB. LA VIÑA, FINAL AV. CARABOBO</p>
                        <p>Teléfonos.: 0241 8268688 8268431 8202710</p>
                    </div>
                </div>
            </header>

            <div className="text-center my-2">
                <h2 className="font-semibold text-base">Récipe Médico</h2>
            </div>

            <section className="border-y border-black py-2">
                 <div className="flex justify-between items-start">
                    <div className="text-left text-xs">
                        <p><strong>Paciente:</strong> {consultation.paciente.name}</p>
                        <p><strong>C.I:</strong> {consultation.paciente.cedula}</p>
                    </div>
                     <div className="text-right text-xs">
                        <p><strong>Fecha:</strong> {format(new Date(consultation.consultationDate), 'dd/MM/yyyy', { locale: es })}</p>
                    </div>
                </div>
            </section>
        
            <div className="space-y-4 text-left mt-4 min-h-[500px]">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{prescriptionBody}</ReactMarkdown>
                </div>
            </div>
            <div className="flex flex-col items-center pt-12">
                 <div className="w-48 h-16 border-b border-foreground/50"></div>
                 <p className="font-semibold">Dr. [Nombre del Doctor]</p>
            </div>
        </div>
    </Card>
  );
}
