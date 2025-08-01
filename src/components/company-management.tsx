

'use client';

import * as React from 'react';
import type { Empresa } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { getEmpresas, createEmpresa, updateEmpresa, deleteEmpresa } from '@/actions/patient-actions';
import { useUser } from './app-shell';
import { useDebounce } from '@/hooks/use-debounce';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';

const CompanyForm = dynamic(() => import('./company-form').then(mod => mod.CompanyForm), {
  loading: () => <div className="p-8"><Skeleton className="h-48 w-full" /></div>,
});


const PAGE_SIZE = 10;

export function CompanyManagement() {
  const { toast } = useToast();
  const user = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [empresas, setEmpresas] = React.useState<Empresa[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = React.useState<Empresa | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  const canCreate = user.role.id === 'superuser' || user.role.id === 'administrator';
  
  const refreshEmpresas = React.useCallback(async (currentSearch: string, page: number) => {
    setIsLoading(true);
      try {
        const { empresas: empresasData, totalCount: count } = await getEmpresas(currentSearch, page, PAGE_SIZE);
        setEmpresas(empresasData);
        setTotalCount(count);
      } catch (error) {
        console.error("Error al cargar las empresas:", error);
        toast({
            title: 'Error',
            description: 'No se pudieron cargar las empresas. Por favor, intente de nuevo.',
            variant: 'destructive'
        })
      } finally {
        setIsLoading(false);
      }
  }, [toast]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  React.useEffect(() => {
    refreshEmpresas(debouncedSearch, currentPage);
  }, [debouncedSearch, currentPage, refreshEmpresas]);

  const handleOpenForm = (empresa: Empresa | null) => {
    setSelectedEmpresa(empresa);
    setIsFormOpen(true);
  };

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedEmpresa(null);
  };

  const handleFormSubmitted = async (values: any) => {
    try {
      if (selectedEmpresa) {
        const updated = await updateEmpresa({ ...values, id: selectedEmpresa.id });
        toast({ title: '¡Empresa Actualizada!', description: `${updated.name} ha sido guardada.` });
      } else {
        const created = await createEmpresa(values);
        toast({ title: '¡Empresa Creada!', description: `${created.name} ha sido añadida.` });
      }
      handleCloseDialog();
      await refreshEmpresas(search, 1);
    } catch (error: any) {
      console.error("Error al guardar empresa:", error);
      toast({ title: 'Error', description: error.message || 'No se pudo guardar la empresa.', variant: 'destructive' });
    }
  };
  
  const handleDeleteEmpresa = async (id: string) => {
    try {
        await deleteEmpresa(id);
        toast({ title: '¡Empresa Eliminada!', description: 'La empresa ha sido eliminada correctamente.' });
        if (empresas.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        } else {
            await refreshEmpresas(search, currentPage);
        }
    } catch (error: any) {
        console.error("Error al eliminar empresa:", error);
        toast({ title: 'Error al Eliminar', description: error.message || 'No se pudo eliminar la empresa.', variant: 'destructive' });
    }
  }

  const columns: ColumnDef<Empresa>[] = [
      { accessorKey: "name", header: "Nombre", cell: ({ row }) => <div className="font-medium">{row.original.name}</div> },
      { accessorKey: "rif", header: "RIF" },
      { accessorKey: "telefono", header: "Teléfono" },
      { accessorKey: "direccion", header: "Dirección", cell: ({ row }) => <div className="max-w-xs truncate">{row.original.direccion}</div> },
      {
          id: "actions",
          cell: ({ row }) => {
              const empresa = row.original;
              if (!canCreate) return null;
              return (
                  <div className="text-right">
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
                              <DropdownMenuItem onClick={() => handleOpenForm(empresa)}>
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
                                      Esta acción no se puede deshacer. Esto eliminará permanentemente la empresa.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteEmpresa(empresa.id)} className="bg-destructive hover:bg-destructive/90">
                                      Sí, eliminar
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  </div>
              )
          }
      }
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Empresas</CardTitle>
          <CardDescription>
            Busque, añada y gestione las empresas afiliadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Buscar por nombre o RIF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            {canCreate && (
              <Button onClick={() => handleOpenForm(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Empresa
              </Button>
            )}
          </div>
            <DataTable
                columns={columns}
                data={empresas}
                isLoading={isLoading}
                pageCount={Math.ceil(totalCount / PAGE_SIZE)}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                emptyState={{
                    icon: Building2,
                    title: "No se han encontrado empresas",
                    description: "Puede crear la primera empresa usando el botón de arriba.",
                }}
            />
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={handleCloseDialog}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{selectedEmpresa ? 'Editar Empresa' : 'Crear Nueva Empresa'}</DialogTitle>
                </DialogHeader>
                {isFormOpen && (
                    <CompanyForm
                        empresa={selectedEmpresa}
                        onSubmitted={handleFormSubmitted}
                        onCancel={handleCloseDialog}
                    />
                )}
            </DialogContent>
        </Dialog>
    </>
  );
}
