
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
    <div className="flex flex-col h-full p-4 border border-black/20">
      {/* Encabezado */}
      <div className="flex items-center px-4">
          <img src="/logo_salud_integral.svg" alt="Logo Salud Integral Izquierda" style={{ height: '60px' }} />
          <div className="flex-grow text-center text-xs">
              <h1 className="text-lg font-bold tracking-wider">SALUD INTEGRAL</h1>
              <p className="text-[10px]">CENTRO POLITÉCNICO VALENCIA, C.A.</p>
              <p className="text-[10px]">Rif: J075055861 Nit: 0028937032</p>
              <p className="text-[10px]">URB. LA VIÑA, FINAL AV. CARABOBO</p>
              <p className="text-[10px]">Teléfonos: 0241 8268688 / 8268431 / 8202710</p>
          </div>
          <img src="/logo_cpv.svg" alt="Logo CPV Derecha" style={{ height: '60px' }} />
      </div>

      {/* Datos del Paciente */}
      <section className="border-y border-black py-1 mt-2 text-xs">
        <div className="flex justify-between items-start px-2">
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
      <div className="flex-grow mt-2 px-2">
        <span className="font-bold text-3xl">Rp./</span>
        <div className="prose prose-sm dark:prose-invert max-w-none mt-1 pl-2">
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
    <div className="printable-area text-black bg-white font-sans text-sm">
        {/* Page Container for Horizontal Layout */}
        <div className="w-[11in] h-[8.5in] p-4 flex flex-col bg-white">
            
            {/* Inner Content - this will be the printable area */}
            <div className="flex flex-row flex-grow w-full h-full">

                {/* Left Side of the page (Contraportada y Area de Indicaciones) */}
                <div className="w-1/2 h-full flex flex-col">
                    {/* Contraportada (Top half) */}
                    <div className="h-1/2 p-2 flex flex-col justify-center items-center border-dashed border-gray-300 border">
                        <h3 className="font-bold text-lg">Contacto y Ubicación</h3>
                        <div className="text-center text-xs mt-4 space-y-1">
                            <p className="font-semibold">SALUD INTEGRAL C.A.</p>
                            <p>RIF: J-075055861</p>
                            <p>Urb. La Viña, Final Av. Carabobo, Valencia, Edo. Carabobo</p>
                            <p>Teléfonos: (0241) 826-8688 / 826-8431 / 820-2710</p>
                            <p className="font-semibold mt-2">Horarios:</p>
                            <p>Lunes a Viernes: 7:00 AM - 7:00 PM</p>
                        </div>
                    </div>
                    {/* Area de Indicaciones (Bottom half) */}
                    <div className="h-1/2 p-2 flex flex-col border-dashed border-gray-300 border">
                         <h3 className="font-bold text-lg text-center border-b pb-2 mb-2">Indicaciones Generales</h3>
                         <div className="flex-grow space-y-4 text-xs">
                             <p><strong>Próxima Cita:</strong> _________________________</p>
                             <p><strong>Advertencias:</strong></p>
                             <ul className="list-disc list-inside pl-2">
                                <li>Notificar cualquier reacción adversa.</li>
                                <li>No suspender el tratamiento sin consultar.</li>
                                <li>Mantener fuera del alcance de los niños.</li>
                             </ul>
                         </div>
                    </div>
                </div>

                {/* Right Side of the page (Portada y Recipe Principal) */}
                <div className="w-1/2 h-full flex flex-col">
                     {/* Portada (Top half) */}
                    <div className="h-1/2 p-2 flex flex-col justify-center items-center text-center border-dashed border-gray-300 border">
                        <img src="/logo_salud_integral.svg" alt="Logo Salud Integral" style={{ height: '80px' }} />
                        <h2 className="text-3xl font-bold mt-4">Indicaciones Médicas</h2>
                    </div>
                    {/* Recipe Principal (Bottom half) */}
                    <div className="h-1/2 p-2 flex flex-col border-dashed border-gray-300 border">
                       <div className="flex justify-between items-start text-xs border-b pb-1">
                           <p><strong>Paciente:</strong> {consultation.paciente.name}</p>
                           <p><strong>C.I:</strong> {consultation.paciente.cedula}</p>
                           <p><strong>Fecha:</strong> {format(new Date(consultation.consultationDate), 'dd/MM/yyyy')}</p>
                       </div>
                       <div className="flex-grow mt-2">
                           <span className="font-bold text-3xl">Rp./</span>
                            <div className="prose prose-sm dark:prose-invert max-w-none mt-1 pl-2">
                                <ReactMarkdown>{prescriptionBody}</ReactMarkdown>
                            </div>
                       </div>
                       <div className="flex flex-col items-center justify-end mt-auto">
                            <div className="w-48 border-b border-black"></div>
                            <p className="font-semibold text-xs mt-1">Firma y Sello</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
}
