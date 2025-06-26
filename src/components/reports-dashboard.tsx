'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MorbidityReport } from './morbidity-report';
import { OperationalReport } from './operational-report';

export function ReportsDashboard() {
  return (
    <Tabs defaultValue="morbidity" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="morbidity">Reporte de Morbilidad</TabsTrigger>
        <TabsTrigger value="operational">Reportes Operacionales</TabsTrigger>
      </TabsList>
      <TabsContent value="morbidity" className="mt-4">
        <MorbidityReport />
      </TabsContent>
      <TabsContent value="operational" className="mt-4">
        <OperationalReport />
      </TabsContent>
    </Tabs>
  );
}
