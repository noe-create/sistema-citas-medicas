
'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormSection } from './form-section';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';

const alergiasOptions = [ { id: 'medicamentos', label: 'Medicamentos' }, { id: 'alimentos', label: 'Alimentos' }, { id: 'polen', label: 'Polen' }, { id: 'polvo', label: 'Polvo' }, { id: 'animales', label: 'Animales' }, { id: 'picaduras_de_insectos', label: 'Picaduras de Insectos' } ];
const habitosOptions = [ { id: 'tabaco', label: 'Tabaco' }, { id: 'alcohol', label: 'Alcohol' }, { id: 'drogas', label: 'Drogas' }, { id: 'cafe', label: 'Café' }, { id: 'actividad_fisica', label: 'Actividad Física' }, { id: 'dieta_balanceada', label: 'Dieta Balanceada' } ];

const StepGineco = ({ form }: { form: any }) => (
    <FormSection title="Antecedentes Gineco-Obstétricos">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField control={form.control} name="antecedentesGinecoObstetricos.menarquia" render={({ field }) => ( <FormItem><FormLabel>Menarquia (edad)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem> )} />
            <FormField control={form.control} name="antecedentesGinecoObstetricos.ciclos" render={({ field }) => ( <FormItem><FormLabel>Ciclos (días/duración)</FormLabel><FormControl><Input placeholder="28/5" {...field} value={field.value ?? ''} /></FormControl></FormItem> )} />
            <FormField control={form.control} name="antecedentesGinecoObstetricos.fum" render={({ field }) => ( <FormItem><FormLabel>FUM</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? (format(field.value, 'PPP', {locale: es})) : (<span>Seleccione fecha</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover></FormItem> )} />
            <FormField control={form.control} name="antecedentesGinecoObstetricos.g" render={({ field }) => ( <FormItem><FormLabel>Gestas</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem> )} />
            <FormField control={form.control} name="antecedentesGinecoObstetricos.p" render={({ field }) => ( <FormItem><FormLabel>Partos</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem> )} />
            <FormField control={form.control} name="antecedentesGinecoObstetricos.a" render={({ field }) => ( <FormItem><FormLabel>Abortos</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem> )} />
            <FormField control={form.control} name="antecedentesGinecoObstetricos.c" render={({ field }) => ( <FormItem><FormLabel>Cesáreas</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem> )} />
        </div>
        <FormField control={form.control} name="antecedentesGinecoObstetricos.metodoAnticonceptivo" render={({ field }) => ( <FormItem><FormLabel>Método Anticonceptivo</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem> )} />
    </FormSection>
);

const StepPediatrico = ({ form }: { form: any }) => (
     <FormSection title="Antecedentes Pediátricos">
        <FormField control={form.control} name="antecedentesPediatricos.prenatales" render={({ field }) => ( <FormItem><FormLabel>Prenatales</FormLabel><FormControl><Textarea placeholder="Control del embarazo, complicaciones..." {...field} rows={2} /></FormControl></FormItem> )} />
        <FormField control={form.control} name="antecedentesPediatricos.natales" render={({ field }) => ( <FormItem><FormLabel>Natales</FormLabel><FormControl><Textarea placeholder="Tipo de parto, peso/talla al nacer..." {...field} rows={2} /></FormControl></FormItem> )} />
        <FormField control={form.control} name="antecedentesPediatricos.postnatales" render={({ field }) => ( <FormItem><FormLabel>Postnatales</FormLabel><FormControl><Textarea placeholder="Complicaciones neonatales, lactancia..." {...field} rows={2} /></FormControl></FormItem> )} />
        <FormField control={form.control} name="antecedentesPediatricos.inmunizaciones" render={({ field }) => ( <FormItem><FormLabel>Inmunizaciones</FormLabel><FormControl><Textarea placeholder="Esquema de vacunación, vacunas pendientes..." {...field} rows={2} /></FormControl></FormItem> )} />
        <FormField control={form.control} name="antecedentesPediatricos.desarrolloPsicomotor" render={({ field }) => ( <FormItem><FormLabel>Desarrollo Psicomotor</FormLabel><FormControl><Textarea placeholder="Hitos del desarrollo, lenguaje, socialización..." {...field} rows={2} /></FormControl></FormItem> )} />
    </FormSection>
);

export const StepAntecedentes = ({ form, isFemale, isPediatric }: { form: any, isFemale: boolean, isPediatric: boolean }) => (
     <div className="space-y-6">
        <FormSection title="Antecedentes Personales">
            <FormField control={form.control} name="antecedentesPersonales.patologicos" render={({ field }) => ( <FormItem><FormLabel>Patológicos</FormLabel><FormControl><Textarea placeholder="Enfermedades crónicas, previas..." {...field} rows={2} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="antecedentesPersonales.quirurgicos" render={({ field }) => ( <FormItem><FormLabel>Quirúrgicos</FormLabel><FormControl><Textarea placeholder="Cirugías anteriores..." {...field} rows={2} /></FormControl><FormMessage /></FormItem> )} />
            
             <FormField control={form.control} name="antecedentesPersonales.alergicos" render={() => (
                    <FormItem>
                        <FormLabel>Alérgicos</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-md border p-4">
                            {alergiasOptions.map((item) => (
                                <FormField key={item.id} control={form.control} name="antecedentesPersonales.alergicos"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox checked={field.value?.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                        const currentValue = field.value || [];
                                                        return checked ? field.onChange([...currentValue, item.id]) : field.onChange(currentValue.filter((value: string) => value !== item.id));
                                                    }}/>
                                            </FormControl>
                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                    )} /> ))}
                        </div>
                        <FormField control={form.control} name="antecedentesPersonales.alergicosOtros"
                            render={({ field }) => (
                                <FormItem className="mt-2"><FormControl><Input placeholder="Otras alergias, especificar..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        <FormMessage />
                    </FormItem>
                )} />

            <FormField control={form.control} name="antecedentesPersonales.medicamentos" render={({ field }) => ( <FormItem><FormLabel>Medicamentos Actuales</FormLabel><FormControl><Textarea placeholder="Medicamentos que toma regularmente..." {...field} rows={2} /></FormControl><FormMessage /></FormItem> )} />

            <FormField control={form.control} name="antecedentesPersonales.habitos" render={() => (
                    <FormItem>
                        <FormLabel>Hábitos Psicobiológicos</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-md border p-4">
                            {habitosOptions.map((item) => (
                                <FormField key={item.id} control={form.control} name="antecedentesPersonales.habitos"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox checked={field.value?.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                        const currentValue = field.value || [];
                                                        return checked ? field.onChange([...currentValue, item.id]) : field.onChange(currentValue.filter((value: string) => value !== item.id));
                                                    }}/>
                                            </FormControl>
                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                    )} /> ))}
                        </div>
                        <FormField control={form.control} name="antecedentesPersonales.habitosOtros"
                            render={({ field }) => (
                                <FormItem className="mt-2"><FormControl><Input placeholder="Otros hábitos, especificar..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        <FormMessage />
                    </FormItem>
                )} />
        </FormSection>
        
        <FormSection title="Antecedentes Familiares">
             <FormField control={form.control} name="antecedentesFamiliares" render={({ field }) => ( <FormItem><FormControl><Textarea placeholder="Enfermedades importantes en familiares directos..." {...field} rows={3} /></FormControl><FormMessage /></FormItem> )} />
        </FormSection>
        
        {isFemale && <StepGineco form={form} />}
        {isPediatric && <StepPediatrico form={form} />}
    </div>
);
