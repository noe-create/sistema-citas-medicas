'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import type { Persona } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { getPersonas } from '@/actions/patient-actions';
import { Loader2 } from 'lucide-react';

export function PeopleList() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [personas, setPersonas] = React.useState<Persona[]>([]);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await getPersonas(search);
        setPersonas(data);
      } catch (error) {
        console.error("Error al buscar personas:", error);
        toast({ title: 'Error', description: 'No se pudieron cargar las personas.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repositorio de Personas</CardTitle>
        <CardDescription>
          Busque en el registro central de todas las personas en el sistema.
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
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                    No se encontraron personas.
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
