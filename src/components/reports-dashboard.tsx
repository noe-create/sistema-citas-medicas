
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from './ui/skeleton';
import dynamic from 'next/dynamic';

const MorbidityReport = dynamic(() => import('./morbidity-report').then(mod => mod.MorbidityReport), {
  loading: () => <Skeleton className="h-[400px] w-full" />,
});

const OperationalReport = dynamic(() => import('./operational-report').then(mod => mod.OperationalReport), {
  loading: () => <Skeleton className="h-[400px] w-full" />,
});

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
