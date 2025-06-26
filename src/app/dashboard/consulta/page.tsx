'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PatientQueue } from '@/components/patient-queue';
import { RefreshCw } from 'lucide-react';
import type { Patient } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getWaitlist } from '@/actions/patient-actions';

export default function ConsultaPage() {
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
  
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Módulo de Consulta</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchWaitlist} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      <PatientQueue patients={patientQueue} onListRefresh={fetchWaitlist} />
    </div>
  );
}
