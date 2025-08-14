
'use client';

import * as React from 'react';
import type { Persona } from '@/lib/types';
import { calculateAge } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DocumentHeader } from './document-header';

interface OccupationalHealthReportDisplayProps {
  data: any;
  persona: Persona;
}

export default function OccupationalHealthReportDisplay({ data, persona }: OccupationalHealthReportDisplayProps) {

  const [ageString, setAgeString] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Client-side effect to calculate age
    const age = calculateAge(new Date(persona.fechaNacimiento));
    setAgeString(`${age} Año(s)`);
  }, [persona.fechaNacimiento]);

  const getNutritionalStatus = (imc: number) => {
    if (imc < 18.5) return 'Bajo Peso';
    if (imc >= 18.5 && imc < 25) return 'Peso Normal';
    if (imc >= 25 && imc < 30) return 'Sobrepeso';
    if (imc >= 30) return 'Obesidad';
    return 'N/A';
  }

  const nutritionalStatus = getNutritionalStatus(parseFloat(data.anthropometry.imc));
  const diagnosesText = data.diagnoses.map((d: any) => d.cie10Description).join(' y ');

  const narrative = `Se evalúa al paciente en el contexto de su puesto de trabajo en la empresa, por motivo de una evaluación médica ${data.consultationPurpose.toLowerCase()}. Durante la entrevista, el paciente describe que sus tareas consisten en ${data.jobDescription.toLowerCase()} y refiere estar expuesto a riesgos de tipo ${data.riskDetails.toLowerCase()}. Como antecedentes de importancia, el paciente reporta ${data.personalHistory.toLowerCase()}. En cuanto a su estilo de vida, comenta que su alimentación es ${data.lifestyle.diet.toLowerCase()}, realiza actividad física ${data.lifestyle.physicalActivity.toLowerCase()} y duerme unas ${data.lifestyle.sleepQuality.toLowerCase()}.
Al examen físico, se registran signos vitales dentro de los parámetros normales y un índice de masa corporal de ${data.anthropometry.imc}, indicando ${nutritionalStatus.toLowerCase()}. ${data.physicalExamFindings}.
Con base en los hallazgos, se establecen los siguientes diagnósticos: ${diagnosesText}.
Considerando estos diagnósticos y las exigencias del puesto, se determina un concepto de "${data.fitnessForWork}". El plan de salud integral a seguir incluye, por un lado, recomendaciones ocupacionales como ${data.occupationalRecommendations.toLowerCase()}. Por otro lado, para su salud general, ${data.generalHealthPlan.toLowerCase()}. ${data.interconsultation ? `Finalmente, se deriva al paciente a una interconsulta con el servicio de ${data.interconsultation}` : ''} ${data.nextFollowUp ? `y se programa una cita de seguimiento en ${format(new Date(data.nextFollowUp), 'PPP', { locale: es })} para reevaluar su condición.` : ''}`.trim();


  return (
    <div className="printable-area bg-white p-4">
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
      <div className="printable-content flex flex-col h-full text-sm">
        <div className="flex items-center px-8">
            <img src="/logo.png" alt="Logo Salud Integral Izquierda" style={{ height: '80px' }} />
            <div className="flex-grow">
              <DocumentHeader />
            </div>
            <img src="/logo_si.png" alt="Logo Salud Integral Derecha" style={{ height: '80px' }} />
        </div>

        <div className="text-center my-2">
            <h2 className="font-semibold text-base uppercase">Informe de Salud Ocupacional</h2>
        </div>

        <section className="border-y border-black py-2">
            <div className="grid grid-cols-2 gap-x-4 text-sm">
                <p><strong>Fecha:</strong> {format(new Date(), 'dd/MM/yyyy')}</p>
                <p><strong>Cédula:</strong> {persona.cedula}</p>
                <p className="col-span-2"><strong>Nombre:</strong> {persona.nombreCompleto}</p>
                 <p><strong>Edad:</strong> {ageString || 'Calculando...'}</p>
                 <p><strong>Sexo:</strong> {persona.genero}</p>
                <p className="col-span-2"><strong>Empresa:</strong> {data.companyName || 'N/A'}</p>
                 <p><strong>Puesto:</strong> {data.jobPosition}</p>
                <p><strong>Motivo:</strong> {data.consultationPurpose}</p>
            </div>
        </section>
        
        <div className="flex-grow mt-4 text-justify leading-relaxed">
           <p>{narrative}</p>
        </div>

        <footer className="flex flex-col items-center text-sm pt-4 mt-auto">
            <div className="w-48 border-b border-black"></div>
            <p className="font-semibold mt-1">Atentamente;</p>
            <p>Dr. [Nombre del Doctor]</p>
            <p>Salud Ocupacional</p>
        </footer>
      </div>
    </div>
  );
}
