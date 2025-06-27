'use client';

import * as React from 'react';
import type { User, Role } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Loader2, Pencil, Trash2 } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { getUsers, createUser, updateUser, deleteUser } from '@/actions/auth-actions';
import { useDebounce } from '@/hooks/use-debounce';
import { UserForm } from './user-form';
import { useUser } from './app-shell';

interface UserManagementProps {
    roles: Role[];
}

export function UserManagement({ roles }: UserManagementProps) {
  const { toast } = useToast();
  const currentUser = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [users, setUsers] = React.useState<(User & {roleName: string})[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const refreshUsers = React.useCallback(async (currentSearch: string) => {
      setIsLoading(true);
      try {
        const data = await getUsers(currentSearch);
        setUsers(data);
      } catch (error: any) {
        console.error("Error fetching users:", error);
        toast({ title: 'Error de Permiso', description: error.message || 'No se pudieron cargar los usuarios.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
  }, [toast]);

  React.useEffect(() => {
    refreshUsers(debouncedSearch);
  }, [debouncedSearch, refreshUsers]);

  const handleOpenForm = (user: User | null) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  const handleFormSubmitted = async (values: any) => {
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, values);
        toast({ title: '¡Usuario Actualizado!', description: `El usuario ${values.username} ha sido guardado.` });
      } else {
        await createUser(values);
        toast({ title: '¡Usuario Creado!', description: `El usuario ${values.username} ha sido añadido.` });
      }
      handleCloseDialog();
      await refreshUsers(debouncedSearch);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo guardar el usuario.', variant: 'destructive' });
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    try {
        await deleteUser(userId);
        toast({ title: '¡Usuario Eliminado!', description: 'El usuario ha sido eliminado.' });
        await refreshUsers(debouncedSearch);
    } catch (error: any) {
        toast({ title: 'Error al Eliminar', description: error.message, variant: 'destructive' });
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>
            Busque, añada y gestione los usuarios y sus roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Buscar por nombre de usuario o persona..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
             <Button onClick={() => handleOpenForm(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Usuario
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
                    <TableHead>Username</TableHead>
                    <TableHead>Nombre Asociado</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right w-[100px]">Acciones</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                    <TableCell className="font-mono">{user.username}</TableCell>
                    <TableCell>{user.name || <span className="text-muted-foreground">N/A</span>}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{user.roleName}</Badge></TableCell>
                    <TableCell className="text-right">
                        <AlertDialog>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={user.id === currentUser.id}>
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenForm(user)}>
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
                                        Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario y su acceso al sistema.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">
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
                        <TableCell colSpan={4} className="h-24 text-center">
                            No se encontraron usuarios.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{selectedUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</DialogTitle>
                </DialogHeader>
                <UserForm
                    user={selectedUser}
                    roles={roles}
                    onSubmitted={handleFormSubmitted}
                    onCancel={handleCloseDialog}
                 />
            </DialogContent>
        </Dialog>
    </>
  );
}
