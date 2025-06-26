'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Baby,
  FilePenLine,
  HeartPulse,
  MoreHorizontal,
  Stethoscope,
  Clock,
  PlayCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Patient, ServiceType, PatientStatus } from '@/lib/types';
import { ManagePatientSheet } from './manage-patient-sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WaitTimeStopwatch } from './wait-time-stopwatch';
import { ScrollArea } from './ui/scroll-area';
import { updatePatientStatus } from '@/actions/patient-actions';
import { useToast } from '@/hooks/use-toast';

const serviceInfo: Record<ServiceType, { icon: React.ReactNode, title: string }> = {
  'medicina general': { icon: <HeartPulse className="h-5 w-5 text-red-500" />, title: 'Medicina General' },
  'consulta pediatrica': { icon: <Baby className="h-5 w-5 text-blue-500" />, title: 'Consulta Pediátrica' },
  'servicio de enfermeria': { icon: <Stethoscope className="h-5 w-5 text-green-500" />, title: 'Servicio de Enfermería' },
};

const statusColors: Record<PatientStatus, string> = {
    'Esperando': 'border-yellow-500/80',
    'En Consulta': 'border-blue-500/80',
    'Completado': 'border-green-500/80',
}

interface PatientQueueProps {
    patients: Patient[];
    onListRefresh: () => void;
}

export function PatientQueue({ patients, onListRefresh }: PatientQueueProps) {
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = React.useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const selectedPatient = React.useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setSelectedPatientId(null);
    }
  }

  const handleStatusChange = async (patientId: string, status: PatientStatus) => {
    try {
        await updatePatientStatus(patientId, status);
        toast({
            title: 'Estado Actualizado',
            description: `El paciente ha sido actualizado a "${status}".`
        });
        onListRefresh();
    } catch(error) {
        console.error("Error updating status:", error);
        toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: 'destructive'});
    }
  }

  const handleManagePatient = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setIsSheetOpen(true);
  };
  
  const handleConsultationComplete = () => {
    onListRefresh();
    setIsSheetOpen(false);
    setSelectedPatientId(null);
  };

  const services = Object.keys(serviceInfo) as ServiceType[];
  const groupedPatients = services.reduce((acc, service) => {
    acc[service] = patients.filter(p => p.serviceType === service);
    return acc;
  }, {} as Record<ServiceType, Patient[]>);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service} className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium capitalize flex items-center gap-2">
                {serviceInfo[service].icon}
                {serviceInfo[service].title}
              </CardTitle>
              <Badge variant="outline">{groupedPatients[service].length}</Badge>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-96 w-full p-6 pt-0">
                    <div className="space-y-4">
                    {groupedPatients[service].length === 0 ? (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground pt-10">
                            No hay pacientes en espera.
                        </div>
                    ) : (
                        groupedPatients[service].map((patient) => (
                        <div key={patient.id} className={`p-3 rounded-lg border-l-4 ${statusColors[patient.status]} bg-card shadow-sm`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{patient.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {patient.accountType} &bull; {patient.kind === 'titular' ? 'Titular' : 'Beneficiario'}
                                    </p>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Abrir menú</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleManagePatient(patient)}>
                                            <FilePenLine className="mr-2 h-4 w-4" />
                                            <span>Gestionar Paciente</span>
                                        </DropdownMenuItem>
                                        {patient.status === 'Esperando' && (
                                            <DropdownMenuItem onClick={() => handleStatusChange(patient.id, 'En Consulta')}>
                                                <PlayCircle className="mr-2 h-4 w-4" />
                                                <span>Llamar a Consulta</span>
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{new Date(patient.checkInTime).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <Badge variant={patient.status === 'En Consulta' ? 'default' : 'secondary'} className="capitalize">{patient.status}</Badge>
                                <WaitTimeStopwatch startTime={patient.checkInTime} />
                            </div>
                        </div>
                        ))
                    )}
                    </div>
                </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPatient && (
        <ManagePatientSheet
          patient={selectedPatient}
          isOpen={isSheetOpen}
          onOpenChange={handleSheetOpenChange}
          onConsultationComplete={handleConsultationComplete}
        />
      )}
    </>
  );
}
