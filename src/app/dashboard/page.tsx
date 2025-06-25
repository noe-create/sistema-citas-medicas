'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PatientQueue } from '@/components/patient-queue';
import { PatientCheckinForm } from '@/components/patient-checkin-form';
import { PlusCircle } from 'lucide-react';
import type { Patient } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


export default function DashboardPage() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [patientQueue, setPatientQueue] = React.useState<Patient[]>([]);
  const { toast } = useToast();

  const handleFormSubmitted = (newPatient: Patient) => {
     // Check if patient is already in the queue
    if (patientQueue.some(p => p.patientDbId === newPatient.patientDbId && p.status !== 'Completado')) {
      toast({
        title: 'Paciente ya en cola',
        description: `${newPatient.name} ya se encuentra en la cola de espera.`,
        variant: 'destructive',
      });
      return;
    }
    
    setPatientQueue(prevQueue => [...prevQueue, newPatient]);
    toast({
        title: '¡Paciente Registrado!',
        description: `${newPatient.name} ha sido añadido a la cola.`,
    });
    setIsDialogOpen(false);
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Panel de Pacientes</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Registrar Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Registrar Paciente en Cola</DialogTitle>
              <DialogDescription>
                Busque un titular o beneficiario para añadirlo a la cola de espera.
              </DialogDescription>
            </DialogHeader>
            <PatientCheckinForm onSubmitted={handleFormSubmitted} />
          </DialogContent>
        </Dialog>
      </div>
      <PatientQueue patients={patientQueue} setPatients={setPatientQueue} />
    </div>
  );
}
