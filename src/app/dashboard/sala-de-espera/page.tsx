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
import { PatientCheckinForm, type RegistrationData } from '@/components/patient-checkin-form';
import { PlusCircle, RefreshCw } from 'lucide-react';
import type { Patient, TitularType, AccountType, ServiceType, SearchResult, PatientKind } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getWaitlist, addPatientToWaitlist, getTitularTypeByTitularId } from '@/actions/patient-actions';

const titularTypeToAccountType = (titularType: TitularType): AccountType => {
  switch (titularType) {
    case 'internal_employee': return 'Empleado';
    case 'corporate_affiliate': return 'Afiliado Corporativo';
    case 'private': return 'Privado';
    default: return 'Privado';
  }
};

export default function SalaDeEsperaPage() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [patientQueue, setPatientQueue] = React.useState<Patient[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchWaitlist = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getWaitlist();
      setPatientQueue(data);
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


  const handleRegistrationSubmit = async (data: RegistrationData) => {
    const { searchResult, serviceType } = data;
    const persona = searchResult.persona;

    if (patientQueue.some(p => p.personaId === persona.id && p.status !== 'Completado')) {
      toast({
        title: 'Paciente ya en cola',
        description: `${persona.nombreCompleto} ya se encuentra en la cola de espera.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      let accountType: AccountType;
      let kind: PatientKind;

      // Prioritize Titular role
      if (searchResult.titularInfo) {
          kind = 'titular';
          accountType = titularTypeToAccountType(searchResult.titularInfo.tipo);
      } else if (searchResult.beneficiarioDe && searchResult.beneficiarioDe.length > 0) {
          kind = 'beneficiario';
          // If beneficiary of multiple, pick the first one to determine account type.
          const titularId = searchResult.beneficiarioDe[0].titularId;
          const titularType = await getTitularTypeByTitularId(titularId);
          if (!titularType) throw new Error("No se pudo determinar el tipo de cuenta del titular.");
          accountType = titularTypeToAccountType(titularType);
      } else {
           toast({
            title: 'No se puede registrar',
            description: `${persona.nombreCompleto} no es un miembro válido (titular o beneficiario).`,
            variant: 'destructive',
          });
          return;
      }

      const newPatientData: Omit<Patient, 'id' | 'pacienteId'> = {
          personaId: persona.id,
          name: persona.nombreCompleto,
          kind: kind,
          serviceType: serviceType,
          accountType: accountType,
          status: 'Esperando',
          checkInTime: new Date(),
          fechaNacimiento: persona.fechaNacimiento,
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
        description: (error as Error).message || 'No se pudo añadir el paciente a la cola.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Sala de Espera y Registro</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchWaitlist} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Registrar Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Registro de Paciente</DialogTitle>
                <DialogDescription>
                  Busque una persona y seleccione el servicio para añadirla a la cola.
                </DialogDescription>
              </DialogHeader>
              <PatientCheckinForm onSubmitted={handleRegistrationSubmit} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <PatientQueue patients={patientQueue} onListRefresh={fetchWaitlist} />
    </>
  );
}
