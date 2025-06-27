'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import type { Role, Permission } from '@/lib/types';
import { PERMISSION_MODULES } from '@/lib/permissions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const roleSchema = z.object({
  name: z.string().min(3, { message: 'El nombre del rol es requerido.' }),
  description: z.string().min(1, 'La descripción es requerida.'),
  permissions: z.array(z.string()).refine(value => value.some(item => item), {
    message: 'Debe seleccionar al menos un permiso.',
  }),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormProps {
  role: (Role & { permissions?: string[] }) | null;
  allPermissions: Permission[];
  onSubmitted: (values: RoleFormValues) => Promise<void>;
  onCancel: () => void;
}

export function RoleForm({ role, allPermissions, onSubmitted, onCancel }: RoleFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || '',
      description: role?.description || '',
      permissions: role?.permissions || [],
    },
  });

  const groupedPermissions = React.useMemo(() => {
    return PERMISSION_MODULES.map(module => ({
      name: module,
      permissions: allPermissions.filter(p => p.module === module),
    }));
  }, [allPermissions]);

  async function onSubmit(values: RoleFormValues) {
    setIsSubmitting(true);
    await onSubmitted(values);
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4 max-h-[65vh] overflow-y-auto p-1">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Rol</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Recepcionista" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe el propósito de este rol" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="permissions"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Permisos</FormLabel>
                </div>
                <Accordion type="multiple" className="w-full">
                  {groupedPermissions.map(group => (
                    <AccordionItem value={group.name} key={group.name}>
                       <AccordionTrigger>{group.name}</AccordionTrigger>
                       <AccordionContent>
                            <div className="space-y-2 pl-2">
                                {group.permissions.map((permission) => (
                                    <FormField
                                    key={permission.id}
                                    control={form.control}
                                    name="permissions"
                                    render={({ field }) => {
                                        return (
                                        <FormItem
                                            key={permission.id}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                            <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(permission.id)}
                                                onCheckedChange={(checked) => {
                                                return checked
                                                    ? field.onChange([...field.value, permission.id])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                        (value) => value !== permission.id
                                                        )
                                                    );
                                                }}
                                            />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="font-normal">{permission.name}</FormLabel>
                                                <p className="text-xs text-muted-foreground">{permission.description}</p>
                                            </div>
                                        </FormItem>
                                        );
                                    }}
                                    />
                                ))}
                            </div>
                       </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {role ? 'Guardar Cambios' : 'Crear Rol'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
