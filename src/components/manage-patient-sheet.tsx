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
          <SheetTitle>Manage: {patient.name}</SheetTitle>
          <SheetDescription>
            {patient.serviceType} &bull; {patient.accountType} Account
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <Tabs defaultValue="consent">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="consent">Consent Forms</TabsTrigger>
              <TabsTrigger value="consultation">Consultation Notes</TabsTrigger>
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
