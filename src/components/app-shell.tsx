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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogOut, Stethoscope, Users, User, Building, ClipboardPlus, Clock, FileHeart, Contact, ClipboardList, ClipboardCheck, Code2, AreaChart, UserCog, KeyRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import type { User as UserType } from '@/lib/types';
import { logout } from '@/actions/auth-actions';
import { ThemeToggle } from './theme-toggle';
import { ChangePasswordForm } from './change-password-form';

const allMenuOptions = [
  { href: '/dashboard', icon: <LayoutDashboard />, title: 'Dashboard', section: 'main' },
  { href: '/dashboard/sala-de-espera', icon: <Clock />, title: 'Sala de Espera', section: 'main' },
  { href: '/dashboard/consulta', icon: <ClipboardPlus />, title: 'Consulta', section: 'main' },
  { href: '/dashboard/hce', icon: <FileHeart />, title: 'HCE', section: 'main' },
  { href: '/dashboard/bitacora', icon: <ClipboardCheck />, title: 'Bitácora', section: 'main' },
  { href: '/dashboard/reportes', icon: <AreaChart />, title: 'Reportes', section: 'admin' },
  { href: '/dashboard/cie10', icon: <Code2 />, title: 'Catálogo CIE-10', section: 'admin' },
  { href: '/dashboard/personas', icon: <Contact />, title: 'Personas', section: 'admin' },
  { href: '/dashboard/lista-pacientes', icon: <ClipboardList />, title: 'Lista de Pacientes', section: 'admin' },
  { href: '/dashboard/pacientes', icon: <Users />, title: 'Gestión de Titulares', section: 'admin' },
  { href: '/dashboard/beneficiarios', icon: <User />, title: 'Beneficiarios', section: 'admin' },
  { href: '/dashboard/empresas', icon: <Building />, title: 'Empresas', section: 'admin' },
  { href: '/dashboard/usuarios', icon: <UserCog />, title: 'Gestión de Usuarios', section: 'admin' },
];

const permissions = {
  superuser: allMenuOptions.map(opt => opt.href),
  administrator: [
    '/dashboard', '/dashboard/reportes', '/dashboard/cie10', '/dashboard/personas', 
    '/dashboard/lista-pacientes', '/dashboard/pacientes', '/dashboard/beneficiarios', '/dashboard/empresas',
    '/dashboard/sala-de-espera'
  ],
  asistencial: [
    '/dashboard', '/dashboard/sala-de-espera', '/dashboard/pacientes', 
    '/dashboard/beneficiarios', '/dashboard/personas', '/dashboard/lista-pacientes'
  ],
  doctor: [
    '/dashboard', '/dashboard/sala-de-espera', '/dashboard/consulta', 
    '/dashboard/hce', '/dashboard/bitacora', '/dashboard/reportes'
  ],
  enfermera: [
    '/dashboard', '/dashboard/bitacora', '/dashboard/sala-de-espera'
  ],
};

const UserContext = React.createContext<UserType | null>(null);

export function useUser() {
    const context = React.useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider provided by AppShell');
    }
    return context;
}

export function AppShell({ children, user }: { children: React.ReactNode, user: UserType }) {
  const pathname = usePathname();
  const accessiblePaths = permissions[user.role] || [];
  const menuOptions = allMenuOptions.filter(opt => accessiblePaths.includes(opt.href));
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);

  return (
    <UserContext.Provider value={user}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <h2 className="text-lg font-semibold font-headline">CareFlow</h2>
                <p className="text-sm text-muted-foreground">Central</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuOptions.map(option => (
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
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <main className="min-h-svh flex-1 flex-col bg-background peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6">
            <SidebarTrigger />
            <div className="flex-1">
              {/* Header content can go here */}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <span className="sr-only">{user.name}</span>
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
                        {user.username}
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
