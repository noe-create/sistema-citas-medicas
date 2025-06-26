'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import type { Persona } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { getPersonas, createPersona, updatePersona, deletePersona } from '@/actions/patient-actions';
import { Loader2, MoreHorizontal, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { PersonForm } from './person-form';
import { useUser } from './app-shell';

export function PeopleList() {
  const { toast } = useToast();
  const user = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [personas, setPersonas] = React.useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  
  const refreshPersonas = React.useCallback(async (currentSearch: string) => {
    setIsLoading(true);
      try {
        const data = await getPersonas(currentSearch);
        setPersonas(data);
      } catch (error) {
        console.error("Error al buscar personas:", error);
        toast({ title: 'Error', description: 'No se pudieron cargar las personas.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
  }, [toast]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      refreshPersonas(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, refreshPersonas]);

  const handleOpenForm = (persona: Persona | null) => {
    setSelectedPersona(persona);
    setIsFormOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedPersona(null);
  };

  const handleFormSubmitted = async (values: any) => {
    try {
      if (selectedPersona) {
        await updatePersona(selectedPersona.id, values);
        toast({ title: '¡Persona Actualizada!', description: `${values.nombreCompleto} ha sido guardado.` });
      } else {
        await createPersona(values);
        toast({ title: '¡Persona Creada!', description: `${values.nombreCompleto} ha sido añadida.` });
      }
      handleCloseDialog();
      await refreshPersonas(search);
    } catch (error: any) {
      console.error("Error saving persona:", error);
      toast({ title: 'Error', description: error.message || 'No se pudo guardar la persona.', variant: 'destructive' });
    }
  };
  
  const handleDeletePersona = async (id: string) => {
    try {
        await deletePersona(id);
        toast({ title: '¡Persona Eliminada!', description: 'La persona ha sido eliminada correctamente.' });
        await refreshPersonas(search);
    } catch (error: any) {
        console.error("Error deleting persona:", error);
        toast({ title: 'Error al Eliminar', description: error.message || 'No se pudo eliminar la persona.', variant: 'destructive' });
    }
  }

  return (
    <>
        <Card>
        <CardHeader>
            <CardTitle>Repositorio de Personas</CardTitle>
            <CardDescription>
            Busque, cree y gestione el registro central de todas las personas en el sistema.
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
            {(user.role === 'superuser' || user.role === 'administrator') && (
              <Button onClick={() => handleOpenForm(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Persona
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
                    <TableHead>Fecha de Nacimiento</TableHead>
                    <TableHead>Género</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {personas.length > 0 ? (
                    personas.map((persona) => (
                        <TableRow key={persona.id}>
                        <TableCell className="font-medium">{persona.nombreCompleto}</TableCell>
                        <TableCell>{persona.cedula}</TableCell>
                        <TableCell>{format(persona.fechaNacimiento, 'PPP', { locale: es })}</TableCell>
                        <TableCell>{persona.genero}</TableCell>
                        <TableCell>{persona.email || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                        {(user.role === 'superuser' || user.role === 'administrator') && (
                            <AlertDialog>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menú</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleOpenForm(persona)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    <span>Editar</span>
                                    </DropdownMenuItem>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Eliminar</span>
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción no se puede deshacer. Esto eliminará permanentemente a la persona y todos sus roles asociados (titular, beneficiario) e historial clínico.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeletePersona(persona.id)} className="bg-destructive hover:bg-destructive/90">
                                            Sí, eliminar
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                        No se encontraron personas.
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
                    <DialogTitle>{selectedPersona ? 'Editar Persona' : 'Crear Nueva Persona'}</DialogTitle>
                </DialogHeader>
                <PersonForm
                    persona={selectedPersona}
                    onSubmitted={handleFormSubmitted}
                    onCancel={handleCloseDialog}
                />
            </DialogContent>
        </Dialog>
    </>
  );
}
