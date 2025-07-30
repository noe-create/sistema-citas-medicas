import { getBeneficiarios, getTitularById } from '@/actions/patient-actions';
import { BeneficiaryManagement } from '@/components/beneficiary-management';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function BeneficiariosPage({ params }: { params: { titularId: string } }) {
  const titular = await getTitularById(params.titularId);
  if (!titular) {
    notFound();
  }

  const beneficiarios = await getBeneficiarios(params.titularId);

  return (
    <>
      <div className="flex items-center justify-between space-y-2 bg-background p-4 rounded-lg shadow-sm border">
         <div>
            <Button variant="outline" asChild className="mb-4">
                <Link href="/dashboard/pacientes">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Titulares
                </Link>
            </Button>
            <h2 className="font-headline text-3xl font-bold tracking-tight">
                Beneficiarios de {titular.persona.nombreCompleto}
            </h2>
            <p className="text-muted-foreground">Cédula: {titular.persona.cedula}</p>
         </div>
      </div>
      <BeneficiaryManagement titular={titular} initialBeneficiarios={beneficiarios} />
    </>
  );
}
