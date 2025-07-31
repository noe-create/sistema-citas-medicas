
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Patient } from '@/lib/types';
import { ConsentFormSuggester } from './consent-form-suggester';
import { PatientHistory } from './patient-history';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ConsultationForm = dynamic(() => import('./consultation-form').then(mod => mod.ConsultationForm), {
  loading: () => <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin"/></div>,
});


interface ManagePatientDialogProps {
  patient: Patient;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConsultationComplete: () => void;
}

export function ManagePatientDialog({ patient, isOpen, onOpenChange, onConsultationComplete }: ManagePatientDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gestionar: {patient.name}</DialogTitle>
          <DialogDescription>
            {patient.serviceType} &bull; Cuenta {patient.accountType} &bull; {patient.status}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex-1 overflow-y-auto">
          <Tabs defaultValue="consultation" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="consultation">Nueva Consulta</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
              <TabsTrigger value="consent">Consentimientos</TabsTrigger>
            </TabsList>
            <TabsContent value="consultation" className="mt-4">
              {isOpen && <ConsultationForm patient={patient} onConsultationComplete={onConsultationComplete}/>}
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <PatientHistory personaId={patient.personaId} />
            </TabsContent>
            <TabsContent value="consent" className="mt-4">
              <ConsentFormSuggester serviceType={patient.serviceType} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
