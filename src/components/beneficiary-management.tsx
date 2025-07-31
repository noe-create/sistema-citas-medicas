
'use client';

import * as React from 'react';
import type { Beneficiario, Titular } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Loader2, Pencil, Trash2, Users } from 'lucide-react';
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
import { createBeneficiario, updateBeneficiario, deleteBeneficiario, getBeneficiarios } from '@/actions/patient-actions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUser } from './app-shell';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

const BeneficiaryForm = dynamic(() => import('./beneficiary-form').then(mod => mod.BeneficiaryForm), {
  loading: () => <div className="p-8"><Skeleton className="h-48 w-full" /></div>,
});


interface BeneficiaryManagementProps {
  titular: Titular;
  initialBeneficiarios: Beneficiario[];
}

export function BeneficiaryManagement({ titular, initialBeneficiarios }: BeneficiaryManagementProps) {
  const { toast } = useToast();
  const user = useUser();
  const [beneficiarios, setBeneficiarios] = React.useState<Beneficiario[]>(
    initialBeneficiarios.map(b => ({...b, persona: { ...b.persona, fechaNacimiento: new Date(b.persona.fechaNacimiento)}}))
  );
  const [selectedBeneficiario, setSelectedBeneficiario] = React.useState<Beneficiario | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const canManage = ['superuser', 'administrator', 'asistencial'].includes(user.role.id);

  const refreshBeneficiarios = async () => {
    const freshData = await getBeneficiarios(titular.id);
    setBeneficiarios(freshData.map(b => ({...b, persona: { ...b.persona, fechaNacimiento: new Date(b.persona.fechaNacimiento)}})));
  }

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
        await updateBeneficiario(selectedBeneficiario.id, selectedBeneficiario.personaId, values.persona);
        toast({ title: '¡Beneficiario Actualizado!', description: `${values.persona.primerNombre} ${values.persona.primerApellido} ha sido guardado.` });
      } else {
        await createBeneficiario(titular.id, values);
        const personaName = values.persona ? `${values.persona.primerNombre} ${values.persona.primerApellido}` : 'La persona seleccionada';
        toast({ title: '¡Beneficiario Creado!', description: `${personaName} ha sido añadido.` });
      }
      handleCloseDialog();
      await refreshBeneficiarios();
    } catch (error: any) {
      console.error("Error al guardar beneficiario:", error);
      toast({ title: 'Error', description: error.message || 'No se pudo guardar el beneficiario.', variant: 'destructive' });
    }
  };

  const handleDeleteBeneficiario = async (id: string) => {
    try {
      await deleteBeneficiario(id);
      toast({ title: '¡Beneficiario Eliminado!', description: 'El beneficiario ha sido eliminado correctamente.' });
      await refreshBeneficiarios();
    } catch (error: any) {
      console.error("Error al eliminar beneficiario:", error);
      toast({ title: 'Error', description: error.message || 'No se pudo eliminar el beneficiario.', variant: 'destructive' });
    }
  };

  const excludeIds = [titular.personaId, ...beneficiarios.map(b => b.personaId)];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Beneficiarios</CardTitle>
          <CardDescription>Añada y gestione los beneficiarios asociados a este titular.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end items-center mb-4">
            {canManage && (
              <Button onClick={() => handleOpenForm(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Beneficiario
              </Button>
            )}
          </div>
          {beneficiarios.length > 0 ? (
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
                <motion.tbody>
                  <AnimatePresence>
                    {beneficiarios.map((beneficiario) => (
                    <motion.tr 
                      key={beneficiario.id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                    >
                        <TableCell className="font-medium">{beneficiario.persona.nombreCompleto}</TableCell>
                        <TableCell>{beneficiario.persona.cedula}</TableCell>
                        <TableCell>{format(beneficiario.persona.fechaNacimiento, 'PPP', { locale: es })}</TableCell>
                        <TableCell>{beneficiario.persona.genero}</TableCell>
                        <TableCell className="text-right">
                        {canManage && (
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
                                    <Pencil className="mr-2 h-4 w-4" />
                                    <span>Editar</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
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
                                        Esta acción no se puede deshacer. Esto eliminará la relación de beneficiario, pero no eliminará a la persona del sistema.
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
                        )}
                        </TableCell>
                    </motion.tr>
                    ))}
                  </AnimatePresence>
                </motion.tbody>
            </Table>
          ) : (
             <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground bg-card rounded-md border border-dashed">
                <Users className="h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold">Este titular no tiene beneficiarios</h3>
                <p className="text-sm">Puede añadir el primer beneficiario usando el botón de arriba.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedBeneficiario ? 'Editar Beneficiario' : 'Crear Nuevo Beneficiario'}</DialogTitle>
          </DialogHeader>
          {isFormOpen && (
            <BeneficiaryForm
                beneficiario={selectedBeneficiario}
                onSubmitted={handleFormSubmitted}
                onCancel={handleCloseDialog}
                excludeIds={excludeIds}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
