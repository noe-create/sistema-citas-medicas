'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Patient } from '@/lib/types';
import { ConsentFormSuggester } from './consent-form-suggester';
import { ConsultationForm } from './consultation-form';
import { PatientHistory } from './patient-history';

interface ManagePatientSheetProps {
  patient: Patient;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConsultationComplete: () => void;
}

export function ManagePatientSheet({ patient, isOpen, onOpenChange, onConsultationComplete }: ManagePatientSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gestionar: {patient.name}</SheetTitle>
          <SheetDescription>
            {patient.serviceType} &bull; Cuenta {patient.accountType} &bull; {patient.status}
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <Tabs defaultValue="consultation" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="consultation">Nueva Consulta</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
              <TabsTrigger value="consent">Consentimientos</TabsTrigger>
            </TabsList>
            <TabsContent value="consultation" className="mt-4">
              <ConsultationForm patient={patient} onConsultationComplete={onConsultationComplete}/>
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <PatientHistory patientDbId={patient.patientDbId} />
            </TabsContent>
            <TabsContent value="consent" className="mt-4">
              <ConsentFormSuggester serviceType={patient.serviceType} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
