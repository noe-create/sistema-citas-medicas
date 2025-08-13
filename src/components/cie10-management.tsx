

'use client';

import * as React from 'react';
import type { Cie10Code } from '@/lib/types';
import { PlusCircle, Download, Upload, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { getManagedCie10Codes, createCie10Code, updateCie10Code, deleteCie10Code, bulkCreateCie10Codes } from '@/actions/patient-actions';
import { useDebounce } from '@/hooks/use-debounce';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

const Cie10Form = dynamic(() => import('./cie10-form').then(mod => mod.Cie10Form), {
  loading: () => <div className="p-8"><Skeleton className="h-48 w-full" /></div>,
});


const PAGE_SIZE = 15;

export function Cie10Management() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUploading, setIsUploading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [codes, setCodes] = React.useState<Cie10Code[]>([]);
  const [selectedCode, setSelectedCode] = React.useState<Cie10Code | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  const refreshCodes = React.useCallback(async (currentSearch: string, page: number) => {
      setIsLoading(true);
      try {
        const { codes: data, totalCount: count } = await getManagedCie10Codes(currentSearch, page, PAGE_SIZE);
        setCodes(data);
        setTotalCount(count);
      } catch (error) {
        console.error("Error fetching CIE-10 codes:", error);
        toast({ title: 'Error', description: 'No se pudieron cargar los códigos CIE-10.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
  }, [toast]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  React.useEffect(() => {
    refreshCodes(debouncedSearch, currentPage);
  }, [debouncedSearch, currentPage, refreshCodes]);

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
      await refreshCodes(debouncedSearch, currentPage);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo guardar el código.', variant: 'destructive' });
    }
  };
  
  const handleDeleteCode = async (code: string) => {
    try {
        await deleteCie10Code(code);
        toast({ title: '¡Código Eliminado!', description: 'El código CIE-10 ha sido eliminado.' });
        if (codes.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        } else {
            await refreshCodes(debouncedSearch, currentPage);
        }
    } catch (error: any) {
        toast({ title: 'Error al Eliminar', description: error.message, variant: 'destructive' });
    }
  }

  const columns: ColumnDef<Cie10Code>[] = [
      {
        accessorKey: "code",
        header: "Código",
        cell: ({ row }) => <div className="font-mono font-semibold">{row.original.code}</div>,
      },
      {
        accessorKey: "description",
        header: "Descripción",
      },
      {
        id: "actions",
        cell: ({ row }) => {
            const code = row.original;
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
              </div>
            )
        }
      }
  ];

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

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
            <div className="flex gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="hidden"
                />
                
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" disabled={isUploading}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Importar
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Formato para Importación CSV</AlertDialogTitle>
                            <AlertDialogDescription asChild>
                               <div className="text-left space-y-3 pt-2">
                                <p>Para asegurar una importación exitosa, su archivo CSV o Excel debe tener la siguiente estructura:</p>
                                <ul className="list-disc list-inside text-sm bg-muted/50 p-4 rounded-md space-y-1 border">
                                    <li>Debe contener exactamente <strong>dos columnas</strong>.</li>
                                    <li><strong>Columna 1:</strong> El Código CIE-10 (ej. J00).</li>
                                    <li><strong>Columna 2:</strong> La Descripción completa del código.</li>
                                    <li>No incluya una fila de encabezado (títulos de columna).</li>
                                </ul>
                                <p>El sistema ignorará automáticamente cualquier código que ya exista en la base de datos para evitar duplicados.</p>
                               </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleImportClick}>
                                Continuar e Importar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                </Button>
                <Button onClick={() => handleOpenForm(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Código
                </Button>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={codes}
            isLoading={isLoading}
            pageCount={Math.ceil(totalCount / PAGE_SIZE)}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            emptyState={{
              icon: Code2,
              title: "No se encontraron códigos CIE-10",
              description: "Puede añadir el primer código manualmente o importar un catálogo.",
            }}
          />
        </CardContent>
      </Card>
      
       <Dialog open={isFormOpen} onOpenChange={handleCloseDialog}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{selectedCode ? 'Editar Código CIE-10' : 'Crear Nuevo Código CIE-10'}</DialogTitle>
                </DialogHeader>
                {isFormOpen && (
                    <Cie10Form
                        cie10Code={selectedCode}
                        onSubmitted={handleFormSubmitted}
                        onCancel={handleCloseDialog}
                     />
                )}
            </DialogContent>
        </Dialog>
    </>
  );
}
