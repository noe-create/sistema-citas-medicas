

'use client';

import * as React from 'react';
import type { Role, Permission } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Loader2, Pencil, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { getRoles, createRole, updateRole, deleteRole, getAllPermissions, getRoleWithPermissions } from '@/actions/security-actions';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

const RoleForm = dynamic(() => import('./role-form').then(mod => mod.RoleForm), {
  loading: () => <div className="p-8"><Skeleton className="h-96 w-full" /></div>,
});


export function RoleManagement() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [permissions, setPermissions] = React.useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = React.useState<Role & { permissions?: string[] } | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const refreshData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([getRoles(), getAllPermissions()]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudieron cargar los datos de seguridad.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleOpenForm = async (role: Role | null) => {
    if (role) {
      const roleWithPerms = await getRoleWithPermissions(role.id);
      setSelectedRole(roleWithPerms);
    } else {
      setSelectedRole(null);
    }
    setIsFormOpen(true);
  };

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedRole(null);
  };

  const handleFormSubmitted = async (values: any) => {
    try {
      if (selectedRole) {
        await updateRole(selectedRole.id, values);
        toast({ title: '¡Rol Actualizado!', description: `El rol ${values.name} ha sido guardado.` });
      } else {
        await createRole(values);
        toast({ title: '¡Rol Creado!', description: `El rol ${values.name} ha sido añadido.` });
      }
      handleCloseDialog();
      await refreshData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteRole(roleId);
      toast({ title: '¡Rol Eliminado!', description: 'El rol ha sido eliminado.' });
      await refreshData();
    } catch (error: any) {
      toast({ title: 'Error al Eliminar', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Roles de Seguridad</CardTitle>
          <CardDescription>Cree y gestione los grupos de permisos para los usuarios del sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end items-center mb-4">
            <Button onClick={() => handleOpenForm(null)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Rol
            </Button>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : roles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Rol</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {roles.map((role) => (
                      <motion.tr 
                        key={role.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                      >
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={role.name === 'Superusuario'}>
                                  <span className="sr-only">Abrir menú</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenForm(role)}>
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
                                  Esta acción no se puede deshacer. Se eliminará permanentemente el rol. No podrá eliminar roles que estén actualmente en uso.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteRole(role.id)} className="bg-destructive hover:bg-destructive/90">
                                  Sí, eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground bg-card rounded-md border border-dashed">
                <Shield className="h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold">No se han encontrado roles</h3>
                <p className="text-sm">Puede crear el primer rol de seguridad usando el botón de arriba.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedRole ? 'Editar Rol' : 'Crear Nuevo Rol'}</DialogTitle>
          </DialogHeader>
          {isFormOpen && (
            <RoleForm
              role={selectedRole}
              allPermissions={permissions}
              onSubmitted={handleFormSubmitted}
              onCancel={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
