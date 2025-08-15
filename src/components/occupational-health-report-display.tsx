
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
  
  const riskText = Array.isArray(data.occupationalRisks) ? data.occupationalRisks.join(', ') : data.occupationalRisks;
  const nutritionalStatus = getNutritionalStatus(parseFloat(data.anthropometry.imc));
  const diagnosesText = Array.isArray(data.diagnoses) ? data.diagnoses.map((d: any) => d.cie10Description).join('; ') : data.diagnoses;

  const narrative = `Se realiza evaluación médica ${data.consultationPurpose.toLowerCase()} al paciente ${persona.nombreCompleto}, de ${ageString || 'N/A'}, quien se desempeña como ${data.patientType.toLowerCase()}.
El paciente aspira al puesto de ${data.jobPosition}, donde sus tareas consistirán en ${data.jobDescription.toLowerCase()}. Estará expuesto a riesgos de tipo ${riskText}, con una exposición cualitativa descrita como: ${data.riskDetails.toLowerCase()}.
En sus antecedentes personales, el paciente refiere: ${data.personalHistory.toLowerCase()}. En cuanto a los antecedentes familiares, se reporta: ${data.familyHistory.toLowerCase()}. Su estilo de vida se caracteriza por una alimentación ${data.lifestyle.diet.toLowerCase()}, una actividad física consistente en ${data.lifestyle.physicalActivity.toLowerCase()}, y una calidad de sueño descrita como ${data.lifestyle.sleepQuality.toLowerCase()}. El consumo de tabaco se reporta como "${data.lifestyle.smoking}" y el de alcohol como "${data.lifestyle.alcohol}". En el área de salud mental, el paciente refiere: ${data.mentalHealth.toLowerCase() || 'sin particularidades'}.
Al examen físico, se registran los siguientes signos vitales: tensión arterial de ${data.vitalSigns.ta}, frecuencia cardíaca de ${data.vitalSigns.fc}, frecuencia respiratoria de ${data.vitalSigns.fr} y temperatura de ${data.vitalSigns.temp}. Los datos antropométricos son: peso de ${data.anthropometry.weight} kg, talla de ${data.anthropometry.height} cm, con un índice de masa corporal de ${data.anthropometry.imc}, lo que indica un estado nutricional de ${nutritionalStatus.toLowerCase()}. El examen físico dirigido, con enfoque en sistema osteomuscular, agudeza visual y auditiva, revela: ${data.physicalExamFindings.toLowerCase()}.
Con base en los hallazgos, se establece el siguiente diagnóstico: ${diagnosesText}. Se determina un concepto de aptitud laboral de "${data.fitnessForWork}". Las recomendaciones ocupacionales incluyen: ${data.occupationalRecommendations.toLowerCase()}. El plan de manejo de salud general consiste en: ${data.generalHealthPlan.toLowerCase()}.${data.interconsultation ? ` Se indica interconsulta con el servicio de ${data.interconsultation}.` : ''}${data.nextFollowUp ? ` Se programa un próximo seguimiento para el ${format(new Date(data.nextFollowUp), 'PPP', { locale: es })}.` : ''}`;


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
                <p><strong>Fecha:</strong> {format(new Date(data.evaluationDate), 'dd/MM/yyyy')}</p>
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
