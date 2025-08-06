'use client';

import * as React from 'react';
import type { Consultation } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const RecipeBlock = ({ consultation }: { consultation: Consultation }) => {
    const getSpecialtyTitle = () => {
        const serviceType = (consultation.paciente as any).serviceType;
        switch (serviceType) {
            case 'medicina general':
                return 'MEDICINA FAMILIAR';
            case 'consulta pediatrica':
                return 'MÉDICO PEDIATRA';
            case 'servicio de enfermeria':
                return 'SERVICIO DE ENFERMERÍA';
            default:
                return 'MÉDICO TRATANTE';
        }
    };

    return (
        <div className="w-[10.5cm] h-auto border border-black flex flex-col p-1 bg-white">
            {/* Header */}
             <div className="border border-black rounded-lg p-2 flex items-center justify-between gap-2">
                 <img src="/logo.png" alt="Logo Salud Integral Izquierda" className="h-14 w-auto" />
                <div className="flex-grow text-center text-black">
                    <h2 className="text-xl font-serif font-bold">Dra. Alcida Joselin Perez C.</h2>
                    <p className="text-xs font-sans font-semibold">{getSpecialtyTitle()}</p>
                    <p className="text-xs font-sans">Rif: J075055861</p>
                </div>
                 <img src="/logo_si.png" alt="Logo Salud Integral Derecha" className="h-14 w-auto" />
            </div>

            {/* Body */}
            <div className="border border-black flex-grow mt-1 flex flex-col p-2 min-h-[14cm]">
                <div className="flex justify-between items-start text-black">
                    <p className="text-sm font-semibold">Rp./Indicaciones:</p>
                    <div className="flex items-center gap-1 text-sm">
                        <span>Fecha:</span>
                        <div className="flex gap-0.5">
                            <div className="w-5 h-5 border border-black"></div>
                            <div className="w-5 h-5 border border-black"></div>
                            <div className="w-10 h-5 border border-black"></div>
                        </div>
                    </div>
                </div>
                {/* Prescription content area */}
                <div className="flex-grow mt-2">
                  {consultation.treatmentOrder?.items.map((item, index) => (
                    <p key={index} className="text-sm font-sans text-black py-1">
                        - {item.medicamentoProcedimiento} {item.dosis} {item.via} {item.frecuencia} {item.duracion}
                    </p>
                  ))}
                </div>
            </div>
            
            {/* Footer */}
            <div className="border border-black mt-1 p-2 text-xs text-black font-sans">
                <div className="flex justify-between border-b-2 border-black pb-1 mb-1">
                    <p><strong>PACIENTE:</strong> {consultation.paciente.nombreCompleto}</p>
                    <p><strong>C.I. Nº:</strong> {consultation.paciente.cedula}</p>
                </div>
                <p className="text-center">Avenida Carabobo, frente al Diagnóstico Urológico La Viña, en la urbanización La Viña, Valencia, Carabobo.Teléfonos: 0241 8268688 / 8268431 / 8202710</p>
            </div>
        </div>
    );
};


export function PrescriptionDisplay({ consultation }: { consultation: Consultation }) {
  // This component is designed to be printed on a horizontal Letter-sized sheet.
  // It creates two identical recipe blocks side-by-side.

  return (
    <div className="printable-area bg-white text-black font-sans p-4">
      {/* Print-specific styles to ensure layout is respected */}
      <style jsx global>{`
        @media print {
          @page {
            size: letter landscape;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .printable-area {
            margin: auto;
            display: flex;
            justify-content: center;
            align-items: flex-start; /* Align to top */
            width: 100vw;
            height: 100vh;
          }
        }
      `}</style>
      
      <div className="flex justify-center items-start gap-8">
        <RecipeBlock consultation={consultation} />
        <RecipeBlock consultation={consultation} />
      </div>

    </div>
  );
}
