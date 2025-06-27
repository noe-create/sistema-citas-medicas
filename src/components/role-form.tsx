

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, GripVertical } from 'lucide-react';
import type { Role, Permission } from '@/lib/types';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    DragOverlay,
    type DragStartEvent,
    useDroppable,
    rectIntersection,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';

const roleSchema = z.object({
  name: z.string().min(3, { message: 'El nombre del rol es requerido.' }),
  description: z.string().min(1, 'La descripción es requerida.'),
  hasSpecialty: z.boolean().default(false).optional(),
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: permission.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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
  const { setNodeRef } = useDroppable({ id });

  return (
    <Card ref={setNodeRef} className="flex-1 flex flex-col min-h-[400px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <ScrollArea className="flex-grow p-4 pt-0">
        <SortableContext id={id} items={permissions.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {permissions.length > 0 ? (
            permissions.map((p) => <SortablePermission key={p.id} permission={p} />)
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4 text-center">
              Arrastre los permisos aquí para asignarlos.
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
  const [activePermission, setActivePermission] = React.useState<Permission | null>(null);

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
      hasSpecialty: role?.hasSpecialty || false,
      permissions: role?.permissions || [],
    },
  });

  React.useEffect(() => {
    form.setValue('permissions', containers.assigned.map(p => p.id));
  }, [containers.assigned, form]);


  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    const permission = allPermissions.find(p => p.id === activeId);
    if (permission) {
      setActivePermission(permission);
    }
  };

  const findContainer = (id: string): keyof typeof containers | undefined => {
    if (id === 'available' || id === 'assigned') return id;
    if (containers.available.some(p => p.id === id)) return 'available';
    if (containers.assigned.some(p => p.id === id)) return 'assigned';
    return undefined;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePermission(null);

    if (!over) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
    
    if (!activeContainer || !overContainer) {
        return;
    }

    if (activeContainer !== overContainer) {
      setContainers((prev) => {
        const activeItems = prev[activeContainer];
        const overItems = prev[overContainer];
        const activeIndex = activeItems.findIndex((item) => item.id === activeId);
        const overIndex = overItems.findIndex((item) => item.id === overId);

        let newIndex: number;
        if(overId in prev) {
            newIndex = overItems.length;
        } else {
            newIndex = overIndex >= 0 ? overIndex : overItems.length;
        }
        
        return {
          ...prev,
          [activeContainer]: activeItems.filter((item) => item.id !== activeId),
          [overContainer]: [
            ...overItems.slice(0, newIndex),
            activeItems[activeIndex],
            ...overItems.slice(newIndex),
          ],
        };
      });
    } else {
      const activeIndex = containers[activeContainer].findIndex((item) => item.id === activeId);
      const overIndex = containers[overContainer].findIndex((item) => item.id === overId);

      if (activeIndex !== overIndex) {
        setContainers((prev) => ({
          ...prev,
          [overContainer]: arrayMove(prev[overContainer], activeIndex, overIndex),
        }));
      }
    }
  };

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
           <FormField
            control={form.control}
            name="hasSpecialty"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-3 shadow-sm">
                <FormControl>
                    <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                </FormControl>
                <div className="space-y-1 leading-none">
                    <FormLabel>
                    Puede tener especialidades
                    </FormLabel>
                    <FormDescription>
                    Marque esta casilla si los usuarios con este rol pueden tener una especialidad médica asignada.
                    </FormDescription>
                </div>
                </FormItem>
            )}
           />
          <FormItem>
             <FormLabel>Permisos</FormLabel>
             <FormDescription>Arrastre los permisos desde la columna "Disponibles" a "Asignados".</FormDescription>
             <DndContext 
                sensors={sensors} 
                collisionDetection={rectIntersection} 
                onDragStart={handleDragStart} 
                onDragEnd={handleDragEnd}
             >
                <div className="flex gap-4 mt-2">
                    <PermissionColumn id="available" title="Disponibles" permissions={containers.available} />
                    <PermissionColumn id="assigned" title="Asignados" permissions={containers.assigned} />
                </div>
                <DragOverlay>
                  {activePermission ? (
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-3">
                        <div className="flex items-start gap-2">
                        <div className="p-1 cursor-grabbing">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">{activePermission.name}</p>
                            <p className="text-xs text-muted-foreground">{activePermission.description}</p>
                        </div>
                        </div>
                    </div>
                  ) : null}
                </DragOverlay>
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
