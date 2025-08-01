'use client';

import * as React from 'react';
import type { Titular, Empresa } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Loader2, Pencil, Users, Trash2 } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { useUser } from './app-shell';
import { motion, AnimatePresence } from 'framer-motion';

const titularTypeMap: Record<string, string> = {
  internal_employee: 'Empleado Interno',
  corporate_affiliate: 'Afiliado Corporativo',
  private: 'Privado',
};

export function PatientManagement() {
  const { toast } = useToast();
  const router = useRouter();
  const user = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [titulares, setTitulares] = React.useState<Titular[]>([]);
  const [empresas, setEmpresas] = React.useState<Empresa[]>([]);
  const [selectedTitular, setSelectedTitular] = React.useState<Titular | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const canManage = ['superuser', 'administrator', 'asistencial'].includes(user.role.id);

  const refreshTitulares = React.useCallback(async (currentSearch: string) => {
    setIsLoading(true);
    try {
        const titularesData = await getTitulares(currentSearch);
        setTitulares(titularesData.map(t => ({...t, persona: { ...t.persona, fechaNacimiento: new Date(t.persona.fechaNacimiento) }})));
    } catch (error) {
        console.error("Error al buscar titulares:", error);
        toast({ title: 'Error de Búsqueda', description: 'No se pudieron buscar los titulares.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  // Fetch empresas once for the form dropdown
  React.useEffect(() => {
    async function fetchEmpresasData() {
        try {
            const empresasData = await getEmpresas();
            setEmpresas(empresasData);
        } catch (error) {
            console.error("Error al cargar las empresas:", error);
            toast({ title: 'Error', description: 'No se pudieron cargar las empresas para el formulario.', variant: 'destructive' });
        }
    }
    fetchEmpresasData();
  }, [toast]);
  
  // Fetch titulares based on search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
        refreshTitulares(search);
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [search, refreshTitulares]);

  const handleOpenForm = (titular: Titular | null) => {
    setSelectedTitular(titular);
    setIsFormOpen(true);
  };

  const handleFormSubmitted = async (arg1: any, arg2?: string, arg3?: any) => {
    try {
      if (selectedTitular) { // Editing
        await updateTitular(arg1, arg2!, arg3);
        toast({ title: '¡Titular Actualizado!', description: `${arg3.nombreCompleto} ha sido guardado.` });
      } else { // Creating
        await createTitular(arg1);
        const personaName = arg1.persona ? arg1.persona.nombreCompleto : 'La persona seleccionada';
        toast({ title: '¡Rol de Titular Creado!', description: `${personaName} ahora es titular.` });
      }
      handleCloseDialog();
      await refreshTitulares(search);
    } catch (error: any) {
      console.error("Error al guardar titular:", error);
      toast({ title: 'Error', description: error.message || 'No se pudo guardar el titular. Verifique que la cédula o email no estén duplicados.', variant: 'destructive' });
    }
  };
  
  const handleDeleteTitular = async (id: string) => {
    try {
        await deleteTitular(id);
        toast({ title: '¡Rol de Titular Eliminado!', description: 'El rol de titular ha sido eliminado.' });
        await refreshTitulares(search);
    } catch (error: any) {
        console.error("Error al eliminar titular:", error);
        toast({ title: 'Error', description: 'No se pudo eliminar el rol de titular.', variant: 'destructive' });
    }
  }

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedTitular(null);
  }

  const excludeIds = titulares.map(t => t.personaId);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Titulares</CardTitle>
          <CardDescription>
            Busque por nombre, cédula o empresa. Añada y gestione los perfiles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Buscar por nombre, cédula o empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            {canManage && (
              <Button onClick={() => handleOpenForm(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Titular
              </Button>
            )}
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : titulares.length > 0 ? (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo / Empresa</TableHead>
                    <TableHead>Benef.</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
                </TableHeader>
                <motion.tbody>
                  <AnimatePresence>
                    {titulares.map((titular) => (
                        <motion.tr 
                          key={titular.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                        >
                        <TableCell className="font-medium">{titular.persona.nombreCompleto}</TableCell>
                        <TableCell>{titular.persona.cedula}</TableCell>
                        <TableCell>{titular.persona.email}</TableCell>
                        <TableCell>
                            <Badge variant="secondary">{titularTypeMap[titular.tipo]}</Badge>
                            {titular.tipo === 'corporate_affiliate' && titular.empresaName && (
                                <div className="text-xs text-muted-foreground">{titular.empresaName}</div>
                            )}
                        </TableCell>
                        <TableCell className="text-center">{titular.beneficiariosCount}</TableCell>
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
                                    {canManage && (
                                        <DropdownMenuItem onClick={() => handleOpenForm(titular)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        <span>Editar</span>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/pacientes/${titular.id}/beneficiarios`)}>
                                      <Users className="mr-2 h-4 w-4" />
                                      <span>Gestionar Beneficiarios</span>
                                    </DropdownMenuItem>
                                    {canManage && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Eliminar</span>
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                        </>
                                    )}
                                </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción no se puede deshacer. Esto eliminará permanentemente el rol de titular para esta persona y todos sus beneficiarios asociados. La persona no será eliminada del sistema.
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
                        </motion.tr>
                    ))}
                  </AnimatePresence>
                </motion.tbody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground bg-card rounded-md border border-dashed">
                <Users className="h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold">No se encontraron titulares</h3>
                <p className="text-sm">Puede crear un nuevo titular usando el botón de arriba.</p>
            </div>
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
                    excludeIds={excludeIds}
                 />
            </DialogContent>
        </Dialog>
    </>
  );
}
