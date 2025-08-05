
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, PlusCircle, Wand2, FilePenLine, Trash2, Beaker, ChevronsUpDown, Check, Pill, BrainCircuit, Stethoscope, MonitorHeart } from 'lucide-react';
import type { Patient, Cie10Code, Diagnosis, CreateTreatmentItemInput, Service } from '@/lib/types';
import { searchCie10Codes, createLabOrder } from '@/actions/patient-actions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { generatePrescription } from '@/ai/flows/generate-prescription';
import type { GeneratePrescriptionOutput } from '@/ai/flows/generate-prescription';
import { PrescriptionDisplay } from '../prescription-display';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc } from '@/components/ui/dialog';
import { LabOrderForm } from '../lab-order-form';
import { FormSection } from './form-section';
import { Checkbox } from '../ui/checkbox';

// Sub-component for CIE-10 Autocomplete
interface Cie10AutocompleteProps {
    selected: Diagnosis[];
    onChange: (diagnoses: Diagnosis[]) => void;
}
function Cie10Autocomplete({ selected, onChange }: Cie10AutocompleteProps) {
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<Cie10Code[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    React.useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setIsLoading(true);
            const data = await searchCie10Codes(query);
            setResults(data);
            setIsLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (code: Cie10Code) => {
        if (!selected.some(s => s.cie10Code === code.code)) {
            onChange([...selected, { cie10Code: code.code, cie10Description: code.description }]);
        }
        setQuery('');
        setIsPopoverOpen(false);
    };
    
    const handleRemove = (codeToRemove: string) => {
        onChange(selected.filter(s => s.cie10Code !== codeToRemove));
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2 min-h-[4.5rem] p-2 border rounded-md bg-background">
                {selected.length === 0 && <span className="text-sm text-muted-foreground flex items-center justify-center w-full h-full">Ningún diagnóstico seleccionado</span>}
                {selected.map(diagnosis => (
                    <Badge key={diagnosis.cie10Code} variant="secondary">
                        {diagnosis.cie10Code}: {diagnosis.cie10Description}
                        <button type="button" onClick={() => handleRemove(diagnosis.cie10Code)} className="ml-2 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                    </Badge>
                ))}
            </div>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir diagnóstico del catálogo
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput 
                            placeholder="Buscar código o descripción CIE-10..."
                            value={query}
                            onValueChange={setQuery}
                        />
                        <CommandList>
                            {isLoading && <CommandItem disabled>Buscando...</CommandItem>}
                            {!isLoading && results.length === 0 && query.length > 1 && <CommandEmpty>No se encontraron resultados.</CommandEmpty>}
                             {results.map((result) => (
                                <CommandItem
                                    key={result.code}
                                    value={result.description}
                                    onSelect={() => handleSelect(result)}
                                    className="cursor-pointer"
                                >
                                    <div className="flex flex-col w-full">
                                        <span className="font-semibold">{result.code}</span>
                                        <span className="text-muted-foreground text-wrap">{result.description}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

const TreatmentOrderBuilder = ({ form }: { form: any }) => {
    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "treatmentItems",
    });

    const [currentItem, setCurrentItem] = React.useState<CreateTreatmentItemInput>({
        medicamentoProcedimiento: '', dosis: '', via: '', frecuencia: '', duracion: '', instrucciones: ''
    });
    const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCurrentItem({ ...currentItem, [e.target.name]: e.target.value });
    };

    const handleAddItem = () => {
        if (!currentItem.medicamentoProcedimiento) return;
        if (editingIndex !== null) {
            update(editingIndex, currentItem);
            setEditingIndex(null);
        } else {
            append(currentItem);
        }
        setCurrentItem({ medicamentoProcedimiento: '', dosis: '', via: '', frecuencia: '', duracion: '', instrucciones: '' });
    };

    const handleEditItem = (index: number) => {
        setCurrentItem(fields[index] as CreateTreatmentItemInput);
        setEditingIndex(index);
    };

    const handleCancelEdit = () => {
        setCurrentItem({ medicamentoProcedimiento: '', dosis: '', via: '', frecuencia: '', duracion: '', instrucciones: '' });
        setEditingIndex(null);
    }

    return (
        <FormSection icon={<Stethoscope className="h-5 w-5 text-primary"/>} title="Orden de Tratamiento">
            <div className="p-4 bg-background border rounded-md space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Label htmlFor="medicamentoProcedimiento">Medicamento / Procedimiento</Label>
                        <Input name="medicamentoProcedimiento" value={currentItem.medicamentoProcedimiento} onChange={handleInputChange} placeholder="Ej: Paracetamol"/>
                    </div>
                    <div>
                        <Label htmlFor="dosis">Dosis</Label>
                        <Input name="dosis" value={currentItem.dosis} onChange={handleInputChange} placeholder="Ej: 500 mg"/>
                    </div>
                    <div>
                        <Label htmlFor="via">Vía</Label>
                        <Input name="via" value={currentItem.via} onChange={handleInputChange} placeholder="Ej: Oral"/>
                    </div>
                    <div>
                        <Label htmlFor="frecuencia">Frecuencia</Label>
                        <Input name="frecuencia" value={currentItem.frecuencia} onChange={handleInputChange} placeholder="Ej: Cada 8 horas"/>
                    </div>
                     <div>
                        <Label htmlFor="duracion">Duración</Label>
                        <Input name="duracion" value={currentItem.duracion} onChange={handleInputChange} placeholder="Ej: Por 7 días"/>
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="instrucciones">Instrucciones Especiales (opcional)</Label>
                        <Textarea name="instrucciones" value={currentItem.instrucciones} onChange={handleInputChange} placeholder="Ej: Tomar con las comidas"/>
                    </div>
                 </div>
                 <div className="flex justify-end gap-2">
                    {editingIndex !== null && <Button type="button" variant="ghost" onClick={handleCancelEdit}>Cancelar Edición</Button>}
                    <Button type="button" onClick={handleAddItem}><PlusCircle className="mr-2 h-4 w-4"/> {editingIndex !== null ? 'Actualizar Ítem' : 'Agregar Ítem'}</Button>
                 </div>
            </div>
            
            {fields.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Ítems de la Orden</h4>
                    <div className="border rounded-md divide-y">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-3 flex justify-between items-start">
                                <div className="text-sm">
                                    <p className="font-semibold">{(field as any).medicamentoProcedimiento}</p>
                                    <p className="text-muted-foreground">
                                        {(field as any).dosis && <span>{(field as any).dosis}</span>}
                                        {(field as any).via && <span> &bull; Vía {(field as any).via}</span>}
                                        {(field as any).frecuencia && <span> &bull; {(field as any).frecuencia}</span>}
                                        {(field as any).duracion && <span> &bull; {(field as any).duracion}</span>}
                                    </p>
                                    {(field as any).instrucciones && <p className="text-xs text-muted-foreground mt-1">Instrucciones: {(field as any).instrucciones}</p>}
                                </div>
                                <div className="flex gap-1">
                                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEditItem(index)}><FilePenLine className="h-4 w-4"/></Button>
                                    <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <FormField control={form.control} name="treatmentItems" render={() => <FormMessage/>} />
        </FormSection>
    );
}

export const StepDiagnosticoPlan = ({ form, patient, onLabOrderChange }: { form: any; patient: Patient, onLabOrderChange: (tests: string[]) => void }) => {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [prescription, setPrescription] = React.useState<GeneratePrescriptionOutput | null>(null);
    const [isLabOrderOpen, setIsLabOrderOpen] = React.useState(false);

    const { watch, control, setValue } = form;
    const diagnoses = watch('diagnoses');
    const treatmentPlan = watch('treatmentPlan');
    const radiologyNotApplicable = watch('radiologyNotApplicable');
    const canGeneratePrescription = diagnoses.length > 0 && treatmentPlan?.trim().length > 0;

    React.useEffect(() => {
        if (radiologyNotApplicable) {
            setValue('radiologyOrder', '');
        }
    }, [radiologyNotApplicable, setValue]);

    const handleGeneratePrescription = async () => {
        setIsGenerating(true);
        setPrescription(null);
        try {
            const formData = form.getValues();
            const result = await generatePrescription({
                patientName: patient.name,
                diagnoses: formData.diagnoses,
                treatmentPlan: formData.treatmentPlan,
            });
            setPrescription(result);
             toast({
                title: 'Récipe Generado',
                description: 'El récipe médico ha sido generado por la IA.',
            });
        } catch (e) {
            console.error(e);
            toast({
                title: 'Error al Generar Récipe',
                description: 'No se pudo generar la receta. Por favor, intente de nuevo.',
                variant: 'destructive'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLabOrderSubmit = (selectedTests: string[]) => {
        if (selectedTests.length > 0) {
            onLabOrderChange(selectedTests);
            toast({
                title: 'Exámenes Seleccionados',
                description: `${selectedTests.length} exámenes de laboratorio han sido seleccionados. Se guardarán al completar la consulta.`,
            });
        }
        setIsLabOrderOpen(false);
    };

    return (
        <div className="space-y-6">
            <FormSection icon={<BrainCircuit className="h-5 w-5 text-primary"/>} title="Impresión Diagnóstica">
                <FormField control={form.control} name="diagnoses" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Diagnósticos del Catálogo (CIE-10)</FormLabel>
                        <Cie10Autocomplete selected={field.value} onChange={field.onChange} />
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField
                    control={form.control}
                    name="diagnosticoLibre"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Otros Diagnósticos / Observaciones (Opcional)</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Si el diagnóstico no se encuentra en el catálogo, o para añadir notas adicionales, escríbalo aquí."
                                {...field}
                                rows={3}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                 )} />
            </FormSection>
            
            <FormSection icon={<Pill className="h-5 w-5 text-primary"/>} title="Plan y Órdenes">
                 <FormField control={form.control} name="treatmentPlan" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Plan General y Observaciones</FormLabel>
                        <FormControl><Textarea placeholder="Indicaciones generales, plan de seguimiento, estudios solicitados, etc." {...field} rows={4} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Dialog open={isLabOrderOpen} onOpenChange={setIsLabOrderOpen}>
                    <Button type="button" variant="outline" onClick={() => setIsLabOrderOpen(true)} className="w-full mt-2">
                        <Beaker className="mr-2 h-4 w-4" />
                        Generar Orden de Laboratorio
                    </Button>
                    <DialogContent className="sm:max-w-2xl p-0 gap-0">
                        <DialogHeader className="p-4 border-b">
                            <DialogTitle>Seleccionar Exámenes de Laboratorio</DialogTitle>
                            <DialogDesc>
                                Busque o seleccione de la lista los exámenes a solicitar.
                            </DialogDesc>
                        </DialogHeader>
                        <LabOrderForm 
                            onSubmitted={handleLabOrderSubmit}
                            onCancel={() => setIsLabOrderOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
                
                <div className="space-y-2 pt-4">
                     <FormField
                        control={control}
                        name="radiologyOrder"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex justify-between items-center">
                                    <FormLabel className="flex items-center gap-2"><MonitorHeart className="h-4 w-4 text-muted-foreground"/>Órdenes de Radiología e Imágenes</FormLabel>
                                    <FormField
                                        control={control}
                                        name="radiologyNotApplicable"
                                        render={({ field: checkboxField }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={checkboxField.value}
                                                        onCheckedChange={checkboxField.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel className="text-xs font-normal">No aplica</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormControl>
                                    <Textarea
                                        placeholder="Especifique los estudios de imagenología requeridos. Ej: RX de Tórax PA y Lateral, Ecografía Abdominal..."
                                        rows={3}
                                        {...field}
                                        disabled={radiologyNotApplicable}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </FormSection>
            
            <TreatmentOrderBuilder form={form} />

            <FormSection icon={<Wand2 className="h-5 w-5 text-primary"/>} title="Asistente de Récipe Médico con IA" className="bg-secondary/30">
                <Button type="button" onClick={handleGeneratePrescription} disabled={!canGeneratePrescription || isGenerating} className="w-full">
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Generar Récipe con IA (Basado en Plan General)
                </Button>
                {!canGeneratePrescription && <p className="text-xs text-center text-muted-foreground">Debe agregar al menos un diagnóstico y un plan general.</p>}
                {prescription && <PrescriptionDisplay prescription={prescription} />}
            </FormSection>
        </div>
    );
};
