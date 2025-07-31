
'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormSection } from './form-section';

const sintomasComunes = [ { id: 'fiebre', label: 'Fiebre' }, { id: 'tos', label: 'Tos' }, { id: 'dolor_garganta', label: 'Dolor de garganta' }, { id: 'dolor_cabeza', label: 'Dolor de cabeza' }, { id: 'congestion_nasal', label: 'Congestión nasal' }, { id: 'dificultad_respirar', label: 'Dificultad para respirar' }, { id: 'dolor_abdominal', label: 'Dolor abdominal' }, { id: 'nauseas_vomitos', label: 'Náuseas/Vómitos' }, { id: 'diarrea', label: 'Diarrea' }, { id: 'fatiga_cansancio', label: 'Fatiga/Cansancio' }, { id: 'dolor_muscular', label: 'Dolor muscular' }, { id: 'mareos', label: 'Mareos' } ];

export const StepAnamnesis = ({ form }: { form: any }) => (
    <div className="space-y-6">
        <FormSection title="Motivo de Consulta">
             <FormField control={form.control} name="motivoConsulta" render={() => (
                <FormItem>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-md border p-4">
                    {sintomasComunes.map((item) => (
                      <FormField key={item.id} control={form.control} name="motivoConsulta.sintomas"
                        render={({ field }) => (
                            <FormItem key={item.id} className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value?.includes(item.label)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    return checked
                                      ? field.onChange([...currentValue, item.label])
                                      : field.onChange(currentValue.filter((value: string) => value !== item.label))
                                  }} />
                              </FormControl>
                              <FormLabel className="font-normal">{item.label}</FormLabel>
                            </FormItem>
                        )} /> ))}
                  </div>
                   <FormField control={form.control} name="motivoConsulta.otros" render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Otros síntomas</FormLabel>
                        <FormControl><Input placeholder="Describa otros síntomas no listados..." {...field} /></FormControl>
                         <FormMessage />
                      </FormItem>
                    )} />
                </FormItem>
              )} />
        </FormSection>
        <FormSection title="Enfermedad Actual">
            <FormField control={form.control} name="enfermedadActual" render={({ field }) => ( <FormItem><FormControl><Textarea placeholder="Detalle la cronología y características de los síntomas..." {...field} rows={6} /></FormControl><FormMessage /></FormItem> )} />
        </FormSection>
        <FormSection title="Revisión por Sistemas">
            <FormField control={form.control} name="revisionPorSistemas" render={({ field }) => ( <FormItem><FormControl><Textarea placeholder="Detalle cualquier otro síntoma por sistema corporal..." {...field} rows={4} /></FormControl><FormMessage /></FormItem> )} />
        </FormSection>
    </div>
);
