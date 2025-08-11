

'use client';

import * as React from 'react';
import type { Service } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Loader2, Pencil, Trash2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { getServices, createService, updateService, deleteService } from '@/actions/patient-actions';
import { useDebounce } from '@/hooks/use-debounce';
import { ServiceForm } from './service-form';
import { useUser } from './app-shell';
import { motion, AnimatePresence } from 'framer-motion';

export function ServiceCatalogManagement() {
  const { toast } = useToast();
  const user = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [services, setServices] = React.useState<Service[]>([]);
  const [selectedService, setSelectedService] = React.useState<Service | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const canManage = user.permissions.includes('services.manage');

  const refreshServices = React.useCallback(async (currentSearch: string) => {
    setIsLoading(true);
    try {
      const data = await getServices(currentSearch);
      setServices(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    refreshServices(debouncedSearch);
  }, [debouncedSearch, refreshServices]);

  const handleOpenForm = (service: Service | null) => {
    setSelectedService(service);
    setIsFormOpen(true);
  };

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedService(null);
  };

  const handleFormSubmitted = async (values: Omit<Service, 'id'>) => {
    try {
      if (selectedService) {
        await updateService(selectedService.id, values);
        toast({ title: '¡Servicio Actualizado!', description: `El servicio ${values.name} ha sido guardado.` });
      } else {
        await createService(values);
        toast({ title: '¡Servicio Creado!', description: `El servicio ${values.name} ha sido añadido.` });
      }
      handleCloseDialog();
      await refreshServices(debouncedSearch);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteService(id);
      toast({ title: '¡Servicio Eliminado!', description: 'El servicio ha sido eliminado.' });
      await refreshServices(debouncedSearch);
    } catch (error: any) {
      toast({ title: 'Error al Eliminar', description: error.message, variant: 'destructive' });
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(price);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Servicios</CardTitle>
          <CardDescription>Defina los servicios facturables que ofrece su centro médico.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            {canManage && (
              <Button onClick={() => handleOpenForm(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Servicio
              </Button>
            )}
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : services.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Servicio</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  {canManage && <TableHead className="text-right w-[100px]">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {services.map((service) => (
                    <motion.tr key={service.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell className="text-muted-foreground">{service.description}</TableCell>
                      <TableCell className="text-right font-mono">{formatPrice(service.price)}</TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <AlertDialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menú</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenForm(service)}><Pencil className="mr-2 h-4 w-4" /><span>Editar</span></DropdownMenuItem>
                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /><span>Eliminar</span></DropdownMenuItem></AlertDialogTrigger>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará el servicio del catálogo.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(service.id)} className="bg-destructive hover:bg-destructive/90">Sí, eliminar</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      )}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground bg-card rounded-md border border-dashed">
              <DollarSign className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-semibold">No hay servicios definidos</h3>
              <p className="text-sm">Puede crear el primer servicio usando el botón de arriba.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{selectedService ? 'Editar Servicio' : 'Crear Nuevo Servicio'}</DialogTitle></DialogHeader>
          <ServiceForm service={selectedService} onSubmitted={handleFormSubmitted} onCancel={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </>
  );
}
