import { PatientCheckinForm } from '@/components/patient-checkin-form';
import { Stethoscope } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center justify-center">
          <div className="mb-4 rounded-full bg-primary/20 p-3">
            <Stethoscope className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-headline text-center text-3xl font-bold">CareFlow Central</h1>
          <p className="mt-2 text-center text-muted-foreground">
            Welcome! Please check in for your appointment.
          </p>
        </div>
        <PatientCheckinForm />
      </div>
      <footer className="absolute bottom-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} CareFlow Central. All rights reserved.
      </footer>
    </main>
  );
}
