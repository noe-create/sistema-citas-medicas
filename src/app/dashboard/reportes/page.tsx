import { ReportsDashboard } from "@/components/reports-dashboard";

export default function ReportesPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Módulo de Reportes</h2>
      </div>
      <ReportsDashboard />
    </div>
  );
}
