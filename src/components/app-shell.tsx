
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { 
    LayoutGrid, 
    LogOut, 
    Users, 
    User,
    Building2, 
    Clock, 
    HeartPulse, 
    ClipboardCheck, 
    BookText, 
    AreaChart, 
    UserCog, 
    KeyRound, 
    MessageSquareQuote,
    DollarSign,
    ShieldCheck,
    UsersRound,
    Stethoscope,
    CalendarDays
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import type { User as UserType } from '@/lib/types';
import { logout } from '@/actions/auth-actions';
import { ThemeToggle } from './theme-toggle';
import { ChangePasswordForm } from './change-password-form';
import { MedihubLogo } from './medihub-logo';

interface MenuItem {
    href: string;
    icon: React.ReactNode;
    title: string;
    permission: string;
    subItems?: MenuItem[];
    group?: string;
}

const allMenuOptions: MenuItem[] = [
  { href: '/dashboard', icon: <LayoutGrid />, title: 'Dashboard', permission: '*', group: 'Principal' },
  { href: '/dashboard/sala-de-espera', icon: <Clock />, title: 'Sala de Espera', permission: 'waitlist.manage', group: 'Atención' },
  { href: '/dashboard/consulta', icon: <Stethoscope />, title: 'Consulta', permission: 'consultation.perform', group: 'Atención' },
  { href: '/dashboard/hce', icon: <HeartPulse />, title: 'Historia Clínica', permission: 'hce.view', group: 'Atención' },
  { href: '/dashboard/bitacora', icon: <ClipboardCheck />, title: 'Bitácora', permission: 'treatmentlog.manage', group: 'Atención' },
  
  { href: '/dashboard/reportes', icon: <AreaChart />, title: 'Reportes', permission: 'reports.view', group: 'Reportes' },
  { href: '/dashboard/encuestas', icon: <MessageSquareQuote />, title: 'Encuestas', permission: 'surveys.manage', group: 'Reportes' },
  
  { href: '/dashboard/personas', icon: <User />, title: 'Personas', permission: 'people.manage', group: 'Admisión' },
  { href: '/dashboard/lista-pacientes', icon: <Users />, title: 'Lista de Pacientes', permission: 'patientlist.view', group: 'Admisión' },
  { href: '/dashboard/pacientes', icon: <ShieldCheck />, title: 'Titulares', permission: 'titulars.manage', group: 'Admisión' },
  { href: '/dashboard/beneficiarios', icon: <UsersRound />, title: 'Beneficiarios', permission: 'beneficiaries.manage', group: 'Admisión' },
  
  { href: '/dashboard/empresas', icon: <Building2 />, title: 'Empresas', permission: 'companies.manage', group: 'Parametrización' },
  { href: '/dashboard/cie10', icon: <BookText />, title: 'Catálogo CIE-10', permission: 'cie10.manage', group: 'Parametrización' },
  { href: '/dashboard/servicios', icon: <DollarSign />, title: 'Servicios y Tarifas', permission: 'services.manage', group: 'Parametrización' },

  { href: '/dashboard/usuarios', icon: <UserCog />, title: 'Usuarios', permission: 'users.manage', group: 'Seguridad' },
  { href: '/dashboard/seguridad/roles', icon: <KeyRound />, title: 'Roles', permission: 'roles.manage', group: 'Seguridad' },
];

const menuGroups = ['Principal', 'Atención', 'Admisión', 'Reportes', 'Parametrización', 'Seguridad'];

interface UserContextValue extends UserType {
    permissions: string[];
}
const UserContext = React.createContext<UserContextValue | null>(null);

export function useUser() {
    const context = React.useContext(UserContext);
    if (!context) {
        throw new Error('useUser debe ser usado dentro de un AppShell');
    }
    return context;
}

export function AppShell({ children, user, permissions }: { children: React.ReactNode, user: UserType, permissions: string[] }) {
  const pathname = usePathname();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
  const userWithPermissions = { ...user, permissions };
  
  const hasPermission = (permission: string) => {
    if (permission === '*') return true;
    if (user.role.name === 'Superusuario') return true;
    return permissions.includes(permission);
  };

  const visibleMenuOptions = allMenuOptions.filter(opt => hasPermission(opt.permission));
  
  const groupedMenu = menuGroups.map(group => ({
    name: group,
    items: visibleMenuOptions.filter(item => item.group === group),
  })).filter(group => group.items.length > 0);


  return (
    <UserContext.Provider value={userWithPermissions}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
             <Link href="/dashboard" className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0">
                <MedihubLogo className="h-8 w-8" />
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                  <h2 className="text-lg font-semibold font-headline tracking-wide">Medihub</h2>
                  <p className="text-xs text-muted-foreground -mt-1">Centro Policlínico Valencia</p>
                </div>
             </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
               {groupedMenu.map((group) => (
                    <SidebarGroup key={group.name}>
                        <SidebarGroupLabel className="group-data-[collapsible=icon]:justify-center">
                            {group.name}
                        </SidebarGroupLabel>
                        {group.items.map(option => (
                            <SidebarMenuItem key={option.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname.startsWith(option.href)}
                                    tooltip={option.title}
                                >
                                    <Link href={option.href}>
                                        {option.icon}
                                        <span>{option.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarGroup>
                ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <main className="min-h-svh flex-1 flex-col bg-background peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6">
            <SidebarTrigger />
            <div className="flex-1">
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback asChild>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.username} ({user.role.name})
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setIsChangePasswordOpen(true)}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    <span>Cambiar Contraseña</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                    <form action={logout}>
                      <DropdownMenuItem asChild>
                          <button type="submit" className="w-full">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar Sesión</span>
                          </button>
                      </DropdownMenuItem>
                    </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          {children}
        </main>
      </SidebarProvider>

       <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Para proteger su cuenta, introduzca su contraseña actual y luego la nueva.
            </DialogDescription>
          </DialogHeader>
          <ChangePasswordForm onFinished={() => setIsChangePasswordOpen(false)} />
        </DialogContent>
      </Dialog>
    </UserContext.Provider>
  );
}
