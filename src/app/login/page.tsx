
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/actions/auth-actions';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ViñaIntegralLogo } from '@/components/viña-integral-logo';

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Iniciar Sesión
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, { error: undefined, success: false });

  return (
    <main 
        className="flex min-h-screen items-center justify-center p-4"
        style={{
            background: 'hsl(var(--background))',
            backgroundImage: 'radial-gradient(circle at top left, hsl(var(--primary)/0.1), transparent 40%), radial-gradient(circle at bottom right, hsl(var(--primary)/0.1), transparent 40%)'
        }}
    >
      <Card className="w-full max-w-sm">
        <form action={formAction}>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
                <ViñaIntegralLogo className="h-20 w-20" />
            </div>
            <CardTitle className="text-2xl font-bold font-headline tracking-wide">Viña Integral</CardTitle>
            <CardDescription>Ingrese sus credenciales para acceder al sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input id="username" name="username" placeholder="su.usuario" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required />
            </div>
             {state.error && (
                <Alert variant="destructive">
                    <AlertTitle>Error de Autenticación</AlertTitle>
                    <AlertDescription>{state.error}</AlertDescription>
                </Alert>
            )}
          </CardContent>
          <CardFooter>
            <LoginButton />
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
