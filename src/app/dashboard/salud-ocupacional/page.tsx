
import { OccupationalHealthManagement } from '@/components/occupational-health-management';

export default async function SaludOcupacionalPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2 bg-background p-4 rounded-lg shadow-sm border">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Gestión de Salud Ocupacional</h2>
      </div>
      <OccupationalHealthManagement />
    </div>
  );
}
