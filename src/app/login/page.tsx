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

const backgroundImages = [
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2940&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=2128&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1603398938378-e54eab446dde?q=80&w=2940&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1581091870622-9e5b3949f252?q=80&w=2940&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1579684453423-f8434936e161?q=80&w=2849&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551190822-a9333d802b91?q=80&w=2940&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527613426441-4da17471b66d?q=80&w=2934&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1580281657422-2b58b44983e2?q=80&w=2940&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=2940&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1576765974102-b32d5c554a22?q=80&w=2835&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1478479405421-ce83c922e24c?q=80&w=2940&auto=format&fit=crop'
];


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
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <main 
        className="relative flex min-h-screen items-center justify-center p-4 bg-black overflow-hidden"
    >
       <div className="absolute inset-0 z-0">
        {backgroundImages.map((src, index) => (
          <div
            key={src}
            className="absolute inset-0 h-full w-full bg-cover bg-center transition-opacity duration-1000"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${src}')`,
              opacity: index === currentImageIndex ? 1 : 0,
            }}
          />
        ))}
      </div>

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
