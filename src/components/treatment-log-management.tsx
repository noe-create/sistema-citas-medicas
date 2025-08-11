

'use client';

import * as React from 'react';
import type { TreatmentOrder, TreatmentOrderItem } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Loader2, CheckCircle, XCircle, ClipboardCheck, Syringe } from 'lucide-react';
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
} from '@/components/ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getTreatmentOrders, createTreatmentExecution, updateTreatmentOrderStatus } from '@/actions/patient-actions';
import { RegisterExecutionForm } from './register-execution-form';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUser } from './app-shell';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { useDebounce } from '@/hooks/use-debounce';

const statusColors: Record<TreatmentOrder['status'], string> = {
  Pendiente: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-300',
  'En Progreso': 'bg-blue-500/20 text-blue-700 border-blue-500/30 dark:text-blue-300',
  Completado: 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-300',
  Cancelado: 'bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-300',
};

export function TreatmentLogManagement() {
  const { toast } = useToast();
  const user = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [orders, setOrders] = React.useState<TreatmentOrder[]>([]);
  
  const [selectedItem, setSelectedItem] = React.useState<TreatmentOrderItem | null>(null);
  const [isExecutionFormOpen, setIsExecutionFormOpen] = React.useState(false);

  const canManageOrder = ['doctor', 'enfermera', 'superuser'].includes(user.role.id);

  const refreshOrders = React.useCallback(async (currentSearch: string) => {
    setIsLoading(true);
    try {
      const data = await getTreatmentOrders(currentSearch);
      setOrders(data);
    } catch (error) {
      console.error("Error fetching treatment orders:", error);
      toast({ title: 'Error', description: 'No se pudieron cargar las órdenes de tratamiento.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    refreshOrders(debouncedSearch);
  }, [debouncedSearch, refreshOrders]);

  
  const handleOpenExecutionForm = (item: TreatmentOrderItem) => {
    setSelectedItem(item);
    setIsExecutionFormOpen(true);
  };

  const handleCloseDialogs = () => {
    setSelectedItem(null);
    setIsExecutionFormOpen(false);
  };
  
  const handleExecutionFormSubmitted = async (values: { treatmentOrderItemId: string; observations: string }) => {
     try {
      await createTreatmentExecution(values);
      toast({ title: '¡Ejecución Registrada!', description: 'La ejecución del tratamiento ha sido guardada.' });
      handleCloseDialogs();
      await refreshOrders(search);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo registrar la ejecución.', variant: 'destructive' });
    }
  };

  const handleChangeStatus = async (orderId: string, status: TreatmentOrder['status']) => {
    try {
        await updateTreatmentOrderStatus(orderId, status);
        toast({ title: 'Estado Actualizado', description: `La orden ha sido marcada como ${status.toLowerCase()}.`});
        await refreshOrders(search);
    } catch(error: any) {
         toast({ title: 'Error', description: error.message || 'No se pudo cambiar el estado.', variant: 'destructive' });
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bitácora de Tratamientos</CardTitle>
          <CardDescription>
            Visualice y gestione las órdenes de tratamiento generadas desde las consultas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Buscar por paciente o cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
                {orders.map((order) => (
                    <AccordionItem value={order.id} key={order.id}>
                        <AccordionTrigger>
                           <div className="flex justify-between items-center w-full pr-4">
                                <div className="flex flex-col text-left">
                                    <span className="font-semibold">{order.paciente?.nombreCompleto}</span>
                                    <span className="text-sm text-muted-foreground">{order.paciente?.cedula}</span>
                                </div>
                                <div className="text-sm text-muted-foreground text-center hidden md:block">
                                    <p className="font-medium">Diagnóstico Principal</p>
                                    <p className="truncate max-w-xs">{order.diagnosticoPrincipal || 'N/A'}</p>
                                </div>
                                <div className="text-sm text-muted-foreground text-center hidden lg:block">
                                    <p className="font-medium">Fecha de Orden</p>
                                    <p>{format(new Date(order.createdAt), 'P p', { locale: es })}</p>
                                </div>
                                <Badge variant="outline" className={statusColors[order.status]}>{order.status}</Badge>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="p-4 bg-muted/50 rounded-md">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ítem</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <p className="font-semibold">{item.medicamentoProcedimiento}</p>
                                                <p className="text-muted-foreground text-sm">
                                                    {item.dosis && <span>{item.dosis}</span>}
                                                    {item.via && <span> &bull; Vía {item.via}</span>}
                                                    {item.frecuencia && <span> &bull; {item.frecuencia}</span>}
                                                    {item.duracion && <span> &bull; {item.duracion}</span>}
                                                </p>
                                                {item.instrucciones && <p className="text-xs text-muted-foreground mt-1">Instrucciones: {item.instrucciones}</p>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={item.status === 'Pendiente' ? 'destructive' : 'default'}>{item.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {canManageOrder && item.status === 'Pendiente' && (
                                                    <Button size="sm" onClick={() => handleOpenExecutionForm(item)}>
                                                        <ClipboardCheck className="mr-2 h-4 w-4"/>
                                                        Registrar
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                             </Table>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
              </Accordion>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground bg-card rounded-md border border-dashed">
                <Syringe className="h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold">No hay órdenes de tratamiento</h3>
                <p className="text-sm">Las órdenes de tratamiento se generan desde el módulo de consulta.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedItem && (
         <Dialog open={isExecutionFormOpen} onOpenChange={setIsExecutionFormOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Registrar Ejecución de Tratamiento</DialogTitle>
                    <DialogDescription>Procedimiento: {selectedItem.medicamentoProcedimiento}</DialogDescription>
                </DialogHeader>
                <RegisterExecutionForm treatmentOrderItem={selectedItem} onSubmitted={handleExecutionFormSubmitted} onCancel={handleCloseDialogs} />
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}
