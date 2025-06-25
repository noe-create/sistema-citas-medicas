import { CompanyManagement } from '@/components/company-management';

export default function EmpresasPage() {
  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Gestión de Empresas</h2>
      </div>
      <CompanyManagement />
    </>
  );
}
