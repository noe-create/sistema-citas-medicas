import { TreatmentLogManagement } from '@/components/treatment-log-management';

export default function BitacoraPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2 bg-background p-4 rounded-lg shadow-sm border">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Bitácora de Tratamiento</h2>
      </div>
      <TreatmentLogManagement />
    </div>
  );
}
