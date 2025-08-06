
'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/actions/auth-actions';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SaludIntegralLogo } from '@/components/logo-salud-integral';

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
    <main className="flex items-center justify-center min-h-screen w-full login-background">
      <Card className="w-full max-w-sm shadow-xl">
        <form action={formAction}>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="p-2 bg-primary/10 rounded-full">
                <SaludIntegralLogo className="h-16 w-16 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-headline">MediHub</CardTitle>
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
