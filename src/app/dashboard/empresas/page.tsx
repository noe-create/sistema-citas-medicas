import { CompanyManagement } from '@/components/company-management';

export default function EmpresasPage() {
  return (
    <>
      <div className="flex items-center justify-between space-y-2 bg-background p-4 rounded-lg shadow-sm border">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Gestión de Empresas</h2>
      </div>
      <CompanyManagement />
    </>
  );
}
