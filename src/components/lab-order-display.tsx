
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { LabOrder } from '@/lib/types';
import { Button } from './ui/button';
import { Printer } from 'lucide-react';
import { calculateAge } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LabOrderDisplayProps {
  order: LabOrder;
}

export function LabOrderDisplay({ order }: LabOrderDisplayProps) {
  const handlePrint = () => {
    window.print();
  };

  const age = calculateAge(order.paciente.fechaNacimiento);

  return (
    <Card className="mt-2 border-primary/50">
       <div className="printable-lab-order">
            <CardHeader className="text-center pb-2">
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <p className="font-bold text-lg">Dr. Smith</p>
                        <p className="text-sm text-muted-foreground">MPPS 12345</p>
                    </div>
                     <div className="text-right">
                        <p className="font-semibold">Fecha</p>
                        <p className="text-sm text-muted-foreground">{format(order.orderDate, 'PPP', { locale: es })}</p>
                    </div>
                </div>
                 <hr className="my-2"/>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm border p-2 rounded-md">
                    <div>
                        <span className="font-semibold">Paciente:</span>
                        <span className="text-muted-foreground ml-2">{order.paciente.nombreCompleto}</span>
                    </div>
                    <div>
                        <span className="font-semibold">Cédula:</span>
                        <span className="text-muted-foreground ml-2">{order.paciente.cedula}</span>
                    </div>
                     <div>
                        <span className="font-semibold">Edad:</span>
                        <span className="text-muted-foreground ml-2">{age} años</span>
                    </div>
                     <div>
                        <span className="font-semibold">Género:</span>
                        <span className="text-muted-foreground ml-2">{order.paciente.genero}</span>
                    </div>
                </div>

                <div>
                    <p className="font-semibold text-center my-2 text-lg">ORDEN DE LABORATORIO</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground columns-2">
                      {order.tests.map((test, index) => (
                        <li key={index}>{test}</li>
                      ))}
                    </ul>
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
                Imprimir Orden
            </Button>
        </div>
    </Card>
  );
}
