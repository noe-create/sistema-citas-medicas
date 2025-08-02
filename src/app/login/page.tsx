
'use client';

import * as React from 'react';
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
        className="relative flex min-h-screen items-center justify-center p-4 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://storage.googleapis.com/project-spark-b2489c6d-341a-47b2-9a4c-834c3d9a2632/public/view/6610738d-8798-4b0c-a968-45a828117798.png')`,
        }}
    >
      <Card className="w-full max-w-sm z-10 shadow-2xl bg-card/80 backdrop-blur-sm">
        <form action={formAction}>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
                <ViñaIntegralLogo className="h-20 w-20" />
            </div>
            <CardTitle className="text-2xl font-headline">Viña Integral</CardTitle>
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
