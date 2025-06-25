'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { suggestConsentForm, type SuggestConsentFormOutput } from '@/ai/flows/suggest-consent-form';
import type { ServiceType } from '@/lib/types';
import { FileText, Loader2, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface ConsentFormSuggesterProps {
  serviceType: ServiceType;
}

export function ConsentFormSuggester({ serviceType }: ConsentFormSuggesterProps) {
  const [suggestion, setSuggestion] = React.useState<SuggestConsentFormOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSuggestForm = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const result = await suggestConsentForm({ serviceType });
      setSuggestion(result);
    } catch (e) {
      setError('No se pudo obtener la sugerencia. Por favor, inténtelo de nuevo.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asistente de Consentimiento con IA</CardTitle>
        <CardDescription>
          Deje que la IA sugiera el formulario de consentimiento apropiado según el tipo de servicio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleSuggestForm} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Sugerir Formulario
        </Button>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {suggestion && (
          <div className="p-4 border rounded-lg bg-secondary/50">
             <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-accent" />
                <h3 className="font-semibold text-lg">{suggestion.suggestedFormName}</h3>
             </div>
             <p className="text-sm text-muted-foreground">{suggestion.suggestedFormDescription}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
