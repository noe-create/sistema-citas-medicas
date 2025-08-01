

'use client';

import * as React from 'react';
import type { Persona } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { getPersonas, createPersona, updatePersona, deletePersona, bulkCreatePersonas } from '@/actions/patient-actions';
import { MoreHorizontal, Pencil, PlusCircle, Trash2, Upload, Contact } from 'lucide-react';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useUser } from './app-shell';
import * as XLSX from 'xlsx';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { useDebounce } from '@/hooks/use-debounce';

const PersonForm = dynamic(() => import('./person-form').then(mod => mod.PersonForm), {
  loading: () => <div className="p-8"><Skeleton className="h-48 w-full" /></div>,
});


const PAGE_SIZE = 20;

export function PeopleList() {
  const { toast } = useToast();
  const user = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUploading, setIsUploading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [personas, setPersonas] = React.useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  const canManage = ['superuser', 'administrator', 'asistencial'].includes(user.role.id);
  
  const refreshPersonas = React.useCallback(async (currentSearch: string, page: number) => {
    setIsLoading(true);
      try {
        const { personas: data, totalCount: count } = await getPersonas(currentSearch, page, PAGE_SIZE);
        setPersonas(data);
        setTotalCount(count);
      } catch (error: any) {
        console.error("Error al buscar personas:", error);
        toast({ title: 'Error', description: 'No se pudieron cargar las personas.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
  }, [toast]);
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  React.useEffect(() => {
    refreshPersonas(debouncedSearch, currentPage);
  }, [debouncedSearch, currentPage, refreshPersonas]);

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
      await refreshPersonas(search, 1); // Go to first page after creation/update
    } catch (error: any) {
      console.error("Error saving persona:", error);
      toast({ title: 'Error', description: error.message || 'No se pudo guardar la persona.', variant: 'destructive' });
    }
  };
  
  const handleDeletePersona = async (id: string) => {
    try {
        await deletePersona(id);
        toast({ title: '¡Persona Eliminada!', description: 'La persona ha sido eliminada correctamente.' });
        if (personas.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        } else {
            await refreshPersonas(search, currentPage);
        }
    } catch (error: any) {
        console.error("Error deleting persona:", error);
        toast({ title: 'Error al Eliminar', description: error.message || 'No se pudo eliminar la persona.', variant: 'destructive' });
    }
  }
  
  const columns: ColumnDef<Persona>[] = [
      { accessorKey: "nombreCompleto", header: "Nombre Completo", cell: ({ row }) => <div className="font-medium">{row.original.nombreCompleto}</div> },
      { accessorKey: "cedula", header: "Cédula" },
      { accessorKey: "fechaNacimiento", header: "Fecha de Nacimiento", cell: ({ row }) => format(new Date(row.original.fechaNacimiento), 'PPP', { locale: es }) },
      { accessorKey: "genero", header: "Género" },
      { accessorKey: "email", header: "Email", cell: ({ row }) => row.original.email || 'N/A' },
      {
          id: "actions",
          cell: ({ row }) => {
              const persona = row.original;
              if (!canManage) return null;
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
                  </div>
              )
          }
      }
  ];

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //...
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
                                {isUploading ? <Skeleton className="h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
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
                                            <li><strong className="font-semibold">Columna J:</strong> Género (Texto, Requerido, valores: 'Masculino' o 'Femenino')</li>
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
             <DataTable
                columns={columns}
                data={personas}
                isLoading={isLoading}
                pageCount={Math.ceil(totalCount / PAGE_SIZE)}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                emptyState={{
                    icon: Contact,
                    title: "No se han encontrado personas",
                    description: "Puede crear la primera persona usando el botón de arriba.",
                }}
            />
        </CardContent>
        </Card>

        <Dialog open={isFormOpen} onOpenChange={handleCloseDialog}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{selectedPersona ? 'Editar Persona' : 'Crear Nueva Persona'}</DialogTitle>
                </DialogHeader>
                {isFormOpen && (
                    <PersonForm
                        persona={selectedPersona}
                        onSubmitted={handleFormSubmitted}
                        onCancel={handleCloseDialog}
                    />
                )}
            </DialogContent>
        </Dialog>
    </>
  );
}
