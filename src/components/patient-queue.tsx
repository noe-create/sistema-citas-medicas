
'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Baby,
  FilePenLine,
  HeartPulse,
  Stethoscope,
  Clock as ClockIcon,
  PlayCircle,
  MoreHorizontal,
  XCircle,
  ClipboardCheck,
  Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Patient, ServiceType, PatientStatus, User, Consultation } from '@/lib/types';
import { ManagePatientDialog } from './manage-patient-sheet';
import { WaitTimeStopwatch } from './wait-time-stopwatch';
import { ScrollArea } from './ui/scroll-area';
import { updatePatientStatus } from '@/actions/patient-actions';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { calculateAge } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { RescheduleForm } from './reschedule-form';

const serviceInfo: Record<ServiceType, { icon: React.ReactNode, title: string }> = {
  'medicina familiar': { icon: <HeartPulse className="h-5 w-5 text-blue-500" />, title: 'Medicina Familiar' },
  'consulta pediatrica': { icon: <Baby className="h-5 w-5 text-pink-500" />, title: 'Consulta Pediátrica' },
  'servicio de enfermeria': { icon: <Stethoscope className="h-5 w-5 text-green-500" />, title: 'Servicio de Enfermería' },
  'salud ocupacional': { icon: <Briefcase className="h-5 w-5 text-indigo-500" />, title: 'Salud Ocupacional' },
};

const statusInfo: Record<PatientStatus, { label: string; color: string; badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    'Esperando': { label: 'Esperando', color: 'border-yellow-500/80', badgeVariant: 'secondary' },
    'En Consulta': { label: 'En Consulta', color: 'border-blue-500/80', badgeVariant: 'default' },
    'En Tratamiento': { label: 'En Tratamiento', color: 'border-purple-500/80', badgeVariant: 'secondary' },
    'Ausente': { label: 'Ausente', color: 'border-gray-500/80', badgeVariant: 'secondary' },
    'Pospuesto': { label: 'Pospuesto', color: 'border-orange-500/80', badgeVariant: 'secondary' },
    'Reevaluacion': { label: 'Reevaluación', color: 'border-cyan-500/80', badgeVariant: 'secondary' },
    'Cancelado': { label: 'Cancelado', color: 'border-red-500/80', badgeVariant: 'destructive' },
    'Completado': { label: 'Completado', color: 'border-green-500/80', badgeVariant: 'secondary' },
};

interface PatientQueueProps {
    user: User | null;
    patients: Patient[];
    onListRefresh: () => void;
}

export function PatientQueue({ user, patients, onListRefresh }: PatientQueueProps) {
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = React.useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = React.useState(false);
  const [patientToReschedule, setPatientToReschedule] = React.useState<Patient | null>(null);

  if (!user) {
    return null;
  }

  const canManageStatus = ['superuser', 'administrator', 'asistencial', 'doctor', 'enfermera'].includes(user.role.id);

  const statusOptionsForRole = React.useMemo(() => {
    if (!user) return [];
    const baseOptions: PatientStatus[] = ['Ausente', 'Pospuesto', 'Reevaluacion'];
    
    if (user.role.id === 'asistencial' || user.role.id === 'administrator') {
      return ['Esperando', ...baseOptions];
    }
    
    if (user.role.id === 'enfermera') {
        return ['Esperando', 'En Tratamiento', ...baseOptions];
    }
    
    // doctor, superuser
    return ['Esperando', 'En Tratamiento', ...baseOptions];
  }, [user]);

  const selectedPatient = React.useMemo(
    () => (patients || []).find((p) => p.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setSelectedPatientId(null);
    }
  }

  const handleChangeStatus = async (patientId: string, status: PatientStatus) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    try {
        await updatePatientStatus(patientId, status);
        
        const toastOptions: { 
            variant: 'default' | 'destructive' | 'success' | 'info', 
            title: string, 
            description: string 
        } = {
            variant: 'default',
            title: 'Estado Actualizado',
            description: `El estado de ${patient.name} es ahora "${statusInfo[status].label}".`
        };

        if (status === 'Cancelado') {
            toastOptions.variant = 'destructive';
            toastOptions.title = 'Cita Cancelada';
        }

        toast(toastOptions);
        onListRefresh();
    } catch (error: any) {
        console.error("Error updating status:", error);
        toast({ title: "Error", description: error.message || "No se pudo actualizar el estado.", variant: 'destructive'});
    }
  };

  const handleOpenRescheduleDialog = (patient: Patient) => {
    setPatientToReschedule(patient);
    setIsRescheduleOpen(true);
  };
  
  const handleRescheduleSubmit = async (newDateTime: Date) => {
    if (!patientToReschedule) return;
    try {
        await updatePatientStatus(patientToReschedule.id, 'Pospuesto', newDateTime);
        toast({
            variant: 'info',
            title: 'Cita Pospuesta',
            description: `La cita de ${patientToReschedule.name} ha sido reprogramada.`,
        });
        onListRefresh();
        setIsRescheduleOpen(false);
        setPatientToReschedule(null);
    } catch (error: any) {
        console.error('Error rescheduling appointment:', error);
        toast({ title: 'Error', description: error.message || 'No se pudo reprogramar la cita.', variant: 'destructive' });
    }
  };

  const handleStartOrContinueConsultation = async (patient: Patient) => {
    if (patient.status === 'Esperando' || patient.status === 'Reevaluacion') {
        try {
            await updatePatientStatus(patient.id, 'En Consulta');
            toast({
                variant: 'info',
                title: 'Paciente en Consulta',
                description: `${patient.name} ha sido llamado.`,
            });
            onListRefresh();
        } catch(error) {
            console.error("Error updating status:", error);
            toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: 'destructive'});
            return;
        }
    }
    setSelectedPatientId(patient.id);
    setIsSheetOpen(true);
  };
  
  const handleConsultationComplete = (consultation: Consultation) => {
    toast({
        variant: 'success',
        title: 'Consulta Completada',
        description: `La consulta de ${selectedPatient?.name} ha sido finalizada con éxito.`
    });
    onListRefresh();
    setIsSheetOpen(false);
    setSelectedPatientId(null);
  };

  const visibleServices = React.useMemo(() => {
    const allServices = Object.keys(serviceInfo) as ServiceType[];

    if (user.role.id === 'superuser' || user.role.id === 'asistencial' || user.role.id === 'administrator') {
      return allServices;
    }

    if (user.role.id === 'doctor') {
      if (user.specialty === 'medico pediatra') {
        return allServices.filter((s) => s === 'consulta pediatrica' || s === 'servicio de enfermeria');
      }
      if (user.specialty === 'medico familiar') {
        return allServices.filter((s) => s === 'medicina familiar' || s === 'servicio de enfermeria' || s === 'salud ocupacional');
      }
      return allServices; // Default doctor can see all
    }
    
    if (user.role.id === 'enfermera') {
      return allServices.filter((s) => s === 'servicio de enfermeria');
    }

    return [];
  }, [user]);

  const groupedPatients = React.useMemo(() => {
    return (visibleServices || []).reduce((acc, service) => {
        acc[service] = (patients || []).filter(p => p.serviceType === service);
        return acc;
    }, {} as Record<ServiceType, Patient[]>);
  }, [visibleServices, patients]);

  const gridColsClass = React.useMemo(() => {
    const count = visibleServices.length;
    if (count === 1) {
      return 'md:grid-cols-1';
    }
    if (count === 2) {
      return 'md:grid-cols-2';
    }
    if (count === 3) {
      return 'md:grid-cols-3';
    }
    return 'lg:grid-cols-4 md:grid-cols-2'; // For 4 services
  }, [visibleServices]);

  const totalPatientsInQueue = (patients || []).length;

  return (
    <>
      <div className={`grid grid-cols-1 ${gridColsClass} gap-6`}>
        {(visibleServices || []).map((service) => (
          <Card key={service} className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium capitalize flex items-center gap-2">
                {serviceInfo[service].icon}
                {serviceInfo[service].title}
              </CardTitle>
              <Badge variant="outline">{groupedPatients[service]?.length || 0}</Badge>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-96 w-full p-6 pt-0">
                    <div className="space-y-4">
                    {(!groupedPatients[service] || groupedPatients[service].length === 0) ? (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground pt-10">
                            No hay pacientes en esta cola.
                        </div>
                    ) : (
                        groupedPatients[service].map((patient) => {
                          const age = calculateAge(new Date(patient.fechaNacimiento));
                          return (
                            <div key={patient.id} className={`flex flex-col gap-3 p-3 rounded-lg border-l-4 ${statusInfo[patient.status].color} bg-card shadow-sm`}>
                                <div className="flex justify-between items-start">
                                    <div className='flex-1 overflow-hidden'>
                                        <p className="font-semibold truncate">{patient.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {patient.accountType} &bull; {patient.kind === 'titular' ? 'Titular' : 'Beneficiario'}
                                            {age < 18 && ` • ${age} años`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Badge variant={statusInfo[patient.status].badgeVariant} className="capitalize">
                                        {statusInfo[patient.status].label}
                                      </Badge>
                                      {canManageStatus ? (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                              <span className="sr-only">Cambiar Estado</span>
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {statusOptionsForRole.filter(s => s !== patient.status).map(status => (
                                                <DropdownMenuItem 
                                                    key={status} 
                                                    onSelect={() => {
                                                        if (status === 'Pospuesto') {
                                                            handleOpenRescheduleDialog(patient);
                                                        } else {
                                                            handleChangeStatus(patient.id, status as PatientStatus);
                                                        }
                                                    }}
                                                >
                                                    {statusInfo[status as PatientStatus].label}
                                                </DropdownMenuItem>
                                            ))}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem 
                                                className="text-destructive focus:text-destructive" 
                                                onSelect={() => handleChangeStatus(patient.id, 'Cancelado')}
                                                disabled={patient.status === 'En Consulta' || patient.status === 'En Tratamiento'}
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                <span>Cancelar Cita</span>
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      ) : null}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <ClockIcon className="h-3.5 w-3.5" />
                                        <span>{new Date(patient.checkInTime).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <WaitTimeStopwatch startTime={new Date(patient.checkInTime)} />
                                </div>
                                {(user?.role.id === 'superuser' || user?.role.id === 'doctor') &&
                                    (patient.status === 'Esperando' || patient.status === 'En Consulta' || patient.status === 'Reevaluacion') && (
                                    <Button 
                                        onClick={() => handleStartOrContinueConsultation(patient)} 
                                        size="sm" 
                                        className="w-full mt-1"
                                        variant={patient.status === 'En Consulta' ? 'secondary' : 'default'}
                                    >
                                        {patient.status === 'En Consulta' ? (
                                            <><FilePenLine className="mr-2 h-4 w-4" /> Continuar Consulta</>
                                        ) : patient.status === 'Reevaluacion' ? (
                                            <><PlayCircle className="mr-2 h-4 w-4" /> Iniciar Reevaluación</>
                                        ) : (
                                            <><PlayCircle className="mr-2 h-4 w-4" /> Iniciar Consulta</>
                                        )}
                                    </Button>
                                )}
                            </div>
                          )
                        })
                    )}
                    </div>
                </ScrollArea>
            </CardContent>
          </Card>
        ))}
        {totalPatientsInQueue === 0 && (
            <div className={`col-span-1 ${gridColsClass} flex flex-col items-center justify-center h-96 text-center text-muted-foreground bg-card rounded-md border border-dashed`}>
                <ClipboardCheck className="h-16 w-16 mb-4" />
                <h3 className="text-2xl font-semibold">Sala de Espera Despejada</h3>
                <p className="text-md">No hay pacientes en cola en este momento.</p>
            </div>
        )}
      </div>

      {selectedPatient && (
        <ManagePatientDialog
          patient={selectedPatient}
          isOpen={isSheetOpen}
          onOpenChange={handleSheetOpenChange}
          onConsultationComplete={handleConsultationComplete}
        />
      )}

      {patientToReschedule && (
          <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Reprogramar Cita</DialogTitle>
                      <DialogDescription>
                         Seleccione la nueva fecha y hora para {patientToReschedule.name}.
                      </DialogDescription>
                  </DialogHeader>
                  <RescheduleForm onSubmit={handleRescheduleSubmit} />
              </DialogContent>
          </Dialog>
      )}
    </>
  );
}
