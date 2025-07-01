'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Clock,
  ClipboardPlus,
  Users,
  User,
  Building,
  FileHeart,
  Contact,
  ClipboardList,
  ClipboardCheck,
  Code2,
  AreaChart,
  UserCog,
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { useUser } from '@/components/app-shell';
import type { Role } from '@/lib/types';

interface MenuOption {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  roles?: string[];
}

const menuOptions: MenuOption[] = [
  {
    href: '/dashboard/sala-de-espera',
    icon: <Clock className="h-8 w-8 text-primary" />,
    title: 'Sala de Espera',
    description: 'Gestione la cola de pacientes en tiempo real.',
    roles: ['asistencial', 'doctor', 'enfermera', 'superuser'],
  },
  {
    href: '/dashboard/consulta',
    icon: <ClipboardPlus className="h-8 w-8 text-primary" />,
    title: 'Consulta',
    description: 'Acceda al módulo de atención médica.',
    roles: ['doctor', 'superuser'],
  },
   {
    href: '/dashboard/hce',
    icon: <FileHeart className="h-8 w-8 text-primary" />,
    title: 'Historia Clínica',
    description: 'Busque y consulte el historial de los pacientes.',
    roles: ['doctor', 'superuser'],
  },
   {
    href: '/dashboard/bitacora',
    icon: <ClipboardCheck className="h-8 w-8 text-primary" />,
    title: 'Bitácora de Tratamiento',
    description: 'Cree y siga las órdenes de tratamiento.',
    roles: ['doctor', 'enfermera', 'superuser'],
  },
  {
    href: '/dashboard/reportes',
    icon: <AreaChart className="h-8 w-8 text-primary" />,
    title: 'Reportes',
    description: 'Visualice métricas y reportes de morbilidad.',
    roles: ['doctor', 'administrator', 'superuser'],
  },
  {
    href: '/dashboard/cie10',
    icon: <Code2 className="h-8 w-8 text-primary" />,
    title: 'Catálogo CIE-10',
    description: 'Gestione el catálogo de códigos de diagnóstico.',
    roles: ['administrator', 'superuser'],
  },
  {
    href: '/dashboard/personas',
    icon: <Contact className="h-8 w-8 text-primary" />,
    title: 'Personas',
    description: 'Repositorio central de individuos del sistema.',
    roles: ['asistencial', 'administrator', 'superuser'],
  },
  {
    href: '/dashboard/lista-pacientes',
    icon: <ClipboardList className="h-8 w-8 text-primary" />,
    title: 'Lista de Pacientes',
    description: 'Consulte los pacientes con historial médico.',
    roles: ['asistencial', 'administrator', 'superuser'],
  },
  {
    href: '/dashboard/pacientes',
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Gestión de Titulares',
    description: 'Administre los perfiles de los titulares.',
    roles: ['asistencial', 'administrator', 'superuser'],
  },
  {
    href: '/dashboard/beneficiarios',
    icon: <User className="h-8 w-8 text-primary" />,
    title: 'Beneficiarios',
    description: 'Consulte la lista de todos los beneficiarios.',
    roles: ['asistencial', 'administrator', 'superuser'],
  },
  {
    href: '/dashboard/empresas',
    icon: <Building className="h-8 w-8 text-primary" />,
    title: 'Empresas',
    description: 'Gestione las empresas y convenios afiliados.',
    roles: ['administrator', 'superuser'],
  },
  {
    href: '/dashboard/usuarios',
    icon: <UserCog className="h-8 w-8 text-primary" />,
    title: 'Gestión de Usuarios',
    description: 'Administre los usuarios y roles del sistema.',
    roles: ['superuser'],
  },
];

export default function DashboardPage() {
    const { state } = useSidebar();
    const user = useUser();
    
    const visibleMenuOptions = menuOptions.filter(
        option => !option.roles || option.roles.includes(user.role.id)
    );

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Dashboard Principal</h2>
      </div>
      <div className={`grid gap-6 transition-all duration-300 ease-in-out md:grid-cols-2 ${state === 'expanded' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
        {visibleMenuOptions.map((option) => (
          <Link href={option.href} key={option.href} className="flex">
            <Card className="flex flex-col w-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-center justify-between">
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
