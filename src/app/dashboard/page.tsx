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
import { PlusCircle, RefreshCw } from 'lucide-react';
import type { Patient, TitularType, AccountType, ServiceType, SearchResult } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getWaitlist, addPatientToWaitlist, getTitularTypeById } from '@/actions/patient-actions';

const titularTypeToAccountType = (titularType: TitularType): AccountType => {
  switch (titularType) {
    case 'internal_employee': return 'Empleado';
    case 'corporate_affiliate': return 'Afiliado Corporativo';
    case 'private': return 'Privado';
    default: return 'Privado';
  }
};

export default function DashboardPage() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [patientQueue, setPatientQueue] = React.useState<Patient[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchWaitlist = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getWaitlist();
      setPatientQueue(data.map(p => ({ ...p, checkInTime: new Date(p.checkInTime) })));
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error al cargar la sala de espera',
        description: 'No se pudieron obtener los datos de los pacientes. Intente de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchWaitlist();
    const intervalId = setInterval(fetchWaitlist, 10000); // Poll every 10 seconds

    return () => clearInterval(intervalId);
  }, [fetchWaitlist]);


  const handleCheckinSubmit = async (data: { serviceType: ServiceType, patient: SearchResult }) => {
     // Check if patient is already in the queue
    if (patientQueue.some(p => p.patientDbId === data.patient.id && p.status !== 'Completado')) {
      toast({
        title: 'Paciente ya en cola',
        description: `${data.patient.nombreCompleto} ya se encuentra en la cola de espera.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const titularId = data.patient.kind === 'titular' ? data.patient.id : data.patient.titularInfo!.id;
      const titularType = await getTitularTypeById(titularId);

      if (!titularType) {
          throw new Error("No se pudo determinar el tipo de cuenta del titular.");
      }

      const newPatientData: Omit<Patient, 'id'> = {
          patientDbId: data.patient.id,
          name: data.patient.nombreCompleto,
          kind: data.patient.kind,
          serviceType: data.serviceType,
          accountType: titularTypeToAccountType(titularType),
          status: 'Esperando',
          checkInTime: new Date(),
      };
      
      await addPatientToWaitlist(newPatientData);

      toast({
          title: '¡Paciente Registrado!',
          description: `${newPatientData.name} ha sido añadido a la cola.`,
      });
      fetchWaitlist(); // Re-fetch immediately
      setIsDialogOpen(false);

    } catch (error) {
      console.error("Error al registrar paciente:", error);
      toast({
        title: 'Error al registrar',
        description: 'No se pudo añadir el paciente a la cola.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Sala de Espera y Check-in</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchWaitlist} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Realizar Check-in
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Check-in de Paciente</DialogTitle>
                <DialogDescription>
                  Busque un titular o beneficiario y seleccione el servicio para añadirlo a la cola.
                </DialogDescription>
              </DialogHeader>
              <PatientCheckinForm onSubmitted={handleCheckinSubmit} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <PatientQueue patients={patientQueue} onListRefresh={fetchWaitlist} />
    </div>
  );
}
