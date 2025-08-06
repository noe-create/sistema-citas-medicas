
'use client';

import * as React from 'react';
import type { Consultation } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PrescriptionDisplayProps {
  consultation: Consultation;
}

const RecipeColumn = ({ consultation }: { consultation: Consultation }) => {
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
    <div className="flex flex-col h-full p-4">
      {/* Encabezado */}
      <div className="flex items-center px-8">
          <img src="/logo_salud_integral.svg" alt="Logo Salud Integral Izquierda" style={{ height: '80px' }} />
          <div className="flex-grow text-center text-xs">
              <h1 className="text-xl font-bold tracking-wider">SALUD INTEGRAL</h1>
              <p>CENTRO POLITÉCNICO VALENCIA, C.A.</p>
              <p>Rif: J075055861 Nit: 0028937032</p>
              <p>URB. LA VIÑA, FINAL AV. CARABOBO</p>
              <p>Teléfonos: 0241 8268688 / 8268431 / 8202710</p>
          </div>
          <img src="/logo_cpv.svg" alt="Logo CPV Derecha" style={{ height: '80px' }} />
      </div>

      {/* Datos del Paciente */}
      <section className="border-y border-black py-1 mt-4 text-xs">
        <div className="flex justify-between items-start">
            <div className="text-left">
                <p><strong>Paciente:</strong> {consultation.paciente.name}</p>
                <p><strong>C.I:</strong> {consultation.paciente.cedula}</p>
            </div>
            <div className="text-right">
                <p><strong>Fecha:</strong> {format(new Date(consultation.consultationDate), 'dd/MM/yyyy', { locale: es })}</p>
            </div>
        </div>
      </section>

      {/* Cuerpo del Récipe */}
      <div className="flex-grow mt-4">
        <span className="font-bold text-2xl">Rp./</span>
        <div className="prose prose-sm dark:prose-invert max-w-none mt-2">
          <ReactMarkdown>{prescriptionBody}</ReactMarkdown>
        </div>
      </div>

      {/* Firma */}
      <div className="flex flex-col items-center justify-end pt-8 mt-auto">
          <div className="w-48 border-b border-black"></div>
          <p className="font-semibold text-xs mt-1">Firma y Sello</p>
      </div>
    </div>
  );
};


export function PrescriptionDisplay({ consultation }: PrescriptionDisplayProps) {
  return (
    <div className="printable-area text-black bg-white">
        <div className="h-full">
            <RecipeColumn consultation={consultation} />
        </div>
    </div>
  );
}
