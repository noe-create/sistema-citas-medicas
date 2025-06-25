'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from './ui/badge';
import type { BeneficiarioConTitular } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BeneficiaryListProps {
  initialBeneficiarios: BeneficiarioConTitular[];
}

export function BeneficiaryList({ initialBeneficiarios }: BeneficiaryListProps) {
  const [search, setSearch] = React.useState('');
  const [beneficiarios] = React.useState<BeneficiarioConTitular[]>(initialBeneficiarios);

  const filteredBeneficiarios = beneficiarios.filter(
    (beneficiario) =>
      beneficiario.nombreCompleto.toLowerCase().includes(search.toLowerCase()) ||
      beneficiario.cedula.toLowerCase().includes(search.toLowerCase()) ||
      beneficiario.titularNombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos los Beneficiarios</CardTitle>
        <CardDescription>
          Una lista de todos los beneficiarios registrados en el sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Input
            placeholder="Buscar por nombre, cédula o titular..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Fecha de Nacimiento</TableHead>
              <TableHead>Género</TableHead>
              <TableHead>Titular Asociado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBeneficiarios.length > 0 ? (
              filteredBeneficiarios.map((beneficiario) => (
                <TableRow key={beneficiario.id}>
                  <TableCell className="font-medium">{beneficiario.nombreCompleto}</TableCell>
                  <TableCell>{beneficiario.cedula}</TableCell>
                  <TableCell>{format(beneficiario.fechaNacimiento, 'PPP', { locale: es })}</TableCell>
                  <TableCell>{beneficiario.genero}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{beneficiario.titularNombre}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No se encontraron beneficiarios.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
