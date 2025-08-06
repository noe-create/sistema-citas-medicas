

'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import type { Consultation } from '@/lib/types';
import { calculateAge } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DocumentHeader } from './document-header';

interface MedicalReportDisplayProps {
  consultation: Consultation;
}

export function MedicalReportDisplay({ consultation }: MedicalReportDisplayProps) {
  const { paciente } = consultation;
  const [ageString, setAgeString] = React.useState<string | null>(null);

  React.useEffect(() => {
    const age = calculateAge(paciente.fechaNacimiento);
    setAgeString(`${age} Año(s)`);
  }, [paciente.fechaNacimiento]);

  const getConsultationType = () => {
    if (paciente.serviceType === 'consulta pediatrica') {
      return 'CONSULTA PEDIATRICA';
    }
    return 'CONSULTA DE MEDICINA GENERAL';
  }

  const getVitalSignValue = (value: any, unit: string = '') => {
    return value !== undefined && value !== null && value !== '' ? `${value}${unit}` : 'N/A';
  }

  const sv = consultation.signosVitales;

  return (
    <Card className="h-full border-primary/50 text-sm printable-area">
      <div className="p-4 printable-content">
        <div className="flex items-center px-4">
            <img src="/logo.png" alt="Logo Salud Integral Izquierda" style={{ height: '60px' }} />
            <div className="flex-grow">
              <DocumentHeader />
            </div>
            <img src="/logo_si.png" alt="Logo Salud Integral Derecha" style={{ height: '60px' }} />
        </div>

        <div className="text-center my-2">
            <h2 className="font-semibold text-base">Informe Medico</h2>
        </div>

        <section className="border-y border-black py-2">
            <h3 className="font-bold text-center mb-2">Datos del Paciente:</h3>
            <div className="grid grid-cols-2 gap-x-4">
                <p><strong>Historia:</strong> {paciente.id.slice(-6)}</p>
                <p><strong>Fecha Consulta:</strong> {format(consultation.consultationDate, 'dd/MM/yyyy')}</p>
                <p><strong>Ingreso:</strong> {consultation.waitlistId?.slice(-6) || 'N/A'}</p>
                <p><strong>Sexo:</strong> {paciente.genero}</p>
                <p><strong>Cédula:</strong> {paciente.cedula}</p>
                <p><strong>Edad:</strong> {ageString || 'Calculando...'}</p>
                <p className="col-span-2"><strong>Nombre:</strong> {paciente.name}</p>
            </div>
        </section>
        
        <h3 className="font-bold text-center my-2">{getConsultationType()}</h3>

        <section>
            <h4 className="font-bold underline">EXAMEN FISICO</h4>
            <div className="grid grid-cols-3 gap-x-4 my-1">
                <p><strong>PA EN MMHG:</strong> {getVitalSignValue(sv?.taSistolica)}/{getVitalSignValue(sv?.taDiastolica)}</p>
                <p><strong>RESP X MIM:</strong> {getVitalSignValue(sv?.fr)}</p>
                <p><strong>LAT X MIM:</strong> {getVitalSignValue(sv?.fc)}</p>
            </div>
            <p className="whitespace-pre-wrap">{consultation.examenFisicoGeneral}</p>
        </section>

        <section className="mt-2">
            <h4 className="font-bold underline">IMPRESIÓN DIAGNÓSTISCA</h4>
            {consultation.diagnoses.map(d => (
                <p key={d.cie10Code}>- {d.cie10Description}</p>
            ))}
        </section>

        <section className="mt-2">
            <h4 className="font-bold underline">TRATAMIENTO</h4>
            <div className="prose prose-sm prose-ul:my-0 prose-li:my-0">
                <p className="font-semibold">TRATAMIENTO INDICADO</p>
                <p>{consultation.treatmentPlan}</p>
                {consultation.treatmentOrder && (
                    <ul>
                        {consultation.treatmentOrder.items.map(item => (
                            <li key={item.id}>{item.medicamentoProcedimiento}</li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
        
        <section className="mt-2">
            <h4 className="font-bold underline">REPOSO</h4>
            <p>REPOSO POR 24 HORAS.</p>
        </section>

        <footer className="mt-16 flex flex-col items-center">
            <div className="w-48 border-b border-black"></div>
            <p className="font-semibold">Atentamente;</p>
            <p>Dr. [Nombre del Doctor]</p>
            <p>Medicina Familiar</p>
        </footer>
      </div>
    </Card>
  );
}
