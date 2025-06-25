'use client';

import * as React from 'react';
import type { Titular, Empresa } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from './ui/badge';
import { PatientForm } from './patient-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { getTitulares, getEmpresas, createTitular, updateTitular, deleteTitular } from '@/actions/patient-actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

const titularTypeMap: Record<string, string> = {
  internal_employee: 'Empleado Interno',
  corporate_affiliate: 'Afiliado Corporativo',
  private: 'Privado',
};

export function PatientManagement() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [titulares, setTitulares] = React.useState<Titular[]>([]);
  const [empresas, setEmpresas] = React.useState<Empresa[]>([]);
  const [selectedTitular, setSelectedTitular] = React.useState<Titular | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  React.useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [titularesData, empresasData] = await Promise.all([getTitulares(), getEmpresas()]);
        setTitulares(titularesData);
        setEmpresas(empresasData);
      } catch (error) {
        console.error("Error al cargar los datos:", error);
        toast({
            title: 'Error',
            description: 'No se pudieron cargar los datos. Por favor, intente de nuevo.',
            variant: 'destructive'
        })
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const filteredTitulares = titulares.filter(
    (titular) =>
      titular.nombreCompleto.toLowerCase().includes(search.toLowerCase()) ||
      titular.cedula.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenForm = (titular: Titular | null) => {
    setSelectedTitular(titular);
    setIsFormOpen(true);
  };

  const handleFormSubmitted = async (values: any) => {
    try {
      if (selectedTitular) {
        const updated = await updateTitular({ ...values, id: selectedTitular.id });
        setTitulares(titulares.map((t) => (t.id === updated.id ? updated : t)));
        toast({ title: '¡Titular Actualizado!', description: `${updated.nombreCompleto} ha sido guardado.` });
      } else {
        const created = await createTitular(values);
        setTitulares([...titulares, created]);
        toast({ title: '¡Titular Creado!', description: `${created.nombreCompleto} ha sido añadido.` });
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Error al guardar titular:", error);
      toast({ title: 'Error', description: 'No se pudo guardar el titular.', variant: 'destructive' });
    }
  };
  
  const handleDeleteTitular = async (id: string) => {
    try {
        await deleteTitular(id);
        setTitulares(titulares.filter(t => t.id !== id));
        toast({ title: '¡Titular Eliminado!', description: 'El titular ha sido eliminado correctamente.' });
    } catch (error) {
        console.error("Error al eliminar titular:", error);
        toast({ title: 'Error', description: 'No se pudo eliminar el titular.', variant: 'destructive' });
    }
  }

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedTitular(null);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Titulares</CardTitle>
          <CardDescription>
            Busque, añada y gestione los perfiles de los titulares.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Buscar por nombre o cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
             <Button onClick={() => handleOpenForm(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Titular
              </Button>
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
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Beneficiarios</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredTitulares.map((titular) => (
                    <TableRow key={titular.id}>
                    <TableCell className="font-medium">{titular.nombreCompleto}</TableCell>
                    <TableCell>{titular.cedula}</TableCell>
                    <TableCell>{titular.email}</TableCell>
                    <TableCell>
                        <Badge variant="secondary">{titularTypeMap[titular.tipo]}</Badge>
                    </TableCell>
                    <TableCell>{titular.beneficiarios.length}</TableCell>
                    <TableCell className="text-right">
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
                                <DropdownMenuItem onClick={() => handleOpenForm(titular)}>
                                Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem>Gestionar Beneficiarios</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                        Eliminar
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Esto eliminará permanentemente al titular
                                        y todos sus datos asociados de nuestros servidores.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteTitular(titular.id)} className="bg-destructive hover:bg-destructive/90">
                                        Sí, eliminar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{selectedTitular ? 'Editar Titular' : 'Crear Nuevo Titular'}</DialogTitle>
                </DialogHeader>
                <PatientForm
                    titular={selectedTitular}
                    empresas={empresas}
                    onSubmitted={handleFormSubmitted}
                    onCancel={handleCloseDialog}
                 />
            </DialogContent>
        </Dialog>
    </>
  );
}
