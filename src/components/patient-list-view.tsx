
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from './ui/badge';
import type { PacienteConInfo } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getListaPacientes } from '@/actions/patient-actions';
import { Loader2, Users } from 'lucide-react';
import { calculateAge } from '@/lib/utils';

export function PatientListView() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [pacientes, setPacientes] = React.useState<PacienteConInfo[]>([]);

  const refreshPacientes = React.useCallback(async (currentSearch: string) => {
      setIsLoading(true);
      try {
        const data = await getListaPacientes(currentSearch);
        setPacientes(data);
      } catch (error) {
        console.error("Error al buscar pacientes:", error);
        toast({ title: 'Error', description: 'No se pudieron cargar los pacientes.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
  }, [toast]);


  React.useEffect(() => {
    const timer = setTimeout(async () => {
      await refreshPacientes(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, refreshPacientes]);

  return (
    <>
        <Card>
        <CardHeader>
            <CardTitle>Lista de Pacientes</CardTitle>
            <CardDescription>
            Personas que tienen un historial clínico registrado en el sistema.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex justify-between items-center mb-4">
            <Input
                placeholder="Buscar por nombre, cédula o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
            />
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : pacientes.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Edad</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Email</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pacientes.map((paciente) => (
                        <TableRow key={paciente.id}>
                        <TableCell className="font-medium">{paciente.nombreCompleto}</TableCell>
                        <TableCell>{paciente.cedula}</TableCell>
                        <TableCell>{calculateAge(new Date(paciente.fechaNacimiento))} años</TableCell>
                        <TableCell>
                            {paciente.roles.map(role => (
                            <Badge key={role} variant="secondary" className="mr-1">{role}</Badge>
                            ))}
                        </TableCell>
                        <TableCell>{paciente.email || 'N/A'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground bg-card rounded-md border border-dashed">
                    <Users className="h-12 w-12 mb-4" />
                    <h3 className="text-xl font-semibold">No se encontraron pacientes</h3>
                    <p className="text-sm">Parece que ningún paciente tiene un historial clínico aún.</p>
                </div>
            )}
        </CardContent>
        </Card>
    </>
  );
}
