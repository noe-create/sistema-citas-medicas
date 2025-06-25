'use client';

import * as React from 'react';
import type { Beneficiario, Titular } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { BeneficiaryForm } from './beneficiary-form';
import { createBeneficiario, updateBeneficiario, deleteBeneficiario } from '@/actions/patient-actions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BeneficiaryManagementProps {
  titular: Titular;
  initialBeneficiarios: Beneficiario[];
}

export function BeneficiaryManagement({ titular, initialBeneficiarios }: BeneficiaryManagementProps) {
  const { toast } = useToast();
  const [beneficiarios, setBeneficiarios] = React.useState<Beneficiario[]>(initialBeneficiarios);
  const [selectedBeneficiario, setSelectedBeneficiario] = React.useState<Beneficiario | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const handleOpenForm = (beneficiario: Beneficiario | null) => {
    setSelectedBeneficiario(beneficiario);
    setIsFormOpen(true);
  };

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedBeneficiario(null);
  };

  const handleFormSubmitted = async (values: any) => {
    try {
      if (selectedBeneficiario) {
        const updated = await updateBeneficiario({ ...values, id: selectedBeneficiario.id });
        setBeneficiarios(beneficiarios.map((b) => (b.id === updated.id ? updated : b)));
        toast({ title: '¡Beneficiario Actualizado!', description: `${updated.nombreCompleto} ha sido guardado.` });
      } else {
        const created = await createBeneficiario(values, titular.id);
        setBeneficiarios([...beneficiarios, created]);
        toast({ title: '¡Beneficiario Creado!', description: `${created.nombreCompleto} ha sido añadido.` });
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Error al guardar beneficiario:", error);
      toast({ title: 'Error', description: 'No se pudo guardar el beneficiario.', variant: 'destructive' });
    }
  };

  const handleDeleteBeneficiario = async (id: string) => {
    try {
      await deleteBeneficiario(id);
      setBeneficiarios(beneficiarios.filter(b => b.id !== id));
      toast({ title: '¡Beneficiario Eliminado!', description: 'El beneficiario ha sido eliminado correctamente.' });
    } catch (error) {
      console.error("Error al eliminar beneficiario:", error);
      toast({ title: 'Error', description: 'No se pudo eliminar el beneficiario.', variant: 'destructive' });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Beneficiarios</CardTitle>
          <CardDescription>Añada y gestione los beneficiarios asociados a este titular.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end items-center mb-4">
            <Button onClick={() => handleOpenForm(null)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Beneficiario
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Fecha de Nacimiento</TableHead>
                <TableHead>Género</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beneficiarios.length > 0 ? (
                beneficiarios.map((beneficiario) => (
                  <TableRow key={beneficiario.id}>
                    <TableCell className="font-medium">{beneficiario.nombreCompleto}</TableCell>
                    <TableCell>{beneficiario.cedula}</TableCell>
                    <TableCell>{format(beneficiario.fechaNacimiento, 'PPP', { locale: es })}</TableCell>
                    <TableCell>{beneficiario.genero}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleOpenForm(beneficiario)}>
                              Editar
                            </DropdownMenuItem>
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
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente al beneficiario.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteBeneficiario(beneficiario.id)} className="bg-destructive hover:bg-destructive/90">
                                    Sí, eliminar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No se encontraron beneficiarios.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedBeneficiario ? 'Editar Beneficiario' : 'Crear Nuevo Beneficiario'}</DialogTitle>
          </DialogHeader>
          <BeneficiaryForm
            beneficiario={selectedBeneficiario}
            onSubmitted={handleFormSubmitted}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
