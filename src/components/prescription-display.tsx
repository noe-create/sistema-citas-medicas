'use client';

import * as React from 'react';
import type { Consultation } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const RecipeBlock = ({ consultation, position }: { consultation: Consultation, position: 'top' | 'bottom' }) => {
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
        <div 
          className="w-[21cm] h-[13.97cm] border border-black flex flex-col p-1 bg-white"
          style={{
            // Bleed for central cut
            ...(position === 'top' && { marginBottom: '3mm' }),
            ...(position === 'bottom' && { marginTop: '3mm' }),
          }}
        >
            {/* Header */}
             <div 
                className="border border-black rounded-t-lg p-2 flex items-center justify-between gap-2"
                style={{
                  // Bleed for central cut (bottom recipe's header stretches up)
                  ...(position === 'bottom' && { paddingTop: 'calc(0.5rem + 3mm)' }),
                }}
             >
                 <img src="/logo.png" alt="Logo Salud Integral Izquierda" className="h-14 w-auto" />
                <div className="flex-grow text-center text-black">
                    <h2 className="text-xl font-serif font-bold">Dra. Alcida Joselin Perez C.</h2>
                    <p className="text-xs font-sans font-semibold">{getSpecialtyTitle()}</p>
                    <p className="text-xs font-sans">Rif: J075055861</p>
                </div>
                 <img src="/logo_si.png" alt="Logo Salud Integral Derecha" className="h-14 w-auto" />
            </div>

            {/* Body */}
            <div className="border-x border-black flex-grow flex flex-col p-2">
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
            <div 
              className="border border-black rounded-b-lg p-2 text-xs text-black font-sans bg-gray-200"
              style={{ 
                // Bleed for internal fold (footer stretches up)
                paddingTop: 'calc(0.5rem + 3mm)',
                // Bleed for central cut (top recipe's footer stretches down)
                ...(position === 'top' && { paddingBottom: 'calc(0.5rem + 3mm)' }),
              }}
            >
                <div className="flex justify-between">
                    <p><strong>PACIENTE:</strong> {consultation.paciente.nombreCompleto}</p>
                    <p><strong>C.I. Nº:</strong> {consultation.paciente.cedula}</p>
                </div>
                 <p className="text-center mt-1">Avenida Carabobo, frente al Diagnóstico Urológico La Viña, en la urbanización La Viña, Valencia, Carabobo.</p>
                 <p className="text-center">Teléfonos: 0241 8268688 / 8268431 / 8202710</p>
            </div>
        </div>
    );
};


export function PrescriptionDisplay({ consultation }: { consultation: Consultation }) {
  // This component is designed to be printed on a vertical Letter-sized sheet.
  // It creates two identical recipe blocks, one above the other.
  return (
    <div className="printable-area bg-white text-black font-sans w-[21.59cm] h-[27.94cm] p-[1cm] flex flex-col justify-center items-center">
      {/* Print-specific styles to ensure layout is respected */}
      <style jsx global>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .printable-area {
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
      `}</style>
      
      <div className="flex flex-col">
          <div style={{ marginBottom: '-3mm' }}>
            <RecipeBlock consultation={consultation} position="top" />
          </div>
          <div style={{ marginTop: '-3mm' }}>
            <RecipeBlock consultation={consultation} position="bottom" />
          </div>
      </div>

    </div>
  );
}
