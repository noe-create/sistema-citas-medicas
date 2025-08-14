
'use client';

import * as React from 'react';
import type { User, Patient } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, User as UserIcon } from 'lucide-react';

interface DoctorAvailabilityProps {
  doctors: User[];
  patients: Patient[];
}

// Hardcoded schedule for demonstration purposes
const DOCTOR_SCHEDULE = {
  morning: ['pediatra', 'carlos.r'], // Usernames of morning shift doctors
  afternoon: ['sofia.g', 'luis.h'], // Usernames of afternoon shift doctors
};

export function DoctorAvailability({ doctors, patients }: DoctorAvailabilityProps) {
  const [currentTime, setCurrentTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    // This effect runs only on the client to get the current time,
    // avoiding server-client mismatch (hydration errors).
    setCurrentTime(new Date());
    const timerId = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timerId);
  }, []);

  const getActiveShift = () => {
    if (!currentTime) return null; // Wait for client-side time
    const currentHour = currentTime.getHours();
    
    if (currentHour >= 7 && currentHour < 12) {
      return 'morning';
    }
    if (currentHour >= 13 && currentHour < 17) {
        return 'afternoon';
    }
    return null; // Outside of shift hours or during break
  };
  
  const activeShiftKey = getActiveShift();
  if (!activeShiftKey) return null;

  const activeDoctorUsernames = DOCTOR_SCHEDULE[activeShiftKey];
  
  const patientInConsultation = patients.find(p => p.status === 'En Consulta');

  const activeDoctors = doctors
    .filter(d => activeDoctorUsernames.includes(d.username))
    .map(doctor => ({
      ...doctor,
      status: patientInConsultation ? 'En Consulta' : 'Disponible',
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
        {activeDoctors.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center">No hay doctores asignados para este turno.</p>
        )}
        {activeDoctors.map(doctor => (
          <div key={doctor.id} className="flex items-center gap-4 rounded-lg border p-4">
             <Avatar className="h-12 w-12">
                <AvatarFallback>
                    <UserIcon className="h-6 w-6"/>
                </AvatarFallback>
             </Avatar>
             <div className="flex-1">
                <p className="font-semibold">{doctor.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{doctor.specialty?.replace(/_/g, ' ') || 'Médico'}</p>
             </div>
             <Badge variant={doctor.status === 'En Consulta' ? 'destructive' : 'default'} className="whitespace-nowrap">
                <Stethoscope className="mr-2 h-3 w-3" />
                {doctor.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
