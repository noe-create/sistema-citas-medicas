
'use client';

import * as React from 'react';
import type { Cie10Code } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Loader2, Pencil, Trash2, Download, Upload } from 'lucide-react';
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
import { getManagedCie10Codes, createCie10Code, updateCie10Code, deleteCie10Code, bulkCreateCie10Codes } from '@/actions/patient-actions';
import { Cie10Form } from './cie10-form';
import { useDebounce } from '@/hooks/use-debounce';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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

  const handleExportCsv = async () => {
    toast({ title: 'Generando archivo...', description: 'Exportando el catálogo completo.' });
    try {
      const allCodes = await getManagedCie10Codes(); // Fetch all codes, not just filtered ones
      if (allCodes.length === 0) {
        toast({ title: 'No hay datos para exportar', variant: 'destructive' });
        return;
      }

      const dataToExport = allCodes.map(row => ({
        'code': row.code,
        'description': row.description,
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([`\uFEFF${csvOutput}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
      saveAs(blob, 'Catalogo_CIE10.csv');
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({ title: 'Error de Exportación', description: 'No se pudo generar el archivo CSV.', variant: 'destructive' });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const dataArray: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const codesToImport = dataArray
          .map(row => ({
            code: row[0] ? String(row[0]).trim() : '',
            description: row[1] ? String(row[1]).trim() : '',
          }))
          .filter(row => row.code && row.description);

        if (codesToImport.length === 0) {
          throw new Error('El archivo CSV está vacío o no tiene el formato correcto (columna 1: código, columna 2: descripción).');
        }

        const result = await bulkCreateCie10Codes(codesToImport);
        
        toast({
          title: '¡Importación Exitosa!',
          description: `${result.imported} códigos fueron añadidos. ${result.skipped} duplicados fueron ignorados.`,
          variant: 'success'
        });

        await refreshCodes(debouncedSearch);
      } catch (error: any) {
        toast({
          title: 'Error de Importación',
          description: error.message || 'No se pudo procesar el archivo.',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsArrayBuffer(file);
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
                    onChange={handleFileChange}
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

                <Button variant="outline" onClick={handleExportCsv}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                </Button>
                <Button onClick={() => handleOpenForm(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Código
                </Button>
            </div>
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
