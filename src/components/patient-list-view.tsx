'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from './ui/badge';
import type { PacienteConInfo, Persona } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getListaPacientes, createPersona } from '@/actions/patient-actions';
import { Loader2, PlusCircle } from 'lucide-react';
import { calculateAge } from '@/lib/utils';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useUser } from './app-shell';
import { PersonForm } from './person-form';

export function PatientListView() {
  const { toast } = useToast();
  const user = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [pacientes, setPacientes] = React.useState<PacienteConInfo[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const canManage = ['superuser', 'administrator', 'asistencial'].includes(user.role.id);

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

  const handleFormSubmitted = async (values: any) => {
    try {
      await createPersona(values);
      toast({ title: '¡Paciente Creado!', description: `${values.primerNombre} ${values.primerApellido} ha sido añadido.` });
      setIsFormOpen(false);
      await refreshPacientes(search);
    } catch (error: any) {
      console.error("Error creating person:", error);
      toast({ title: 'Error', description: error.message || 'No se pudo crear el paciente.', variant: 'destructive' });
    }
  };

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
            {canManage && (
                <Button onClick={() => setIsFormOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Paciente
                </Button>
            )}
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
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
                    {pacientes.length > 0 ? (
                    pacientes.map((paciente) => (
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
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                        No se encontraron pacientes.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            )}
        </CardContent>
        </Card>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Añadir Nuevo Paciente</DialogTitle>
                </DialogHeader>
                <PersonForm
                    persona={null}
                    onSubmitted={handleFormSubmitted}
                    onCancel={() => setIsFormOpen(false)}
                />
            </DialogContent>
        </Dialog>
    </>
  );
}
