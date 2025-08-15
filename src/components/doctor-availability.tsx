

'use client';

import * as React from 'react';
import type { User, Patient } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, User as UserIcon } from 'lucide-react';
import { useUser } from './app-shell';

interface DoctorAvailabilityProps {
  doctors: User[];
  patients: Patient[];
}

const DOCTOR_SCHEDULE = {
    morning: ['carolina.guerrero', 'angela.dicenso'],
    afternoon: ['mirna.b', 'zulma.r']
};

export function DoctorAvailability({ doctors, patients }: DoctorAvailabilityProps) {
  const { user: currentUser } = useUser();
  const [activeShift, setActiveShift] = React.useState<'morning' | 'afternoon' | 'all'>('all');

  React.useEffect(() => {
    const getActiveShift = () => {
        const hour = new Date().getHours();
        if (hour >= 7 && hour < 13) return 'morning';
        if (hour >= 13 && hour < 19) return 'afternoon';
        return 'all'; // For viewing outside of typical shift hours
    };
    setActiveShift(getActiveShift());
  }, []);

  
  const patientInConsultation = patients.find(p => p.status === 'En Consulta');

  const scheduledDoctorUsernames = activeShift === 'all' 
    ? [...DOCTOR_SCHEDULE.morning, ...DOCTOR_SCHEDULE.afternoon]
    : DOCTOR_SCHEDULE[activeShift];

  const availableDoctors = doctors
    .filter(d => scheduledDoctorUsernames.includes(d.username))
    .map(doctor => ({
      ...doctor,
      status: patientInConsultation && patientInConsultation.serviceType !== 'servicio de enfermeria' ? 'En Consulta' : 'Disponible',
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doctores de Turno</CardTitle>
        <CardDescription>
          Médicos actualmente disponibles para consulta.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {availableDoctors.length > 0 ? (
          availableDoctors.map(doctor => (
            <div key={doctor.id} className="flex items-center gap-4 rounded-lg border p-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  <UserIcon className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{doctor.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{(doctor.specialty || 'médico').replace(/_/g, ' ')}</p>
              </div>
              <Badge variant={doctor.status === 'En Consulta' ? 'destructive' : 'default'} className="whitespace-nowrap">
                <Stethoscope className="mr-2 h-3 w-3" />
                {doctor.status}
              </Badge>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground col-span-full text-center">No hay doctores de turno en este momento.</p>
        )}
      </CardContent>
    </Card>
  );
}
