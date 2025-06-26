'use client';

import * as React from 'react';
import type { Cie10Code } from '@/lib/types';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { getManagedCie10Codes, createCie10Code, updateCie10Code, deleteCie10Code } from '@/actions/patient-actions';
import { Cie10Form } from './cie10-form';
import { useDebounce } from '@/hooks/use-debounce';

export function Cie10Management() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [codes, setCodes] = React.useState<Cie10Code[]>([]);
  const [selectedCode, setSelectedCode] = React.useState<Cie10Code | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const refreshCodes = React.useCallback(async (currentSearch: string) => {
      setIsLoading(true);
      try {
        const data = await getManagedCie10Codes(currentSearch);
        setCodes(data);
      } catch (error) {
        console.error("Error fetching CIE-10 codes:", error);
        toast({ title: 'Error', description: 'No se pudieron cargar los códigos CIE-10.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
  }, [toast]);

  React.useEffect(() => {
    refreshCodes(debouncedSearch);
  }, [debouncedSearch, refreshCodes]);

  const handleOpenForm = (code: Cie10Code | null) => {
    setSelectedCode(code);
    setIsFormOpen(true);
  };

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedCode(null);
  };

  const handleFormSubmitted = async (values: Cie10Code) => {
    try {
      if (selectedCode) {
        await updateCie10Code(selectedCode.code, { description: values.description });
        toast({ title: '¡Código Actualizado!', description: `El código ${values.code} ha sido guardado.` });
      } else {
        await createCie10Code(values);
        toast({ title: '¡Código Creado!', description: `El código ${values.code} ha sido añadido.` });
      }
      handleCloseDialog();
      await refreshCodes(debouncedSearch);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo guardar el código.', variant: 'destructive' });
    }
  };
  
  const handleDeleteCode = async (code: string) => {
    try {
        await deleteCie10Code(code);
        toast({ title: '¡Código Eliminado!', description: 'El código CIE-10 ha sido eliminado.' });
        await refreshCodes(debouncedSearch);
    } catch (error: any) {
        toast({ title: 'Error al Eliminar', description: error.message, variant: 'destructive' });
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Códigos CIE-10</CardTitle>
          <CardDescription>
            Busque, añada y gestione el catálogo de códigos de diagnóstico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Buscar por código o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
             <Button onClick={() => handleOpenForm(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Código
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
                    <TableHead className="w-[120px]">Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right w-[100px]">Acciones</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {codes.length > 0 ? (
                  codes.map((code) => (
                    <TableRow key={code.code}>
                    <TableCell className="font-mono font-semibold">{code.code}</TableCell>
                    <TableCell>{code.description}</TableCell>
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
                                <DropdownMenuItem onClick={() => handleOpenForm(code)}>
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
                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el código CIE-10 del catálogo. No podrá eliminar códigos que estén actualmente en uso.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteCode(code.code)} className="bg-destructive hover:bg-destructive/90">
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
                        <TableCell colSpan={3} className="h-24 text-center">
                            No se encontraron códigos. Pruebe a crear uno nuevo.
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
                    <DialogTitle>{selectedCode ? 'Editar Código CIE-10' : 'Crear Nuevo Código CIE-10'}</DialogTitle>
                </DialogHeader>
                <Cie10Form
                    cie10Code={selectedCode}
                    onSubmitted={handleFormSubmitted}
                    onCancel={handleCloseDialog}
                 />
            </DialogContent>
        </Dialog>
    </>
  );
}
