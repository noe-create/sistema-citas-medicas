import { BeneficiaryList } from '@/components/beneficiary-list';

export default async function BeneficiariosPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2 bg-background p-4 rounded-lg shadow-sm border">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Gestión de Beneficiarios</h2>
      </div>
      <BeneficiaryList />
    </div>
  );
}
