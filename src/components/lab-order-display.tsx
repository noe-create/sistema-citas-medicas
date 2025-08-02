

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
  const [age, setAge] = React.useState<number | null>(null);

  React.useEffect(() => {
    // Calculate age on the client-side to avoid hydration mismatch
    setAge(calculateAge(order.paciente.fechaNacimiento));
  }, [order.paciente.fechaNacimiento]);

  return (
    <Card className="h-full border-primary/50">
       <div className="p-4">
            <header className="text-center pb-2">
                <div className="flex justify-between items-start">
                    <div className="text-left text-xs">
                        <p className="font-bold">Dr. [Nombre del Doctor]</p>
                        <p className="text-muted-foreground">MPPS 12345</p>
                    </div>
                     <div className="text-right text-xs">
                        <p className="font-semibold">Fecha</p>
                        <p className="text-muted-foreground">{format(order.orderDate, 'PPP', { locale: es })}</p>
                    </div>
                </div>
                 <hr className="my-2"/>
            </header>
            <div className="space-y-4 text-left">
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
                        <span className="text-muted-foreground ml-2">{age !== null ? `${age} años` : 'Calculando...'}</span>
                    </div>
                     <div>
                        <span className="font-semibold">Género:</span>
                        <span className="text-muted-foreground ml-2">{order.paciente.genero}</span>
                    </div>
                </div>

                <div>
                    <p className="font-semibold text-center my-2 text-lg">ORDEN DE LABORATORIO</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground columns-2">
                      {order.tests.map((test, index) => (
                        <li key={index}>{test}</li>
                      ))}
                    </ul>
                </div>
                 <div className="flex flex-col items-end pt-12">
                     <div className="w-48 h-16 border-b border-foreground/50"></div>
                     <p className="text-sm">Firma y Sello</p>
                </div>
            </div>
        </div>
    </Card>
  );
}
