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
}

export function ManagePatientSheet({ patient, isOpen, onOpenChange }: ManagePatientSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full">
        <SheetHeader>
          <SheetTitle>Gestionar: {patient.name}</SheetTitle>
          <SheetDescription>
            {patient.serviceType} &bull; Cuenta {patient.accountType}
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <Tabs defaultValue="consent">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="consent">Consentimientos</TabsTrigger>
              <TabsTrigger value="consultation">Notas de Consulta</TabsTrigger>
            </TabsList>
            <TabsContent value="consent" className="mt-4">
              <ConsentFormSuggester serviceType={patient.serviceType} />
            </TabsContent>
            <TabsContent value="consultation" className="mt-4">
              <ConsultationNotes />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
