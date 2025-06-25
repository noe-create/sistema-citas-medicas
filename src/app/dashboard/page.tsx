'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PatientQueue } from '@/components/patient-queue';
import { PatientCheckinForm } from '@/components/patient-checkin-form';
import { PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleFormSubmitted = () => {
    setIsDialogOpen(false);
    // In a real app, you'd likely want to trigger a refresh of the patient queue here.
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Patient Dashboard</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Register Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Register New Patient</DialogTitle>
              <DialogDescription>
                Fill in the details below to add a new patient to the queue.
              </DialogDescription>
            </DialogHeader>
            <PatientCheckinForm onSubmitted={handleFormSubmitted} />
          </DialogContent>
        </Dialog>
      </div>
      <PatientQueue />
    </div>
  );
}
