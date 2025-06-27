'use client';

import * as React from 'react';
import type { TreatmentOrder } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Loader2, Pencil, Trash2, ClipboardCheck, CheckCircle, XCircle } from 'lucide-react';
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
import { getTreatmentOrders, createTreatmentOrder, createTreatmentExecution, updateTreatmentOrderStatus } from '@/actions/patient-actions';
import { TreatmentOrderForm } from './treatment-order-form';
import { RegisterExecutionForm } from './register-execution-form';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUser } from './app-shell';

const statusColors: Record<TreatmentOrder['status'], string> = {
  Activo: 'bg-blue-500/20 text-blue-700 border-blue-500/30 dark:text-blue-300',
  Completado: 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-300',
  Cancelado: 'bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-300',
};

export function TreatmentLogManagement() {
  const { toast } = useToast();
  const user = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [orders, setOrders] = React.useState<TreatmentOrder[]>([]);
  
  const [selectedOrder, setSelectedOrder] = React.useState<TreatmentOrder | null>(null);
  const [isOrderFormOpen, setIsOrderFormOpen] = React.useState(false);
  const [isExecutionFormOpen, setIsExecutionFormOpen] = React.useState(false);

  const canCreateOrder = ['doctor', 'superuser'].includes(user.role.id);
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
    const timer = setTimeout(() => {
      refreshOrders(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, refreshOrders]);

  const handleOpenOrderForm = () => {
    setIsOrderFormOpen(true);
  };
  
  const handleOpenExecutionForm = (order: TreatmentOrder) => {
    setSelectedOrder(order);
    setIsExecutionFormOpen(true);
  };

  const handleCloseDialogs = () => {
    setSelectedOrder(null);
    setIsOrderFormOpen(false);
    setIsExecutionFormOpen(false);
  };

  const handleOrderFormSubmitted = async (values: any) => {
    try {
      await createTreatmentOrder(values);
      toast({ title: '¡Orden Creada!', description: 'La nueva orden de tratamiento ha sido creada.' });
      handleCloseDialogs();
      await refreshOrders(search);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo crear la orden.', variant: 'destructive' });
    }
  };
  
  const handleExecutionFormSubmitted = async (values: { treatmentOrderId: string; observations: string }) => {
     try {
      await createTreatmentExecution(values);
      toast({ title: '¡Ejecución Registrada!', description: 'La ejecución del tratamiento ha sido guardada en el historial.' });
      handleCloseDialogs();
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
          <CardTitle>Órdenes de Tratamiento</CardTitle>
          <CardDescription>
            Busque, cree y registre la ejecución de las órdenes de tratamiento para los pacientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Buscar por paciente, cédula o procedimiento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            {canCreateOrder && (
              <Button onClick={handleOpenOrderForm}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva Orden
              </Button>
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
                  <TableHead>Paciente</TableHead>
                  <TableHead>Procedimiento</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <div>{order.pacienteNombre}</div>
                        <div className="text-xs text-muted-foreground">{order.pacienteCedula}</div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{order.procedureDescription}</TableCell>
                      <TableCell>
                        {format(order.startDate, 'P', { locale: es })} - {format(order.endDate, 'P', { locale: es })}
                      </TableCell>
                      <TableCell>{order.frequency}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[order.status]}>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canManageOrder && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              {order.status === 'Activo' && (
                                  <DropdownMenuItem onClick={() => handleOpenExecutionForm(order)}>
                                      <ClipboardCheck className="mr-2 h-4 w-4" />
                                      <span>Registrar Ejecución</span>
                                  </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleChangeStatus(order.id, 'Completado')}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  <span>Marcar como Completado</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeStatus(order.id, 'Cancelado')} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                  <XCircle className="mr-2 h-4 w-4" />
                                  <span>Cancelar Orden</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No se encontraron órdenes de tratamiento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOrderFormOpen} onOpenChange={setIsOrderFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nueva Orden de Tratamiento</DialogTitle>
          </DialogHeader>
          <TreatmentOrderForm onSubmitted={handleOrderFormSubmitted} onCancel={handleCloseDialogs} />
        </DialogContent>
      </Dialog>
      
      {selectedOrder && (
         <Dialog open={isExecutionFormOpen} onOpenChange={setIsExecutionFormOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Registrar Ejecución de Tratamiento</DialogTitle>
                    <DialogDescription>Paciente: {selectedOrder.pacienteNombre}</DialogDescription>
                </DialogHeader>
                <RegisterExecutionForm treatmentOrder={selectedOrder} onSubmitted={handleExecutionFormSubmitted} onCancel={handleCloseDialogs} />
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}
