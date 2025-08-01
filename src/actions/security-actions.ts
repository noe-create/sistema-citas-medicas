
'use server';

import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { authorize } from '@/lib/auth';
import type { Role, Permission } from '@/lib/types';
import { ALL_PERMISSIONS } from '@/lib/permissions';

export async function getRoles(): Promise<Role[]> {
  await authorize('roles.manage');
  const db = await getDb();
  const roles = await db.all('SELECT *, CAST(hasSpecialty AS INTEGER) as hasSpecialty FROM roles ORDER BY name');
  return roles.map(role => ({ ...role, hasSpecialty: !!role.hasSpecialty }));
}

export async function getRoleWithPermissions(roleId: string): Promise<(Role & { permissions: string[] }) | null> {
    await authorize('roles.manage');
    const db = await getDb();
    const roleRow = await db.get<any>('SELECT *, CAST(hasSpecialty AS INTEGER) as hasSpecialty FROM roles WHERE id = ?', roleId);
    if (!roleRow) return null;

    const { hasSpecialty, ...restOfRole } = roleRow;
    const role: Role = { ...restOfRole, hasSpecialty: !!hasSpecialty };

    const permissions = await db.all<{permissionId: string}>(
        'SELECT permissionId FROM role_permissions WHERE roleId = ?',
        roleId
    );
    
    return {
        ...role,
        permissions: permissions.map(p => p.permissionId),
    };
}

export async function getAllPermissions(): Promise<Permission[]> {
    return ALL_PERMISSIONS;
}

export async function createRole(data: { name: string; description: string; hasSpecialty?: boolean; permissions: string[] }) {
  await authorize('roles.manage');
  const db = await getDb();
  const roleId = `role-${Date.now()}`;

  await db.exec('BEGIN TRANSACTION');
  try {
    await db.run('INSERT INTO roles (id, name, description, hasSpecialty) VALUES (?, ?, ?, ?)', roleId, data.name, data.description, data.hasSpecialty ? 1 : 0);
    
    const stmt = await db.prepare('INSERT INTO role_permissions (roleId, permissionId) VALUES (?, ?)');
    for (const permissionId of data.permissions) {
      await stmt.run(roleId, permissionId);
    }
    await stmt.finalize();

    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    if ((error as any).code === 'SQLITE_CONSTRAINT') {
      throw new Error('Ya existe un rol con ese nombre.');
    }
    throw error;
  }

  revalidatePath('/dashboard/seguridad/roles');
  const newRole = await db.get('SELECT * FROM roles WHERE id = ?', roleId);
  return newRole;
}

export async function updateRole(id: string, data: { name: string; description: string; hasSpecialty?: boolean; permissions: string[] }) {
  await authorize('roles.manage');
  const db = await getDb();

  await db.exec('BEGIN TRANSACTION');
  try {
    await db.run('UPDATE roles SET name = ?, description = ?, hasSpecialty = ? WHERE id = ?', data.name, data.description, data.hasSpecialty ? 1 : 0, id);
    
    // Clear old permissions and insert new ones
    await db.run('DELETE FROM role_permissions WHERE roleId = ?', id);
    const stmt = await db.prepare('INSERT INTO role_permissions (roleId, permissionId) VALUES (?, ?)');
    for (const permissionId of data.permissions) {
      await stmt.run(id, permissionId);
    }
    await stmt.finalize();

    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    if ((error as any).code === 'SQLITE_CONSTRAINT') {
      throw new Error('Ya existe un rol con ese nombre.');
    }
    throw error;
  }

  revalidatePath('/dashboard/seguridad/roles');
  const updatedRole = await db.get('SELECT * FROM roles WHERE id = ?', id);
  return updatedRole;
}

export async function deleteRole(id: string) {
  await authorize('roles.manage');
  const db = await getDb();
  
  if (id === 'superuser') {
    throw new Error('El rol de Superusuario no puede ser eliminado.');
  }

  const userCount = await db.get('SELECT COUNT(*) as count FROM users WHERE roleId = ?', id);
  if (userCount.count > 0) {
    throw new Error('No se puede eliminar el rol porque está asignado a uno o más usuarios.');
  }

  await db.run('DELETE FROM roles WHERE id = ?', id);
  revalidatePath('/dashboard/seguridad/roles');
  return { success: true };
}
