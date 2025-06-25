'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from './ui/badge';
import type { BeneficiarioConTitular } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { getAllBeneficiarios } from '@/actions/patient-actions';
import { Loader2 } from 'lucide-react';

export function BeneficiaryList() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [beneficiarios, setBeneficiarios] = React.useState<BeneficiarioConTitular[]>([]);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await getAllBeneficiarios(search);
        // Date objects need to be reconstructed on the client
        setBeneficiarios(data.map(b => ({...b, fechaNacimiento: new Date(b.fechaNacimiento)})));
      } catch (error) {
        console.error("Error al buscar beneficiarios:", error);
        toast({ title: 'Error', description: 'No se pudieron cargar los beneficiarios.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, toast]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos los Beneficiarios</CardTitle>
        <CardDescription>
          Busque un beneficiario por nombre, cédula o por el nombre de su titular.
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
                <TableHead>Titular Asociado</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {beneficiarios.length > 0 ? (
                beneficiarios.map((beneficiario) => (
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
        )}
      </CardContent>
    </Card>
  );
}
