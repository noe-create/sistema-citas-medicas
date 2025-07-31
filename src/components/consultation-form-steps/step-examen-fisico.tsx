
'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { FormSection } from './form-section';

export const StepExamenFisico = ({ form }: { form: any }) => {
    const satO2Ambiente = form.watch('signosVitales.satO2Ambiente');

    React.useEffect(() => {
        const peso = form.getValues('signosVitales.peso');
        const pesoUnidad = form.getValues('signosVitales.pesoUnidad');
        const talla = form.getValues('signosVitales.talla');
        const tallaUnidad = form.getValues('signosVitales.tallaUnidad');

        if (peso && talla) {
            const pesoKg = pesoUnidad === 'lb' ? peso / 2.20462 : peso;
            const tallaM = tallaUnidad === 'in' ? talla * 0.0254 : talla / 100;
            if (tallaM > 0) {
                const imc = pesoKg / (tallaM * tallaM);
                form.setValue('signosVitales.imc', parseFloat(imc.toFixed(2)));
            }
        }
    }, [ form.watch('signosVitales.peso'), form.watch('signosVitales.pesoUnidad'), form.watch('signosVitales.talla'), form.watch('signosVitales.tallaUnidad'), form ]);

    return (
        <div className="space-y-6">
            <FormSection title="Signos Vitales">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                    <div className="lg:col-span-2 space-y-2">
                        <FormLabel>Tensión Arterial (mmHg)</FormLabel>
                        <div className="flex items-center gap-2">
                            <FormField control={form.control} name="signosVitales.taSistolica" render={({ field }) => (<FormItem className="flex-1"><FormControl><Input type="number" placeholder="Sist." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                            <span className="text-muted-foreground">/</span>
                            <FormField control={form.control} name="signosVitales.taDiastolica" render={({ field }) => (<FormItem className="flex-1"><FormControl><Input type="number" placeholder="Diast." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <div className="flex gap-4">
                            <FormField control={form.control} name="signosVitales.taBrazo" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-xs">Brazo</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center"><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="izquierdo" /></FormControl><Label className="font-normal">Izq</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="derecho" /></FormControl><Label className="font-normal">Der</Label></FormItem></RadioGroup></FormControl></FormItem>)} />
                            <FormField control={form.control} name="signosVitales.taPosicion" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-xs">Posición</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center"><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="sentado" /></FormControl><Label className="font-normal">Sentado</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="acostado" /></FormControl><Label className="font-normal">Acostado</Label></FormItem></RadioGroup></FormControl></FormItem>)} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <FormField control={form.control} name="signosVitales.fc" render={({ field }) => (<FormItem><FormLabel>Frec. Cardíaca (lpm)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="signosVitales.fcRitmo" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-xs">Ritmo</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center"><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="regular" /></FormControl><Label className="font-normal">Regular</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="irregular" /></FormControl><Label className="font-normal">Irregular</Label></FormItem></RadioGroup></FormControl></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="signosVitales.fr" render={({ field }) => (<FormItem><FormLabel>Frec. Resp. (rpm)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                     <div className="lg:col-span-2 space-y-2">
                        <FormLabel>Temperatura</FormLabel>
                        <div className="flex items-center gap-2">
                            <FormField control={form.control} name="signosVitales.temp" render={({ field }) => (<FormItem className="flex-1"><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="signosVitales.tempUnidad" render={({ field }) => (<FormItem><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center"><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="C" /></FormControl><Label className="font-normal">°C</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="F" /></FormControl><Label className="font-normal">°F</Label></FormItem></RadioGroup></FormControl></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="signosVitales.tempSitio" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-xs">Sitio</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-x-4 gap-y-1"><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="oral" /></FormControl><Label className="font-normal">Oral</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="axilar" /></FormControl><Label className="font-normal">Axilar</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="rectal" /></FormControl><Label className="font-normal">Rectal</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="timpanica" /></FormControl><Label className="font-normal">Timpánica</Label></FormItem></RadioGroup></FormControl></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="signosVitales.peso" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>Peso</FormLabel><div className="flex items-center gap-2"><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ''} /></FormControl><FormField control={form.control} name="signosVitales.pesoUnidad" render={({ field }) => (<FormItem><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center"><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="kg" /></FormControl><Label className="font-normal">kg</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="lb" /></FormControl><Label className="font-normal">lb</Label></FormItem></RadioGroup></FormControl></FormItem>)} /></div><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="signosVitales.talla" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>Talla</FormLabel><div className="flex items-center gap-2"><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ''} /></FormControl><FormField control={form.control} name="signosVitales.tallaUnidad" render={({ field }) => (<FormItem><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center"><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="cm" /></FormControl><Label className="font-normal">cm</Label></FormItem><FormItem className="flex items-center space-x-1 space-y-0"><FormControl><RadioGroupItem value="in" /></FormControl><Label className="font-normal">in</Label></FormItem></RadioGroup></FormControl></FormItem>)} /></div><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="signosVitales.imc" render={({ field }) => (<FormItem><FormLabel>IMC (kg/m²)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} readOnly className="bg-muted" /></FormControl><FormMessage /></FormItem>)} />
                    <div className="space-y-2">
                         <FormField control={form.control} name="signosVitales.satO2" render={({ field }) => (<FormItem><FormLabel>SatO2 (%)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name="signosVitales.satO2Ambiente" render={({ field }) => (<FormItem className="flex items-center space-x-2 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><Label className="font-normal text-sm">Aire Ambiente</Label></FormItem>)} />
                         {!satO2Ambiente && <FormField control={form.control} name="signosVitales.satO2Flujo" render={({ field }) => (<FormItem><FormLabel className="text-xs">Flujo O2 (L/min)</FormLabel><FormControl><Input type="number" step="0.5" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />}
                    </div>
                    <div className="lg:col-span-2 space-y-2">
                        <FormField control={form.control} name="signosVitales.dolor" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dolor (0-10): {field.value ?? 'N/A'}</FormLabel>
                                    <FormControl><Slider defaultValue={[0]} value={[field.value ?? 0]} max={10} step={1} onValueChange={(value) => field.onChange(value[0])} /></FormControl>
                                </FormItem>
                            )} />
                    </div>
                </div>
            </FormSection>
            <FormSection title="Examen Físico General">
                 <FormField control={form.control} name="examenFisicoGeneral" render={({ field }) => ( <FormItem><FormControl><Textarea placeholder="Descripción del examen físico por sistemas (cabeza, cuello, tórax, etc.)..." {...field} rows={8} /></FormControl><FormMessage /></FormItem> )} />
            </FormSection>
        </div>
    );
};
