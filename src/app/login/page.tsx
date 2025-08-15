'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/actions/auth-actions';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
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
    <main className="flex items-stretch justify-center min-h-screen w-full">
      <div className="flex w-full">
        {/* Left Side: Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-sm">
            <form action={formAction}>
              <div className="text-center mb-8">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 bg-primary/10 rounded-full">
                     <SaludIntegralLogo className="h-14 w-14"/>
                  </div>
                </div>
                <h1 className="text-2xl font-headline">Bienvenido a MediHub</h1>
                <p className="text-muted-foreground mt-1">Ingrese sus credenciales para acceder al sistema.</p>
              </div>

              <div className="space-y-4">
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
              </div>
              
              <div className="mt-6">
                <LoginButton />
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Image */}
        <div className="hidden lg:block w-1/2 relative">
            <Image 
                src="https://placehold.co/1200x1800.png"
                alt="Fondo de clínica moderna"
                fill
                className="object-cover"
                data-ai-hint="modern clinic"
            />
             <div className="absolute inset-0 bg-primary/30 mix-blend-multiply"></div>
        </div>
      </div>
    </main>
  );
}
