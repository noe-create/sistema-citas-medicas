

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import type { Persona } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { getPersonas, createPersona, updatePersona, deletePersona, bulkCreatePersonas } from '@/actions/patient-actions';
import { Loader2, MoreHorizontal, Pencil, PlusCircle, Trash2, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { PersonForm } from './person-form';
import { useUser } from './app-shell';
import * as XLSX from 'xlsx';

export function PeopleList() {
  const { toast } = useToast();
  const user = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUploading, setIsUploading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [personas, setPersonas] = React.useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const canManage = ['superuser', 'administrator', 'asistencial'].includes(user.role.id);
  
  const refreshPersonas = React.useCallback(async (currentSearch: string) => {
    setIsLoading(true);
      try {
        const data = await getPersonas(currentSearch);
        setPersonas(data);
      } catch (error) {
        console.error("Error al buscar personas:", error);
        toast({ title: 'Error', description: 'No se pudieron cargar las personas.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
  }, [toast]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      refreshPersonas(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, refreshPersonas]);

  const handleOpenForm = (persona: Persona | null) => {
    setSelectedPersona(persona);
    setIsFormOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedPersona(null);
  };

  const handleFormSubmitted = async (values: any) => {
    try {
      if (selectedPersona) {
        await updatePersona(selectedPersona.id, values);
        toast({ title: '¡Persona Actualizada!', description: `${values.primerNombre} ${values.primerApellido} ha sido guardado.` });
      } else {
        await createPersona(values);
        toast({ title: '¡Persona Creada!', description: `${values.primerNombre} ${values.primerApellido} ha sido añadida.` });
      }
      handleCloseDialog();
      await refreshPersonas(search);
    } catch (error: any) {
      console.error("Error saving persona:", error);
      toast({ title: 'Error', description: error.message || 'No se pudo guardar la persona.', variant: 'destructive' });
    }
  };
  
  const handleDeletePersona = async (id: string) => {
    try {
        await deletePersona(id);
        toast({ title: '¡Persona Eliminada!', description: 'La persona ha sido eliminada correctamente.' });
        await refreshPersonas(search);
    } catch (error: any) {
        console.error("Error deleting persona:", error);
        toast({ title: 'Error al Eliminar', description: error.message || 'No se pudo eliminar la persona.', variant: 'destructive' });
    }
  }

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
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const personasToImport = json
          .map((row) => {
            let fechaNacimiento;
            const fechaNacimientoRaw = row[8]; // Column I for Fecha de Nacimiento

            if (typeof fechaNacimientoRaw === 'number') {
                const utc_days  = Math.floor(fechaNacimientoRaw - 25569);
                const utc_value = utc_days * 86400;
                const date_info = new Date(utc_value * 1000);
                fechaNacimiento = new Date(Date.UTC(date_info.getUTCFullYear(), date_info.getUTCMonth(), date_info.getUTCDate())).toISOString();
            } else if (typeof fechaNacimientoRaw === 'string') {
                const dateString = fechaNacimientoRaw.trim();
                const parts = dateString.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
                if (parts) {
                    const day = parseInt(parts[1], 10);
                    const month = parseInt(parts[2], 10) - 1; // JS months are 0-indexed
                    const year = parseInt(parts[3], 10);
                    const parsedDate = new Date(Date.UTC(year, month, day));
                    if (parsedDate.getUTCFullYear() === year && parsedDate.getUTCMonth() === month && parsedDate.getUTCDate() === day) {
                        fechaNacimiento = parsedDate.toISOString();
                    }
                }
            }

            return {
                primerNombre: String(row[0] || ''),
                segundoNombre: String(row[1] || ''),
                primerApellido: String(row[2] || ''),
                segundoApellido: String(row[3] || ''),
                cedula: String(row[4] || ''), // Column E
                telefono1: String(row[5] || ''),
                telefono2: String(row[6] || ''),
                direccion: String(row[7] || ''),
                fechaNacimiento: fechaNacimiento, // Now ISO string or undefined
                genero: String(row[9] || ''), // Column J
            }
          })
          .filter(p => p.primerNombre && p.primerApellido && p.cedula && p.fechaNacimiento && p.genero);

        if (personasToImport.length === 0) {
          throw new Error('El archivo está vacío o no tiene el formato correcto (requiere las columnas obligatorias).');
        }

        const result = await bulkCreatePersonas(personasToImport as any);
        
        toast({
          title: '¡Importación Completada!',
          description: `${result.imported} personas fueron añadidas. ${result.skipped} duplicadas o con errores fueron ignoradas.`,
          variant: 'success'
        });

        if (result.errors.length > 0) {
            toast({
                title: `${result.errors.length} Errores de Importación`,
                description: result.errors.slice(0, 3).join(' '),
                variant: 'destructive',
            });
        }
        
        await refreshPersonas(search);

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
            <CardTitle>Repositorio de Personas</CardTitle>
            <CardDescription>
            Busque, cree y gestione el registro central de todas las personas en el sistema.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex justify-between items-center mb-4">
            <Input
                placeholder="Buscar por nombre, cédula o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
            />
             {canManage && (
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
                                <AlertDialogTitle>Formato para Importación</AlertDialogTitle>
                                <AlertDialogDescription asChild>
                                    <div className="text-left space-y-3 pt-2 text-sm">
                                        <p>Para una importación exitosa, su archivo CSV o Excel debe seguir este orden de columnas. No incluya una fila de encabezados.</p>
                                        <ul className="list-disc list-inside bg-muted/50 p-4 rounded-md border space-y-1">
                                            <li><strong className="font-semibold">Columna A:</strong> Primer Nombre (Texto, Requerido)</li>
                                            <li><strong className="font-semibold">Columna B:</strong> Segundo Nombre (Texto, Opcional)</li>
                                            <li><strong className="font-semibold">Columna C:</strong> Primer Apellido (Texto, Requerido)</li>
                                            <li><strong className="font-semibold">Columna D:</strong> Segundo Apellido (Texto, Opcional)</li>
                                            <li><strong className="font-semibold">Columna E:</strong> Cédula (Texto, Requerido). <strong>Importante:</strong> Debe incluir el prefijo de nacionalidad. Ejemplos: "V-12345678" o "E-87654321".</li>
                                            <li><strong className="font-semibold">Columna F:</strong> Teléfono 1 (Texto, Opcional, ej: 0212-5551234)</li>
                                            <li><strong className="font-semibold">Columna G:</strong> Teléfono 2 (Texto, Opcional, ej: 0414-1234567)</li>
                                            <li><strong className="font-semibold">Columna H:</strong> Dirección (Texto, Opcional)</li>
                                            <li><strong className="font-semibold">Columna I:</strong> Fecha de Nacimiento (Fecha, Requerido, formato: DD/MM/AAAA)</li>
                                            <li><strong className="font-semibold">Columna J:</strong> Género (Texto, Requerido, valores: 'Masculino', 'Femenino')</li>
                                        </ul>
                                        <p>El sistema ignorará automáticamente cualquier persona cuya cédula ya exista en la base de datos.</p>
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
                    <Button onClick={() => handleOpenForm(null)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Persona
                    </Button>
                </div>
            )}
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Fecha de Nacimiento</TableHead>
                    <TableHead>Género</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {personas.length > 0 ? (
                    personas.map((persona) => (
                        <TableRow key={persona.id}>
                        <TableCell className="font-medium">{persona.nombreCompleto}</TableCell>
                        <TableCell>{persona.cedula}</TableCell>
                        <TableCell>{format(persona.fechaNacimiento, 'PPP', { locale: es })}</TableCell>
                        <TableCell>{persona.genero}</TableCell>
                        <TableCell>{persona.email || 'N/A'}</TableCell>
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
                                    <DropdownMenuItem onClick={() => handleOpenForm(persona)}>
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
                                            Esta acción no se puede deshacer. Esto eliminará permanentemente a la persona y todos sus roles asociados (titular, beneficiario) e historial clínico.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeletePersona(persona.id)} className="bg-destructive hover:bg-destructive/90">
                                            Sí, eliminar
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                        No se encontraron personas.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            )}
        </CardContent>
        </Card>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{selectedPersona ? 'Editar Persona' : 'Crear Nueva Persona'}</DialogTitle>
                </DialogHeader>
                <PersonForm
                    persona={selectedPersona}
                    onSubmitted={handleFormSubmitted}
                    onCancel={handleCloseDialog}
                />
            </DialogContent>
        </Dialog>
    </>
  );
}
