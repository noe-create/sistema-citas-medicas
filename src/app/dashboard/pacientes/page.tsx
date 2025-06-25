import { PatientManagement } from '@/components/patient-management';

export default function PacientesPage() {
  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Gestión de Titulares</h2>
      </div>
      <PatientManagement />
    </>
  );
}
