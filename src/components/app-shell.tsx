
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
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogOut, Stethoscope, Users, User, Building, ClipboardPlus, Clock, FileHeart, Contact, ClipboardUser } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
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
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard'}
                tooltip="Dashboard"
              >
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/dashboard/sala-de-espera')}
                tooltip="Sala de Espera"
              >
                <Link href="/dashboard/sala-de-espera">
                  <Clock />
                  <span>Sala de Espera</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/dashboard/consulta')}
                tooltip="Consulta"
              >
                <Link href="/dashboard/consulta">
                  <ClipboardPlus />
                  <span>Consulta</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/dashboard/hce')}
                tooltip="HCE"
              >
                <Link href="/dashboard/hce">
                  <FileHeart />
                  <span>HCE</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/dashboard/personas')}
                tooltip="Personas"
              >
                <Link href="/dashboard/personas">
                  <Contact />
                  <span>Personas</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/dashboard/lista-pacientes')}
                tooltip="Lista de Pacientes"
              >
                <Link href="/dashboard/lista-pacientes">
                  <ClipboardUser />
                  <span>Lista de Pacientes</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/dashboard/pacientes')}
                tooltip="Gestión de Titulares"
              >
                <Link href="/dashboard/pacientes">
                  <Users />
                  <span>Gestión de Titulares</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/dashboard/beneficiarios')}
                tooltip="Beneficiarios"
              >
                <Link href="/dashboard/beneficiarios">
                  <User />
                  <span>Beneficiarios</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/dashboard/empresas')}
                tooltip="Empresas"
              >
                <Link href="/dashboard/empresas">
                  <Building />
                  <span>Empresas</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="justify-start w-full px-2">
                   <div className="flex justify-between items-center w-full">
                    <div className="flex gap-2 items-center">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="https://placehold.co/40x40.png" alt="Dr. Smith" data-ai-hint="doctor portrait"/>
                        <AvatarFallback>DS</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-medium">Dr. Smith</span>
                        <span className="text-xs text-muted-foreground">Médico</span>
                      </div>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Dr. Smith</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      dr.smith@careflow.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <main className="min-h-svh flex-1 flex-col bg-background peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6">
          <SidebarTrigger />
          <div className="flex-1">
             {/* Header content can go here */}
          </div>
        </header>
        {children}
      </main>
    </SidebarProvider>
  );
}
