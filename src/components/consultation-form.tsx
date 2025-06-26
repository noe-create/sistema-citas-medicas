'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, PlusCircle, Wand2, Paperclip, File as FileIcon, Trash2, UploadCloud } from 'lucide-react';
import type { Patient, Cie10Code, Diagnosis, CreateConsultationDocumentInput, DocumentType } from '@/lib/types';
import { searchCie10Codes, createConsultation } from '@/actions/patient-actions';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Badge } from './ui/badge';
import { generatePrescription } from '@/ai/flows/generate-prescription';
import type { GeneratePrescriptionOutput } from '@/ai/flows/generate-prescription';
import { PrescriptionDisplay } from './prescription-display';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';

const consultationSchema = z.object({
  anamnesis: z.string().min(1, 'La anamnesis es obligatoria.'),
  physicalExam: z.string().min(1, 'El examen físico es obligatorio.'),
  diagnoses: z.array(z.object({
    cie10Code: z.string(),
    cie10Description: z.string(),
  })).min(1, 'Se requiere al menos un diagnóstico.'),
  treatmentPlan: z.string().min(1, 'El plan de tratamiento es obligatorio.'),
});

const documentTypes = ['laboratorio', 'imagenologia', 'informe medico', 'otro'] as const;

interface FileUploadState {
    file: File;
    documentType: DocumentType;
    description: string;
    id: string; // for stable keys in React
}

interface ConsultationFormProps {
    patient: Patient;
    onConsultationComplete: () => void;
}

export function ConsultationForm({ patient, onConsultationComplete }: ConsultationFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [prescription, setPrescription] = React.useState<GeneratePrescriptionOutput | null>(null);
    const [filesToUpload, setFilesToUpload] = React.useState<FileUploadState[]>([]);

    const form = useForm<z.infer<typeof consultationSchema>>({
        resolver: zodResolver(consultationSchema),
        defaultValues: {
            anamnesis: '',
            physicalExam: '',
            treatmentPlan: '',
            diagnoses: [],
        }
    });

    const { watch } = form;
    const diagnoses = watch('diagnoses');
    const treatmentPlan = watch('treatmentPlan');

    const canGeneratePrescription = diagnoses.length > 0 && treatmentPlan.trim().length > 0;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files).map(file => ({
                file,
                documentType: 'laboratorio' as DocumentType,
                description: '',
                id: `${file.name}-${file.lastModified}-${Math.random()}`
            }));
            setFilesToUpload(prev => [...prev, ...newFiles]);
            event.target.value = ''; // Allow selecting the same file again
        }
    };

    const handleFileMetadataChange = (id: string, field: 'documentType' | 'description', value: string) => {
        setFilesToUpload(prev =>
            prev.map(fileState =>
                fileState.id === id ? { ...fileState, [field]: value } : fileState
            )
        );
    };

    const handleRemoveFile = (id: string) => {
        setFilesToUpload(prev => prev.filter((f) => f.id !== id));
    };


    async function onSubmit(values: z.infer<typeof consultationSchema>) {
        setIsSubmitting(true);

        try {
            const documentsData: CreateConsultationDocumentInput[] = await Promise.all(
                filesToUpload.map(fileState => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(fileState.file);
                        reader.onload = () => resolve({
                            fileName: fileState.file.name,
                            fileType: fileState.file.type,
                            documentType: fileState.documentType,
                            description: fileState.description,
                            fileData: reader.result as string,
                        });
                        reader.onerror = error => reject(error);
                    });
                })
            );

            await createConsultation({
                ...values,
                waitlistId: patient.id,
                pacienteId: patient.pacienteId,
                documents: documentsData,
            });
            
            toast({
                title: 'Consulta Guardada y Completada',
                description: `La historia clínica de ${patient.name} ha sido actualizada.`,
            });
            
            form.reset();
            onConsultationComplete();

        } catch (error) {
            console.error("Error saving consultation:", error);
            toast({
                title: 'Error al guardar la consulta',
                description: 'No se pudo registrar la consulta. Intente de nuevo.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
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


  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
                <CardTitle>Formulario de Consulta</CardTitle>
                <CardDescription>
                Registre los detalles de la consulta. Al guardar, el paciente saldrá de la cola de espera.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                     <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="anamnesis"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Anamnesis</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Motivo de consulta, historia de la enfermedad actual..." {...field} rows={6} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="physicalExam"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Examen Físico</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Signos vitales, hallazgos por sistema..." {...field} rows={6} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                     </div>
                     <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="diagnoses"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Diagnóstico(s) CIE-10</FormLabel>
                                    <Cie10Autocomplete 
                                        selected={field.value}
                                        onChange={field.onChange}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="treatmentPlan"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Plan de Tratamiento / Indicaciones</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Indicaciones, prescripciones, estudios solicitados..." {...field} rows={6} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                     </div>
                </div>

                <Separator />

                <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <Paperclip className="h-5 w-5" /> Documentos Adjuntos
                    </h3>
                     <div className="flex items-center justify-center w-full">
                        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary/50">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click para cargar</span> o arrastrar y soltar</p>
                                <p className="text-xs text-muted-foreground">PDF, PNG, JPG, etc.</p>
                            </div>
                            <input id="file-upload" type="file" className="hidden" multiple onChange={handleFileChange} />
                        </label>
                    </div> 
                    {filesToUpload.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="font-medium text-sm">Archivos para subir:</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filesToUpload.map((fileState) => (
                                <Card key={fileState.id} className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <span className="truncate font-medium text-sm">{fileState.file.name}</span>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveFile(fileState.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`docType-${fileState.id}`}>Tipo de Documento</Label>
                                        <Select
                                            value={fileState.documentType}
                                            onValueChange={(value: DocumentType) => handleFileMetadataChange(fileState.id, 'documentType', value)}
                                        >
                                            <SelectTrigger id={`docType-${fileState.id}`}>
                                                <SelectValue placeholder="Seleccionar tipo..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {documentTypes.map(type => (
                                                    <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`desc-${fileState.id}`}>Descripción</Label>
                                        <Input
                                            id={`desc-${fileState.id}`}
                                            value={fileState.description}
                                            onChange={(e) => handleFileMetadataChange(fileState.id, 'description', e.target.value)}
                                            placeholder="Ej. Rayos X de tórax"
                                        />
                                    </div>
                                </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <Separator />

                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Asistente de Récipe Médico</h3>
                    <p className="text-sm text-muted-foreground">
                        Use la IA para generar una receta médica formal basada en el plan de tratamiento.
                    </p>
                    <Button type="button" onClick={handleGeneratePrescription} disabled={!canGeneratePrescription || isGenerating} className="w-full">
                        {isGenerating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                             <Wand2 className="mr-2 h-4 w-4" />
                        )}
                        Generar Récipe con IA
                    </Button>
                    {!canGeneratePrescription && <p className="text-xs text-center text-muted-foreground">Debe agregar al menos un diagnóstico y un plan de tratamiento.</p>}

                    {prescription && <PrescriptionDisplay prescription={prescription} />}
                </div>

            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                 <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar y Completar Consulta
                 </Button>
            </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

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
                        Añadir diagnóstico
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
