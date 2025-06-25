'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Baby,
  Briefcase,
  Building2,
  FilePenLine,
  HeartPulse,
  MoreHorizontal,
  Stethoscope,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Patient, ServiceType, AccountType } from '@/lib/types';
import { ManagePatientSheet } from './manage-patient-sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const serviceIcons: Record<ServiceType, React.ReactNode> = {
  'Medicina General': <HeartPulse className="h-5 w-5 text-red-500" />,
  'Pediatría': <Baby className="h-5 w-5 text-blue-500" />,
  'Enfermería': <Stethoscope className="h-5 w-5 text-green-500" />,
};

const accountIcons: Record<AccountType, React.ReactNode> = {
  'Empleado': <Briefcase className="h-5 w-5 text-indigo-500" />,
  'Afiliado Corporativo': <Building2 className="h-5 w-5 text-purple-500" />,
  'Privado': <User className="h-5 w-5 text-gray-500" />,
};

interface PatientQueueProps {
    patients: Patient[];
    setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
}

export function PatientQueue({ patients, setPatients }: PatientQueueProps) {
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const handleManagePatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsSheetOpen(true);
  };
  
  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setSelectedPatient(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Cola de Pacientes</CardTitle>
          <CardDescription>Los pacientes se ordenan por hora de llegada.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Tipo de Cuenta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Hora de Llegada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No hay pacientes en la cola.
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                        <div>{patient.name}</div>
                        <div className="text-xs text-muted-foreground">
                            {patient.kind === 'titular' ? 'Titular' : 'Beneficiario'}
                        </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {serviceIcons[patient.serviceType]}
                        <span>{patient.serviceType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {accountIcons[patient.accountType]}
                        <span>{patient.accountType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.status === 'Completado' ? 'secondary' : patient.status === 'En Consulta' ? 'default' : 'outline'}
                        className={patient.status === 'En Consulta' ? 'bg-accent text-accent-foreground' : ''}
                      >
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(patient.checkInTime).toLocaleTimeString('es-VE')}</TableCell>
                    <TableCell className="text-right">
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedPatient && (
        <ManagePatientSheet
          patient={selectedPatient}
          isOpen={isSheetOpen}
          onOpenChange={handleSheetOpenChange}
        />
      )}
    </>
  );
}
