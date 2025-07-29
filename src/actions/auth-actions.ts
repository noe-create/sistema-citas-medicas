

'use server';

import { getDb } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { sessionOptions, type SessionData, getSession, authorize } from '@/lib/auth';
import type { User, DoctorSpecialty, Role } from '@/lib/types';
import 'server-only';
import { revalidatePath } from 'next/cache';

export async function login(
  prevState: any,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const db = await getDb();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Por favor, ingrese usuario y contraseña.' };
  }

  try {
    const userRow: any = await db.get(
        `SELECT 
          u.id, u.username, u.password, u.specialty, u.personaId, 
          TRIM(p.primerNombre || ' ' || COALESCE(p.segundoNombre, '') || ' ' || p.primerApellido || ' ' || COALESCE(p.segundoApellido, '')) as name,
          r.id as roleId, r.name as roleName
         FROM users u
         LEFT JOIN personas p ON u.personaId = p.id
         JOIN roles r ON u.roleId = r.id
         WHERE u.username = ?`,
        username
    );

    if (!userRow) {
      return { error: 'Usuario o contraseña incorrectos.' };
    }

    const passwordMatch = await bcrypt.compare(password, userRow.password);

    if (!passwordMatch) {
      return { error: 'Usuario o contraseña incorrectos.' };
    }

    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    
    const permissions = await db.all<{permissionId: string}>(
        'SELECT permissionId FROM role_permissions WHERE roleId = ?',
        userRow.roleId
    );
    
    session.isLoggedIn = true;
    session.user = {
      id: userRow.id,
      username: userRow.username,
      role: { id: userRow.roleId, name: userRow.roleName },
      specialty: userRow.specialty,
      personaId: userRow.personaId,
      name: userRow.name || userRow.username,
    };
    session.permissions = permissions.map(p => p.permissionId);

    await session.save();
    
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Ha ocurrido un error inesperado.' };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}


export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect('/login');
}

// --- User Management Actions ---

export async function getUsers(query?: string): Promise<(User & {roleName: string})[]> {
    await authorize('users.manage');
    const db = await getDb();
    let selectQuery = `
        SELECT 
          u.id, u.username, u.roleId, r.name as roleName, u.specialty, 
          u.personaId, TRIM(p.primerNombre || ' ' || COALESCE(p.segundoNombre, '') || ' ' || p.primerApellido || ' ' || COALESCE(p.segundoApellido, '')) as name
        FROM users u
        LEFT JOIN personas p ON u.personaId = p.id
        JOIN roles r ON u.roleId = r.id
    `;
    const params: any[] = [];
    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        selectQuery += ' WHERE u.username LIKE ? OR p.primerNombre LIKE ? OR p.primerApellido LIKE ?';
        params.push(searchQuery, searchQuery, searchQuery);
    }
    selectQuery += ' ORDER BY u.username';
    const rows = await db.all(selectQuery, ...params);
    return rows.map(row => ({
        id: row.id,
        username: row.username,
        role: { id: row.roleId, name: row.roleName },
        roleName: row.roleName,
        specialty: row.specialty,
        personaId: row.personaId,
        name: row.name,
    }));
}

export async function getDoctors(): Promise<(User & { name: string })[]> {
    const db = await getDb();
    const rows = await db.all(`
        SELECT 
            u.id, 
            u.username, 
            u.specialty, 
            u.personaId, 
            r.id as roleId, 
            r.name as roleName,
            COALESCE(TRIM(p.primerNombre || ' ' || p.primerApellido), u.username) as name
        FROM users u
        JOIN roles r ON u.roleId = r.id
        LEFT JOIN personas p ON u.personaId = p.id
        WHERE r.name = 'Doctor' OR r.name = 'Superusuario'
        ORDER BY name
    `);
    
    return rows.map(row => ({
        id: row.id,
        username: row.username,
        name: row.name,
        role: { id: row.roleId, name: row.roleName },
        specialty: row.specialty,
        personaId: row.personaId,
    }));
}

export async function createUser(data: {
    username: string;
    password?: string;
    roleId: string;
    specialty?: DoctorSpecialty;
    personaId?: string;
}) {
    await authorize('users.manage');
    const db = await getDb();

    if (!data.password) {
        throw new Error('La contraseña es requerida para nuevos usuarios.');
    }

    const existingUser = await db.get('SELECT id FROM users WHERE username = ?', data.username);
    if (existingUser) {
        throw new Error('El nombre de usuario ya existe.');
    }
    
    if (data.personaId) {
        const personaInUse = await db.get('SELECT id FROM users WHERE personaId = ?', data.personaId);
        if (personaInUse) {
            throw new Error('Esta persona ya está asignada a otro usuario.');
        }
    }
    
    const role = await db.get<{ hasSpecialty: number }>('SELECT hasSpecialty FROM roles WHERE id = ?', data.roleId);
    if (!role) {
        throw new Error('El rol seleccionado no es válido.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const userId = `usr-${Date.now()}`;

    await db.run(
        'INSERT INTO users (id, username, password, roleId, specialty, personaId) VALUES (?, ?, ?, ?, ?, ?)',
        userId,
        data.username,
        hashedPassword,
        data.roleId,
        role.hasSpecialty ? data.specialty : null,
        data.personaId || null
    );

    revalidatePath('/dashboard/usuarios');
    const newUser = await db.get('SELECT id, username, roleId, specialty, personaId FROM users WHERE id = ?', userId);
    return newUser;
}

export async function updateUser(id: string, data: {
    username: string;
    password?: string;
    roleId: string;
    specialty?: DoctorSpecialty;
    personaId?: string;
}) {
    await authorize('users.manage');
    const db = await getDb();
    
    const existingUser = await db.get('SELECT id FROM users WHERE username = ? AND id != ?', data.username, id);
    if (existingUser) {
        throw new Error('El nombre de usuario ya existe.');
    }

    if (data.personaId) {
        const personaInUse = await db.get('SELECT id FROM users WHERE personaId = ? AND id != ?', data.personaId, id);
        if (personaInUse) {
            throw new Error('Esta persona ya está asignada a otro usuario.');
        }
    }

    const role = await db.get<{ hasSpecialty: number }>('SELECT hasSpecialty FROM roles WHERE id = ?', data.roleId);
    if (!role) {
        throw new Error('El rol seleccionado no es válido.');
    }
    
    let result;
    if (data.password) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        result = await db.run(
            'UPDATE users SET username = ?, password = ?, roleId = ?, specialty = ?, personaId = ? WHERE id = ?',
            data.username,
            hashedPassword,
            data.roleId,
            role.hasSpecialty ? data.specialty : null,
            data.personaId || null,
            id
        );
    } else {
        result = await db.run(
            'UPDATE users SET username = ?, roleId = ?, specialty = ?, personaId = ? WHERE id = ?',
            data.username,
            data.roleId,
            role.hasSpecialty ? data.specialty : null,
            data.personaId || null,
            id
        );
    }

    if (result.changes === 0) {
        throw new Error('Usuario no encontrado para actualizar.');
    }

    revalidatePath('/dashboard/usuarios');

    const session = await getSession();
    if (session.isLoggedIn && session.user?.id === id) {
        const userRow: any = await db.get(
           `SELECT 
              u.id, u.username, u.specialty, u.personaId, 
              TRIM(p.primerNombre || ' ' || COALESCE(p.segundoNombre, '') || ' ' || p.primerApellido || ' ' || COALESCE(p.segundoApellido, '')) as name,
              r.id as roleId, r.name as roleName
            FROM users u
            LEFT JOIN personas p ON u.personaId = p.id
            JOIN roles r ON u.roleId = r.id
            WHERE u.id = ?`,
           id
        );
        
        if (userRow) {
            session.user = {
                id: userRow.id,
                username: userRow.username,
                role: { id: userRow.roleId, name: userRow.roleName },
                specialty: userRow.specialty,
                personaId: userRow.personaId,
                name: userRow.name || userRow.username,
            };
            const permissions = await db.all<{permissionId: string}>(
                'SELECT permissionId FROM role_permissions WHERE roleId = ?',
                userRow.roleId
            );
            session.permissions = permissions.map(p => p.permissionId);
            await session.save();
        }
    }

    const updatedUser = await db.get('SELECT id, username, roleId, specialty, personaId FROM users WHERE id = ?', id);
    return updatedUser;
}

export async function deleteUser(id: string) {
    await authorize('users.manage');
    
    const session = await getSession();
    if (session.user?.id === id) {
        throw new Error('No puede eliminar su propio usuario.');
    }
    
    const db = await getDb();
    const result = await db.run('DELETE FROM users WHERE id = ?', id);
    if (result.changes === 0) {
        throw new Error('Usuario no encontrado.');
    }

    revalidatePath('/dashboard/usuarios');
    return { success: true };
}

export async function changePasswordForCurrentUser(data: { currentPassword: string; newPassword: string; }) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
        throw new Error('Acción no autorizada. Debe iniciar sesión.');
    }

    const { currentPassword, newPassword } = data;
    const db = await getDb();

    const userRow: any = await db.get('SELECT password FROM users WHERE id = ?', session.user.id);
    if (!userRow) {
        throw new Error('Usuario no encontrado en la base de datos.');
    }

    const passwordMatch = await bcrypt.compare(currentPassword, userRow.password);
    if (!passwordMatch) {
        throw new Error('La contraseña actual es incorrecta.');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        hashedNewPassword,
        session.user.id
    );

    if (result.changes === 0) {
        throw new Error('No se pudo actualizar la contraseña.');
    }

    return { success: true, message: 'Contraseña actualizada correctamente.' };
}
