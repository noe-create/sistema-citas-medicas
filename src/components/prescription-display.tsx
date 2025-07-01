
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { GeneratePrescriptionOutput } from '@/ai/flows/generate-prescription';
import { Button } from './ui/button';
import { Printer } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PrescriptionDisplayProps {
  prescription: GeneratePrescriptionOutput;
}

export function PrescriptionDisplay({ prescription }: PrescriptionDisplayProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="mt-6 border-primary/50">
       <div className="printable-prescription">
            <CardHeader className="text-center">
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <p className="font-bold text-lg">{prescription.doctorName}</p>
                        <p className="text-sm text-muted-foreground">{prescription.doctorLicense}</p>
                    </div>
                     <div className="text-right">
                        <p className="font-semibold">Fecha</p>
                        <p className="text-sm text-muted-foreground">{prescription.date}</p>
                    </div>
                </div>
                 <hr className="my-4"/>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
                 <div>
                    <p className="font-semibold">Paciente:</p>
                    <p className="text-muted-foreground">{prescription.patientName}</p>
                </div>
                <div>
                    <p className="font-semibold">Indicaciones (Rp.):</p>
                    <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 max-w-none text-muted-foreground">
                       <ReactMarkdown>{prescription.prescriptionBody}</ReactMarkdown>
                    </div>
                </div>
                 <div className="flex flex-col items-end pt-12">
                     <div className="w-48 h-16 border-b border-foreground/50"></div>
                     <p className="text-sm">Firma y Sello</p>
                </div>
            </CardContent>
        </div>
        <div className="p-6 pt-0 no-print">
             <Button onClick={handlePrint} className="w-full">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir Récipe
            </Button>
        </div>
    </Card>
  );
}
