
'use client';

import * as React from 'react';
import type { Consultation } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { SaludIntegralLogo } from './logo-salud-integral';

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
}

const Section = React.forwardRef<HTMLDivElement, SectionProps>(({ title, className, children, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 border border-dashed border-gray-300", className)} {...props}>
    {title && <h3 className="font-bold text-lg text-center border-b pb-2 mb-2">{title}</h3>}
    {children}
  </div>
));
Section.displayName = "Section";


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
        <div className="flex-grow mt-2 px-2">
            <span className="font-bold text-3xl">Rp./</span>
            <div className="prose prose-sm dark:prose-invert max-w-none mt-1 pl-2">
                <ReactMarkdown>{prescriptionBody}</ReactMarkdown>
            </div>
        </div>
    );
};

export function PrescriptionDisplay({ consultation }: { consultation: Consultation }) {

  return (
    <div className="printable-area text-black bg-white font-sans text-sm">
      {/* Container for Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 0;
          }
          .printable-area {
            width: 8.5in;
            height: 11in;
            margin: 0;
            padding: 0;
            background: white;
            color: black;
          }
          .print-page {
            width: 100%;
            height: 100%;
            page-break-after: always;
            box-sizing: border-box;
          }
           .print-page:last-child {
            page-break-after: avoid;
          }
        }
      `}</style>
      
      {/* Page 1: Front/Back Cover */}
      <div className="print-page w-[8.5in] h-[11in] flex flex-col bg-white">
        {/* Top Half: Back Cover (UPSIDE DOWN) */}
        <div className="h-1/2 flex-shrink-0" style={{ transform: 'rotate(180deg)' }}>
          <Section title="Contacto y Ubicación" className="h-full flex flex-col justify-center items-center">
            <div className="text-center text-xs mt-4 space-y-1">
              <p className="font-semibold">SALUD INTEGRAL C.A.</p>
              <p>RIF: J-075055861</p>
              <p>Urb. La Viña, Final Av. Carabobo, Valencia, Edo. Carabobo</p>
              <p>Teléfonos: (0241) 826-8688 / 826-8431 / 820-2710</p>
              <p className="font-semibold mt-2">Horarios:</p>
              <p>Lunes a Viernes: 7:00 AM - 7:00 PM</p>
            </div>
          </Section>
        </div>
        
        {/* Bottom Half: Front Cover */}
        <div className="h-1/2 flex-shrink-0">
          <Section className="h-full flex flex-col justify-center items-center text-center">
            <SaludIntegralLogo className="h-24 w-24" />
            <h2 className="text-3xl font-bold mt-4">Indicaciones Médicas</h2>
          </Section>
        </div>
      </div>

      {/* Page 2: Inside */}
      <div className="print-page w-[8.5in] h-[11in] flex flex-col bg-white">
        {/* Top Half: General Indications */}
        <div className="h-1/2 flex-shrink-0">
            <Section title="Indicaciones Generales" className="h-full flex flex-col">
                <div className="flex-grow space-y-4 text-xs">
                    <p><strong>Próxima Cita:</strong> _________________________</p>
                    <p><strong>Advertencias:</strong></p>
                    <ul className="list-disc list-inside pl-2">
                        <li>Notificar cualquier reacción adversa.</li>
                        <li>No suspender el tratamiento sin consultar.</li>
                        <li>Mantener fuera del alcance de los niños.</li>
                    </ul>
                </div>
            </Section>
        </div>

        {/* Bottom Half: Main Recipe */}
        <div className="h-1/2 flex-shrink-0">
          <Section className="h-full flex flex-col">
             {/* Patient Info */}
            <div className="flex justify-between items-start text-xs border-b pb-1">
                <p><strong>Paciente:</strong> {consultation.paciente.name}</p>
                <p><strong>C.I:</strong> {consultation.paciente.cedula}</p>
                <p><strong>Fecha:</strong> {format(new Date(consultation.consultationDate), 'dd/MM/yyyy')}</p>
            </div>

            {/* Recipe Body */}
            <PrescriptionBody consultation={consultation} />
            
            {/* Signature */}
            <div className="flex flex-col items-center justify-end mt-auto pt-4">
                <div className="w-48 border-b border-black"></div>
                <p className="font-semibold text-xs mt-1">Firma y Sello</p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
