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
  CalendarDays,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getWaitlistCount, getTodayConsultationsCount, getTodayRegisteredPeopleCount } from '@/actions/patient-actions';

interface MenuOption {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  permission: string;
  kpi?: () => Promise<number>;
  kpiDescription?: string;
}

const menuOptions: MenuOption[] = [
  {
    href: '/dashboard/agenda',
    icon: <CalendarDays className="h-6 w-6 text-primary" />,
    title: 'Agenda',
    description: 'Gestione las citas programadas de los pacientes.',
    permission: 'agenda.manage',
  },
  {
    href: '/dashboard/sala-de-espera',
    icon: <Clock className="h-6 w-6 text-primary" />,
    title: 'Sala de Espera',
    description: 'Gestione la cola de pacientes en tiempo real.',
    permission: 'waitlist.manage',
    kpi: getWaitlistCount,
    kpiDescription: 'Pacientes en Cola'
  },
  {
    href: '/dashboard/consulta',
    icon: <ClipboardPlus className="h-6 w-6 text-primary" />,
    title: 'Consulta',
    description: 'Acceda al módulo de atención médica.',
    permission: 'consultation.perform',
    kpi: getTodayConsultationsCount,
    kpiDescription: 'Consultas Hoy'
  },
  {
    href: '/dashboard/personas',
    icon: <Contact className="h-6 w-6 text-primary" />,
    title: 'Personas',
    description: 'Repositorio central de individuos del sistema.',
    permission: 'people.manage',
    kpi: getTodayRegisteredPeopleCount,
    kpiDescription: 'Nuevos Registros Hoy'
  },
  {
    href: '/dashboard/hce',
    icon: <FileHeart className="h-6 w-6 text-primary" />,
    title: 'Historia Clínica',
    description: 'Busque y consulte el historial de los pacientes.',
    permission: 'hce.view',
  },
  {
    href: '/dashboard/bitacora',
    icon: <ClipboardCheck className="h-6 w-6 text-primary" />,
    title: 'Bitácora de Tratamiento',
    description: 'Cree y siga las órdenes de tratamiento.',
    permission: 'treatmentlog.manage',
  },
  {
    href: '/dashboard/reportes',
    icon: <AreaChart className="h-6 w-6 text-primary" />,
    title: 'Reportes',
    description: 'Visualice métricas y reportes de morbilidad.',
    permission: 'reports.view',
  },
  {
    href: '/dashboard/cie10',
    icon: <Code2 className="h-6 w-6 text-primary" />,
    title: 'Catálogo CIE-10',
    description: 'Gestione el catálogo de códigos de diagnóstico.',
    permission: 'cie10.manage',
  },
  {
    href: '/dashboard/lista-pacientes',
    icon: <ClipboardList className="h-6 w-6 text-primary" />,
    title: 'Lista de Pacientes',
    description: 'Consulte los pacientes con historial médico.',
    permission: 'patientlist.view',
  },
  {
    href: '/dashboard/pacientes',
    icon: <Users className="h-6 w-6 text-primary" />,
    title: 'Gestión de Titulares',
    description: 'Administre los perfiles de los titulares.',
    permission: 'titulars.manage',
  },
  {
    href: '/dashboard/beneficiarios',
    icon: <User className="h-6 w-6 text-primary" />,
    title: 'Beneficiarios',
    description: 'Consulte la lista de todos los beneficiarios.',
    permission: 'beneficiaries.manage',
  },
  {
    href: '/dashboard/empresas',
    icon: <Building className="h-6 w-6 text-primary" />,
    title: 'Empresas',
    description: 'Gestione las empresas y convenios afiliados.',
    permission: 'companies.manage',
  },
  {
    href: '/dashboard/usuarios',
    icon: <UserCog className="h-6 w-6 text-primary" />,
    title: 'Gestión de Usuarios',
    description: 'Administre los usuarios y roles del sistema.',
    permission: 'users.manage',
  },
];

const KpiCard = async ({ option }: { option: MenuOption }) => {
  const kpiValue = await option.kpi?.();

  return (
    <Link href={option.href} className="flex">
      <Card className="flex flex-col w-full transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">{option.title}</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              {option.icon}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-end">
          {kpiValue !== undefined ? (
            <div>
              <p className="text-4xl font-bold">{kpiValue}</p>
              <p className="text-sm text-muted-foreground">{option.kpiDescription}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{option.description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default async function DashboardPage() {
    const session = await getSession();
    const user = session.user!;
    
    const hasPermission = (permission: string) => {
      if (permission === '*') return true;
      if (user.role.name === 'Superusuario') return true;
      return session.permissions?.includes(permission);
    };

    const visibleMenuOptions = menuOptions.filter(
        option => hasPermission(option.permission)
    );

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Dashboard Principal</h2>
      </div>
      <div className="grid gap-6 transition-all duration-300 ease-in-out md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleMenuOptions.map((option) => (
          <KpiCard key={option.href} option={option} />
        ))}
      </div>
    </div>
  );
}
