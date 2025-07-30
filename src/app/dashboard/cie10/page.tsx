import { Cie10Management } from '@/components/cie10-management';

export default function Cie10Page() {
  return (
    <>
      <div className="flex items-center justify-between space-y-2 bg-background p-4 rounded-lg shadow-sm border">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Gestión de Códigos CIE-10</h2>
      </div>
      <Cie10Management />
    </>
  );
}
