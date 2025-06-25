'use client';

import * as React from 'react';
import { mockEmpresas, mockTitulares } from '@/lib/mock-data';
import type { Titular } from '@/lib/types';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
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
import { PatientForm } from './patient-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

const titularTypeMap: Record<string, string> = {
  internal_employee: 'Empleado Interno',
  corporate_affiliate: 'Afiliado Corporativo',
  private: 'Privado',
};

export function PatientManagement() {
  const [search, setSearch] = React.useState('');
  const [titulares, setTitulares] = React.useState<Titular[]>(mockTitulares);
  const [selectedTitular, setSelectedTitular] = React.useState<Titular | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const filteredTitulares = titulares.filter(
    (titular) =>
      titular.nombreCompleto.toLowerCase().includes(search.toLowerCase()) ||
      titular.cedula.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenForm = (titular: Titular | null) => {
    setSelectedTitular(titular);
    setIsFormOpen(true);
  };

  const handleFormSubmitted = (titular: Titular) => {
    if (selectedTitular) {
      // Update
      setTitulares(titulares.map((t) => (t.id === titular.id ? titular : t)));
    } else {
      // Create
      setTitulares([...titulares, { ...titular, id: `t${titulares.length + 1}` }]);
    }
    setIsFormOpen(false);
    setSelectedTitular(null);
  };
  
  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedTitular(null);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Titulares</CardTitle>
          <CardDescription>
            Busque, añada y gestione los perfiles de los titulares.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Buscar por nombre o cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
             <Button onClick={() => handleOpenForm(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Titular
              </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Beneficiarios</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTitulares.map((titular) => (
                <TableRow key={titular.id}>
                  <TableCell className="font-medium">{titular.nombreCompleto}</TableCell>
                  <TableCell>{titular.cedula}</TableCell>
                  <TableCell>{titular.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{titularTypeMap[titular.tipo]}</Badge>
                  </TableCell>
                  <TableCell>{titular.beneficiarios.length}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenForm(titular)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>Gestionar Beneficiarios</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive hover:text-destructive-foreground">Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{selectedTitular ? 'Editar Titular' : 'Crear Nuevo Titular'}</DialogTitle>
                </DialogHeader>
                <PatientForm
                    titular={selectedTitular}
                    empresas={mockEmpresas}
                    onSubmitted={handleFormSubmitted}
                    onCancel={handleCloseDialog}
                 />
            </DialogContent>
        </Dialog>
    </>
  );
}
