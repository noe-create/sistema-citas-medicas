

'use client';

import * as React from 'react';
import type { User, Role } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { getUsers, createUser, updateUser, deleteUser } from '@/actions/auth-actions';
import { useDebounce } from '@/hooks/use-debounce';
import { useUser } from './app-shell';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import { DataTable, type ColumnDef } from '../ui/data-table';

const UserForm = dynamic(() => import('./user-form').then(mod => mod.UserForm), {
    loading: () => <div className="p-8"><Skeleton className="h-48 w-full" /></div>,
});


interface UserManagementProps {
    roles: Role[];
}

const PAGE_SIZE = 20;

export function UserManagement({ roles }: UserManagementProps) {
  const { toast } = useToast();
  const currentUser = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [users, setUsers] = React.useState<(User & {roleName: string})[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  const refreshUsers = React.useCallback(async (currentSearch: string, page: number) => {
      setIsLoading(true);
      try {
        const { users: data, totalCount } = await getUsers(currentSearch, page, PAGE_SIZE);
        setUsers(data);
        setTotalCount(totalCount);
      } catch (error: any) {
        console.error("Error fetching users:", error);
        toast({ title: 'Error de Permiso', description: error.message || 'No se pudieron cargar los usuarios.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
  }, [toast]);
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  React.useEffect(() => {
    refreshUsers(debouncedSearch, currentPage);
  }, [debouncedSearch, currentPage, refreshUsers]);

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
      await refreshUsers(debouncedSearch, 1);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo guardar el usuario.', variant: 'destructive' });
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    try {
        await deleteUser(userId);
        toast({ title: '¡Usuario Eliminado!', description: 'El usuario ha sido eliminado.' });
        if (users.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        } else {
            await refreshUsers(debouncedSearch, currentPage);
        }
    } catch (error: any) {
        toast({ title: 'Error al Eliminar', description: error.message, variant: 'destructive' });
    }
  }
  
  const columns: ColumnDef<User & { roleName: string }>[] = [
    { accessorKey: 'username', header: 'Username', cell: ({ row }) => <div className="font-mono">{row.original.username}</div> },
    { accessorKey: 'name', header: 'Nombre Asociado', cell: ({ row }) => row.original.name || <span className="text-muted-foreground">N/A</span> },
    { accessorKey: 'roleName', header: 'Rol', cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.roleName}</Badge> },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="text-right">
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
          </div>
        );
      },
    },
  ];

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
          <DataTable
            columns={columns}
            data={users}
            isLoading={isLoading}
            pageCount={Math.ceil(totalCount / PAGE_SIZE)}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            emptyState={{
              icon: UserCog,
              title: "No se encontraron usuarios",
              description: "Puede crear el primer usuario usando el botón de arriba.",
            }}
          />
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={handleCloseDialog}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{selectedUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</DialogTitle>
                </DialogHeader>
                {isFormOpen && (
                    <UserForm
                        user={selectedUser}
                        roles={roles}
                        onSubmitted={handleFormSubmitted}
                        onCancel={handleCloseDialog}
                    />
                )}
            </DialogContent>
        </Dialog>
    </>
  );
}
