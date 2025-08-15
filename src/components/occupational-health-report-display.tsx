
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
  
  const riskText = Array.isArray(data.occupationalRisks) ? data.occupationalRisks.join(', ') : data.occupationalRisks;
  const diagnosesText = Array.isArray(data.diagnoses) ? data.diagnoses.map((d: any) => d.cie10Description).join('; ') : data.diagnoses;

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
            <h2 className="font-semibold text-base uppercase">Informe de Evaluación Médica Ocupacional</h2>
        </div>
        
        {/* PARTE 1: DATOS DE LA EVALUACIÓN */}
        <section className="border-t border-b border-black py-2 mt-4">
            <h3 className="font-bold text-center mb-2">PARTE 1: DATOS DE LA EVALUACIÓN</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <p><strong>Paciente:</strong> {persona.nombreCompleto}</p>
                <p><strong>Edad:</strong> {ageString || 'Calculando...'}</p>
                <p><strong>Tipo de Paciente:</strong> {data.patientType}</p>
                <p><strong>Propósito de la Consulta:</strong> {data.consultationPurpose}</p>
                <p className="col-span-2"><strong>Puesto de Trabajo:</strong> {data.jobPosition}</p>
            </div>
        </section>

        {/* PARTE 2: ANÁLISIS DE SALUD OCUPACIONAL */}
        <div className="flex-grow mt-4 text-justify leading-relaxed space-y-3">
            <h3 className="font-bold text-center mb-2">PARTE 2: ANÁLISIS DE SALUD OCUPACIONAL</h3>
            
            <div>
                <h4 className="font-bold">Historia Ocupacional y Riesgos:</h4>
                <p>
                    Las tareas del puesto de trabajo incluyen {data.jobDescription.toLowerCase()}. Durante su jornada, el paciente está expuesto a riesgos de tipo {riskText}. La exposición cualitativa se describe como: {data.riskDetails.toLowerCase()}.
                </p>
            </div>

            <div>
                <h4 className="font-bold">Antecedentes y Estilo de Vida:</h4>
                <p>
                    El paciente refiere como antecedentes personales de importancia: {data.personalHistory.toLowerCase()}. En cuanto a los antecedentes familiares, se reporta: {data.familyHistory.toLowerCase()}. Su estilo de vida se caracteriza por una alimentación {data.lifestyle.diet.toLowerCase()}, una actividad física consistente en {data.lifestyle.physicalActivity.toLowerCase()}, y una calidad de sueño descrita como {data.lifestyle.sleepQuality.toLowerCase()}. El consumo de tabaco se reporta como "{data.lifestyle.smoking}" y el de alcohol como "{data.lifestyle.alcohol}". En la esfera de salud mental, el paciente refiere: {data.mentalHealth.toLowerCase() || 'sin particularidades'}.
                </p>
            </div>
            
            <div>
                <h4 className="font-bold">Hallazgos Clínicos:</h4>
                <p>
                    Al examen físico, se registran los siguientes signos vitales: Tensión Arterial de {data.vitalSigns.ta}, Frecuencia Cardíaca de {data.vitalSigns.fc}, Frecuencia Respiratoria de {data.vitalSigns.fr} y Temperatura de {data.vitalSigns.temp}. Los datos antropométricos son: Peso de {data.anthropometry.weight} kg, Talla de {data.anthropometry.height} cm, con un IMC de {data.anthropometry.imc}. El examen físico dirigido, con enfoque en sistema osteomuscular, agudeza visual y auditiva, revela: {data.physicalExamFindings.toLowerCase()}.
                </p>
            </div>

            <div>
                <h4 className="font-bold">Conclusión y Plan de Manejo:</h4>
                <p>
                    Con base en los hallazgos, se establece el siguiente diagnóstico: {diagnosesText}. Se determina un concepto de aptitud laboral de "{data.fitnessForWork}". Las recomendaciones ocupacionales incluyen: {data.occupationalRecommendations.toLowerCase()}. El plan de manejo de salud general consiste en: {data.generalHealthPlan.toLowerCase()}.{data.interconsultation ? ` Se indica interconsulta con el servicio de ${data.interconsultation}.` : ''}{data.nextFollowUp ? ` Se programa un próximo seguimiento para el ${format(new Date(data.nextFollowUp), 'PPP', { locale: es })}.` : ''}
                </p>
            </div>
        </div>

        <footer className="flex flex-col items-center text-sm pt-8 mt-auto">
            <div className="w-48 border-b border-black"></div>
            <p className="font-semibold mt-1">Atentamente;</p>
            <p>Dr. [Nombre del Doctor]</p>
            <p>Salud Ocupacional</p>
        </footer>
      </div>
    </div>
  );
}
