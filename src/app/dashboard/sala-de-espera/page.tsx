
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PatientQueue } from '@/components/patient-queue';
import { PatientCheckinForm } from '@/components/patient-checkin-form';
import { PlusCircle, RefreshCw } from 'lucide-react';
import type { Patient } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { addPatientToWaitlist, createUnifiedPatientAndCheckin, getWaitlist } from '@/actions/patient-actions';
import { useUser } from '@/components/app-shell';
import { RealTimeClock } from '@/components/real-time-clock';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedPatientForm, type UnifiedPatientFormValues } from '@/components/unified-patient-form';

export default function SalaDeEsperaPage() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [patientQueue, setPatientQueue] = React.useState<Patient[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const user = useUser();

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


  const handleSearchCheckin = async (data: any) => {
    try {
        await addPatientToWaitlist({
            personaId: data.searchResult.persona.id,
            name: data.searchResult.persona.nombreCompleto,
            kind: data.searchResult.titularInfo ? 'titular' : 'beneficiario',
            serviceType: data.serviceType,
            accountType: 'Privado', // This needs to be determined properly
            status: 'Esperando',
            checkInTime: new Date(),
        });
        toast({
            variant: 'success',
            title: '¡Paciente Registrado!',
            description: `${data.searchResult.persona.nombreCompleto} ha sido añadido a la cola.`,
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

  const handleCreateCheckin = async (values: UnifiedPatientFormValues) => {
    try {
        await createUnifiedPatientAndCheckin(values);
        toast({
            variant: 'success',
            title: '¡Paciente Creado y Registrado!',
            description: `${values.persona.primerNombre} ${values.persona.primerApellido} ha sido creado y añadido a la cola.`,
        });
        fetchWaitlist(); // Re-fetch immediately
        setIsDialogOpen(false);
    } catch (error) {
         console.error("Error al crear y registrar paciente:", error);
         toast({
            title: 'Error al Crear Paciente',
            description: (error as Error).message || 'No se pudo crear el nuevo paciente.',
            variant: 'destructive',
         });
    }
  }

  return (
    <>
      <div className="flex items-center justify-between space-y-2 bg-background p-4 rounded-lg shadow-sm border">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">Sala de Espera y Registro</h2>
          <RealTimeClock />
        </div>
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
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Registro de Paciente</DialogTitle>
              </DialogHeader>
               <Tabs defaultValue="search" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="search">Buscar Paciente Existente</TabsTrigger>
                    <TabsTrigger value="create">Crear Nuevo Paciente</TabsTrigger>
                  </TabsList>
                  <TabsContent value="search">
                    <PatientCheckinForm onSubmitted={handleSearchCheckin} />
                  </TabsContent>
                   <TabsContent value="create">
                    <UnifiedPatientForm onSubmitted={handleCreateCheckin} onCancel={() => setIsDialogOpen(false)} />
                  </TabsContent>
                </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <PatientQueue user={user} patients={patientQueue} onListRefresh={fetchWaitlist} />
    </>
  );
}

    