
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
        <div className="w-[10.5cm] h-[19cm] border border-blue-800 flex flex-col p-1 bg-white">
            {/* Header */}
            <div className="border border-blue-800 rounded-lg p-2 flex items-center gap-2">
                <svg
                    className="w-8 h-8 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#000080"
                >
                    <path d="M7 21C7.83391 21.0456 8.66014 20.8226 9.37 20.36L12 18.5L14.63 20.36C15.3399 20.8226 16.1661 21.0456 17 21H7Z" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 21V11C17 9 16 8 15 8H9C8 8 7 9 7 11V21" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 8V6C15 4 14.5 2 12 2C9.5 2 9 4 9 6V8" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="flex-grow text-center text-blue-800">
                    <h2 className="text-xl font-serif font-bold">Dra. Alcida Joselin Perez C.</h2>
                    <p className="text-xs font-sans font-semibold">{getSpecialtyTitle()}</p>
                    <p className="text-xs font-sans">RIF.: V200561698</p>
                </div>
            </div>

            {/* Body */}
            <div className="border border-blue-800 flex-grow mt-1 flex flex-col p-2">
                <div className="flex justify-between items-start text-blue-800">
                    <p className="text-sm font-semibold">Rp./Indicaciones:</p>
                    <div className="flex items-center gap-1">
                        <p className="text-sm">Fecha</p>
                        <div className="flex gap-0.5">
                            <div className="w-4 h-4 border border-blue-800"></div>
                            <div className="w-4 h-4 border border-blue-800"></div>
                            <div className="w-4 h-4 border border-blue-800"></div>
                        </div>
                    </div>
                </div>
                {/* Prescription content area */}
                <div className="flex-grow min-h-[12cm]">
                  {consultation.treatmentOrder?.items.map((item, index) => (
                    <p key={index} className="text-sm font-sans text-black py-1">
                        - {item.medicamentoProcedimiento} {item.dosis} {item.via} {item.frecuencia} {item.duracion}
                    </p>
                  ))}
                </div>
            </div>
            
            {/* Footer */}
            <div className="border border-blue-800 mt-1 p-2 text-xs text-blue-800 font-sans">
                <div className="flex justify-between border-b-2 border-blue-800 pb-1 mb-1">
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
            align-items: center;
            width: 100vw;
            height: 100vh;
            gap: 0.5cm;
          }
        }
      `}</style>
      
      <div className="flex justify-center items-center gap-4">
        <RecipeBlock consultation={consultation} />
        <RecipeBlock consultation={consultation} />
      </div>

    </div>
  );
}
