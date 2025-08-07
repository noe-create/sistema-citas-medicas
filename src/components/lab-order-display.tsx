

'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import type { LabOrder } from '@/lib/types';
import { calculateAge } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DocumentHeader } from './document-header';

interface LabOrderDisplayProps {
  order: LabOrder;
}

export function LabOrderDisplay({ order }: LabOrderDisplayProps) {
  const [age, setAge] = React.useState<number | null>(null);

  React.useEffect(() => {
    // Calculate age on the client-side to avoid hydration mismatch
    setAge(calculateAge(order.paciente.fechaNacimiento));
  }, [order.paciente.fechaNacimiento]);
  
  const ageString = age !== null ? `${age} Año(s)`: 'Calculando...';

  return (
    <Card className="h-full border-primary/50 text-sm printable-area">
      <style jsx global>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 1cm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
       <div className="p-4 printable-content">
            <div className="flex items-center px-8">
              <img src="/logo.png" alt="Logo Salud Integral Izquierda" style={{ height: '80px' }} />
              <div className="flex-grow">
                <DocumentHeader />
              </div>
              <img src="/logo_si.png" alt="Logo Salud Integral Derecha" style={{ height: '80px' }} />
            </div>

            <div className="text-center my-2">
                <h2 className="font-semibold text-base">Orden de Laboratorio</h2>
            </div>

            <section className="border-y border-black py-2">
                <h3 className="font-bold text-center mb-2">Datos del Paciente:</h3>
                <div className="grid grid-cols-2 gap-x-4">
                    <p><strong>Historia:</strong> {order.pacienteId.slice(-6)}</p>
                    <p><strong>Fecha Orden:</strong> {format(order.orderDate, 'dd/MM/yyyy')}</p>
                    <p><strong>Ingreso:</strong> {order.consultationId?.slice(-6) || 'N/A'}</p>
                    <p><strong>Sexo:</strong> {order.paciente.genero}</p>
                    <p><strong>Cédula:</strong> {order.paciente.cedula}</p>
                    <p><strong>Edad:</strong> {ageString}</p>
                    <p className="col-span-2"><strong>Nombre:</strong> {order.paciente.nombreCompleto}</p>
                </div>
            </section>
        
            <div className="space-y-4 text-left mt-4">
                {(order.diagnosticoPrincipal || order.treatmentPlan) && (
                  <section>
                      <h4 className="font-bold underline">IMPRESIÓN DIAGNÓSTICA Y PLAN</h4>
                      {order.diagnosticoPrincipal && <p><strong>Diagnóstico:</strong> {order.diagnosticoPrincipal}</p>}
                      {order.treatmentPlan && <p><strong>Plan:</strong> {order.treatmentPlan}</p>}
                  </section>
                )}

                <div className="border-t border-black my-4"></div>

                <div>
                    <h4 className="font-bold underline">EXÁMENES SOLICITADOS</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground columns-2 mt-2">
                      {order.tests.map((test, index) => (
                        <li key={index}>{test}</li>
                      ))}
                    </ul>
                </div>
                 <div className="flex flex-col items-center pt-12">
                     <div className="w-48 h-16 border-b border-foreground/50"></div>
                     <p className="font-semibold">Atentamente;</p>
                     <p>Dr. [Nombre del Doctor]</p>
                </div>
            </div>
        </div>
    </Card>
  );
}
