'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, KeyRound, User as UserIcon, Shield, Link2, Stethoscope } from 'lucide-react';
import type { User, Role, Persona, DoctorSpecialty } from '@/lib/types';
import { PersonaSearch } from './persona-search';
import { Label } from './ui/label';

const specialties: { value: DoctorSpecialty; label: string }[] = [
    { value: 'medico general', label: 'Médico General' },
    { value: 'medico pediatra', label: 'Médico Pediatra' },
];

const baseSchema = z.object({
  username: z.string().min(3, { message: 'El nombre de usuario es requerido (mínimo 3 caracteres).' }),
  roleId: z.string({ required_error: 'El rol es requerido.' }),
  specialty: z.enum(['medico general', 'medico pediatra']).optional(),
  personaId: z.string().optional(),
});

const createUserSchema = baseSchema.extend({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
});

const updateUserSchema = baseSchema.extend({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.').optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
});


interface UserFormProps {
  user: User | null;
  roles: Role[];
  onSubmitted: (values: any) => Promise<void>;
  onCancel: () => void;
}

export function UserForm({ user, roles, onSubmitted, onCancel }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm({
    resolver: zodResolver(user ? updateUserSchema : createUserSchema),
    defaultValues: {
        username: user?.username || '',
        roleId: user?.role.id,
        specialty: user?.specialty,
        personaId: user?.personaId || '',
        password: '',
        confirmPassword: '',
    },
  });
  
  const handlePersonaSelect = React.useCallback((persona: Persona | null) => {
      form.setValue('personaId', persona?.id || '', { shouldValidate: true });
  }, [form]);
  
  const roleId = form.watch('roleId');
  const selectedRoleName = roles.find(r => r.id === roleId)?.name;

  async function onSubmit(values: any) {
    setIsSubmitting(true);
    const dataToSubmit = { ...values };
    if (!dataToSubmit.password) {
        delete dataToSubmit.password;
    }
    delete dataToSubmit.confirmPassword;
    await onSubmitted(dataToSubmit);
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-muted-foreground"/>Nombre de Usuario</FormLabel>
                  <FormControl>
                    <Input placeholder="ej. drsmith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground"/>Rol</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id} disabled={role.name === 'Superusuario' && user?.role.name !== 'Superusuario'}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedRoleName === 'Doctor' && (
                <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-muted-foreground"/>Especialidad</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Seleccione una especialidad" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {specialties.map(s => (
                            <SelectItem key={s.value} value={s.value} className="capitalize">{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-muted-foreground"/>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={user ? 'Dejar en blanco para no cambiar' : 'Mínimo 6 caracteres'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-muted-foreground"/>Confirmar Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="md:col-span-2 space-y-2">
                 <Label className="flex items-center gap-2"><Link2 className="h-4 w-4 text-muted-foreground"/>Vincular a Persona (Opcional)</Label>
                 <PersonaSearch
                    onPersonaSelect={handlePersonaSelect}
                    placeholder="Buscar persona para vincular..."
                 />
                 <FormField control={form.control} name="personaId" render={({field}) => <FormItem><FormControl><Input type="hidden" {...field} /></FormControl><FormMessage/></FormItem>}/>
                 <p className="text-xs text-muted-foreground">Vincula este inicio de sesión a un registro de persona para asociar su nombre.</p>
            </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {user ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
