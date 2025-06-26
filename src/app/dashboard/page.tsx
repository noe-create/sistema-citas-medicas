'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Clock,
  ClipboardPlus,
  Users,
  User,
  Building,
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

const menuOptions = [
  {
    href: '/dashboard/sala-de-espera',
    icon: <Clock className="h-8 w-8 text-primary" />,
    title: 'Sala de Espera',
    description: 'Gestione la cola de pacientes en tiempo real.',
  },
  {
    href: '/dashboard/consulta',
    icon: <ClipboardPlus className="h-8 w-8 text-primary" />,
    title: 'Consulta',
    description: 'Acceda al módulo de atención médica.',
  },
  {
    href: '/dashboard/pacientes',
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Titulares',
    description: 'Administre los perfiles de los titulares.',
  },
  {
    href: '/dashboard/beneficiarios',
    icon: <User className="h-8 w-8 text-primary" />,
    title: 'Beneficiarios',
    description: 'Consulte la lista de todos los beneficiarios.',
  },
  {
    href: '/dashboard/empresas',
    icon: <Building className="h-8 w-8 text-primary" />,
    title: 'Empresas',
    description: 'Gestione las empresas y convenios afiliados.',
  },
];

export default function DashboardPage() {
    const { state } = useSidebar();
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Dashboard Principal</h2>
      </div>
      <div className={`grid gap-6 transition-all duration-300 ease-in-out md:grid-cols-2 ${state === 'expanded' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
        {menuOptions.map((option) => (
          <Link href={option.href} key={option.href} className="flex">
            <Card className="flex flex-col w-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex flex-col space-y-1.5">
                        <CardTitle className="text-xl font-bold">{option.title}</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">{option.description}</CardDescription>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg">
                        {option.icon}
                    </div>
                </div>
              </CardHeader>
               <CardContent className="flex-grow"/>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
