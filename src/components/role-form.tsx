
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, GripVertical } from 'lucide-react';
import type { Role, Permission } from '@/lib/types';
import { PERMISSION_MODULES } from '@/lib/permissions';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

const roleSchema = z.object({
  name: z.string().min(3, { message: 'El nombre del rol es requerido.' }),
  description: z.string().min(1, 'La descripción es requerida.'),
  permissions: z.array(z.string()).min(1, 'Debe asignar al menos un permiso.'),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormProps {
  role: (Role & { permissions?: string[] }) | null;
  allPermissions: Permission[];
  onSubmitted: (values: RoleFormValues) => Promise<void>;
  onCancel: () => void;
}

const SortablePermission = ({ permission }: { permission: Permission }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: permission.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="mb-2">
      <Card className="p-3 bg-card hover:bg-muted/80">
        <div className="flex items-start gap-2">
          <button type="button" {...listeners} className="cursor-grab p-1">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex-1">
            <p className="font-semibold text-sm">{permission.name}</p>
            <p className="text-xs text-muted-foreground">{permission.description}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

const PermissionColumn = ({ id, title, permissions }: { id: string; title: string; permissions: Permission[] }) => {
  return (
    <Card className="flex-1 flex flex-col min-h-[400px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <ScrollArea className="flex-grow p-4 pt-0">
        <SortableContext id={id} items={permissions} strategy={verticalListSortingStrategy}>
          {permissions.length > 0 ? (
            permissions.map((p) => <SortablePermission key={p.id} permission={p} />)
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No hay permisos aquí.
            </div>
          )}
        </SortableContext>
      </ScrollArea>
    </Card>
  );
};


export function RoleForm({ role, allPermissions, onSubmitted, onCancel }: RoleFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [containers, setContainers] = React.useState<{ available: Permission[]; assigned: Permission[] }>({
    available: [],
    assigned: [],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    const assignedIds = new Set(role?.permissions || []);
    const assigned = allPermissions.filter(p => assignedIds.has(p.id));
    const available = allPermissions.filter(p => !assignedIds.has(p.id));
    setContainers({ available, assigned });
  }, [role, allPermissions]);
  
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || '',
      description: role?.description || '',
      permissions: role?.permissions || [],
    },
  });

  React.useEffect(() => {
    form.setValue('permissions', containers.assigned.map(p => p.id));
  }, [containers.assigned, form]);


  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = active.data.current?.sortable.containerId;
    const overContainer = over.data.current?.sortable.containerId;
    
    if (!activeContainer || !overContainer) return;

    setContainers(prev => {
        const activeItems = prev[activeContainer as keyof typeof prev];
        const overItems = prev[overContainer as keyof typeof prev];

        if (activeContainer === overContainer) {
            const activeIndex = activeItems.findIndex(item => item.id === activeId);
            const overIndex = overItems.findIndex(item => item.id === overId);
            return {
                ...prev,
                [activeContainer]: arrayMove(activeItems, activeIndex, overIndex)
            }
        } else {
            const activeIndex = activeItems.findIndex(item => item.id === activeId);
            let overIndex = overItems.findIndex(item => item.id === overId);
            
            // If dropping on container but not on an item
            if (overIndex < 0) {
                overIndex = overItems.length;
            }

            return {
                ...prev,
                [activeContainer]: activeItems.filter(item => item.id !== activeId),
                [overContainer]: [
                    ...overItems.slice(0, overIndex),
                    activeItems[activeIndex],
                    ...overItems.slice(overIndex)
                ]
            }
        }
    });
  }


  async function onSubmit(values: RoleFormValues) {
    setIsSubmitting(true);
    await onSubmitted(values);
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4 max-h-[75vh] overflow-y-auto p-1">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Rol</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Recepcionista" {...field} disabled={role?.name === 'Superusuario'} />
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
          <FormItem>
             <FormLabel>Permisos</FormLabel>
             <FormDescription>Arrastre los permisos desde la columna "Disponibles" a "Asignados".</FormDescription>
             <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="flex gap-4 mt-2">
                    <PermissionColumn id="available" title="Disponibles" permissions={containers.available} />
                    <PermissionColumn id="assigned" title="Asignados" permissions={containers.assigned} />
                </div>
             </DndContext>
             <FormField control={form.control} name="permissions" render={() => <FormMessage />} />
          </FormItem>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || role?.name === 'Superusuario'}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {role ? 'Guardar Cambios' : 'Crear Rol'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
