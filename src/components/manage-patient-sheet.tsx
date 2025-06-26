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
import { ConsultationNotes } from './consultation-notes';

interface ManagePatientSheetProps {
  patient: Patient;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConsultationComplete: () => void;
}

export function ManagePatientSheet({ patient, isOpen, onOpenChange, onConsultationComplete }: ManagePatientSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gestionar: {patient.name}</SheetTitle>
          <SheetDescription>
            {patient.serviceType} &bull; Cuenta {patient.accountType} &bull; {patient.status}
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <Tabs defaultValue="consultation">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="consultation">Notas de Consulta</TabsTrigger>
              <TabsTrigger value="consent">Consentimientos</TabsTrigger>
            </TabsList>
            <TabsContent value="consent" className="mt-4">
              <ConsentFormSuggester serviceType={patient.serviceType} />
            </TabsContent>
            <TabsContent value="consultation" className="mt-4">
              <ConsultationNotes patientId={patient.id} onConsultationComplete={onConsultationComplete}/>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
