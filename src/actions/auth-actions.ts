'use server';

import { getDb } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { sessionOptions, type SessionData, getSession } from '@/lib/auth';
import type { User, Role, DoctorSpecialty } from '@/lib/types';
import 'server-only';
import { revalidatePath } from 'next/cache';

export async function login(
  prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const db = await getDb();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return 'Por favor, ingrese usuario y contraseña.';
  }

  try {
    const userRow: any = await db.get(
        `SELECT u.id, u.username, u.password, u.role, u.specialty, u.personaId, p.nombreCompleto as name
         FROM users u
         LEFT JOIN personas p ON u.personaId = p.id
         WHERE u.username = ?`,
        username
    );

    if (!userRow) {
      return 'Usuario o contraseña incorrectos.';
    }

    const passwordMatch = await bcrypt.compare(password, userRow.password);

    if (!passwordMatch) {
      return 'Usuario o contraseña incorrectos.';
    }

    const session = await getIronSession<SessionData>(cookies(), sessionOptions);

    session.isLoggedIn = true;
    session.user = {
      id: userRow.id,
      username: userRow.username,
      role: userRow.role,
      specialty: userRow.specialty,
      personaId: userRow.personaId,
      name: userRow.name || userRow.username,
    };
    await session.save();
    
  } catch (error) {
    console.error('Login error:', error);
    return 'Ha ocurrido un error inesperado.';
  }

  redirect('/dashboard');
}


export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect('/login');
}

// --- User Management Actions ---

async function ensureSuperuser() {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user || session.user.role !== 'superuser') {
        throw new Error('Acción no autorizada. Se requiere rol de superusuario.');
    }
}

export async function getUsers(query?: string): Promise<User[]> {
    await ensureSuperuser();
    const db = await getDb();
    let selectQuery = `
        SELECT u.id, u.username, u.role, u.specialty, u.personaId, p.nombreCompleto as name
        FROM users u
        LEFT JOIN personas p ON u.personaId = p.id
    `;
    const params: any[] = [];
    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        selectQuery += ' WHERE u.username LIKE ? OR p.nombreCompleto LIKE ?';
        params.push(searchQuery, searchQuery);
    }
    selectQuery += ' ORDER BY u.username';
    const rows = await db.all(selectQuery, ...params);
    return rows;
}

export async function createUser(data: {
    username: string;
    password?: string;
    role: Role;
    specialty?: DoctorSpecialty;
    personaId?: string;
}) {
    await ensureSuperuser();
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

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const userId = `usr-${Date.now()}`;

    await db.run(
        'INSERT INTO users (id, username, password, role, specialty, personaId) VALUES (?, ?, ?, ?, ?, ?)',
        userId,
        data.username,
        hashedPassword,
        data.role,
        data.role === 'doctor' ? data.specialty : null,
        data.personaId || null
    );

    revalidatePath('/dashboard/usuarios');
    const newUser = await db.get('SELECT id, username, role, specialty, personaId FROM users WHERE id = ?', userId);
    return newUser;
}

export async function updateUser(id: string, data: {
    username: string;
    password?: string;
    role: Role;
    specialty?: DoctorSpecialty;
    personaId?: string;
}) {
    await ensureSuperuser();
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
    
    let result;
    if (data.password) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        result = await db.run(
            'UPDATE users SET username = ?, password = ?, role = ?, specialty = ?, personaId = ? WHERE id = ?',
            data.username,
            hashedPassword,
            data.role,
            data.role === 'doctor' ? data.specialty : null,
            data.personaId || null,
            id
        );
    } else {
        result = await db.run(
            'UPDATE users SET username = ?, role = ?, specialty = ?, personaId = ? WHERE id = ?',
            data.username,
            data.role,
            data.role === 'doctor' ? data.specialty : null,
            data.personaId || null,
            id
        );
    }

    if (result.changes === 0) {
        throw new Error('Usuario no encontrado para actualizar.');
    }

    revalidatePath('/dashboard/usuarios');

    // After updating the DB, check if the updated user is the current session user.
    // If so, we need to update the session to reflect the changes immediately.
    const session = await getSession();
    if (session.isLoggedIn && session.user?.id === id) {
        const userRow: any = await db.get(
           `SELECT u.id, u.username, u.role, u.specialty, u.personaId, p.nombreCompleto as name
            FROM users u
            LEFT JOIN personas p ON u.personaId = p.id
            WHERE u.id = ?`,
           id
        );
        
        if (userRow) {
            session.user = {
                id: userRow.id,
                username: userRow.username,
                role: userRow.role,
                specialty: userRow.specialty,
                personaId: userRow.personaId,
                name: userRow.name || userRow.username,
            };
            await session.save();
        }
    }

    const updatedUser = await db.get('SELECT id, username, role, specialty, personaId FROM users WHERE id = ?', id);
    return updatedUser;
}

export async function deleteUser(id: string) {
    await ensureSuperuser();
    
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
