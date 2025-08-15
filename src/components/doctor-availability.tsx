

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

export function DoctorAvailability({ doctors, patients }: DoctorAvailabilityProps) {
  const patientInConsultation = patients.find(p => p.status === 'En Consulta');

  const availableDoctors = doctors.map(doctor => ({
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
                <p className="text-sm text-muted-foreground capitalize">{doctor.specialty?.replace(/_/g, ' ') || 'Médico'}</p>
              </div>
              <Badge variant={doctor.status === 'En Consulta' ? 'destructive' : 'default'} className="whitespace-nowrap">
                <Stethoscope className="mr-2 h-3 w-3" />
                {doctor.status}
              </Badge>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground col-span-full text-center">No hay doctores registrados en el sistema.</p>
        )}
      </CardContent>
    </Card>
  );
}
