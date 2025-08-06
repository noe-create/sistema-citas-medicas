
'use client';

import * as React from 'react';
import type { Consultation } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DocumentHeader } from './document-header';

const PrescriptionBody = ({ consultation }: { consultation: Consultation }) => {
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

            return `- ${parts}${item.instrucciones ? `\n  - *Instrucciones: ${item.instrucciones}*` : ''}`;
        }).join('\n');
    };

    const prescriptionBody = formatPrescriptionBody();

    return (
        <div className="flex-grow mt-4 px-2">
            <span className="font-bold text-3xl">Rp./</span>
            <div className="prose prose-sm dark:prose-invert max-w-none mt-1 pl-2">
                <ReactMarkdown>{prescriptionBody}</ReactMarkdown>
            </div>
        </div>
    );
};

export function PrescriptionDisplay({ consultation }: { consultation: Consultation }) {

  return (
    <div className="printable-area bg-white text-black font-sans text-sm p-8">
      {/* Container for Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 1in;
          }
          .printable-area {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: white;
            color: black;
          }
        }
      `}</style>

      {/* Single Page Layout */}
      <div className="print-page w-full h-full flex flex-col bg-white">
        
        {/* Header */}
        <DocumentHeader />
        
        {/* Patient Info */}
        <div className="flex justify-between items-start text-xs border-y border-black py-2 my-4">
            <p><strong>Paciente:</strong> {consultation.paciente.name}</p>
            <p><strong>C.I:</strong> {consultation.paciente.cedula}</p>
            <p><strong>Fecha:</strong> {format(new Date(consultation.consultationDate), 'dd/MM/yyyy')}</p>
        </div>

        {/* Recipe Body */}
        <div className="flex-grow">
            <PrescriptionBody consultation={consultation} />
        </div>
        
        {/* Signature */}
        <div className="flex flex-col items-center justify-end mt-auto pt-16">
            <div className="w-48 border-b border-black"></div>
            <p className="font-semibold text-xs mt-1">Firma y Sello</p>
        </div>
      </div>
    </div>
  );
}
