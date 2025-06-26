'use server';

import { getDb } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { sessionOptions, type SessionData, getSession } from '@/lib/auth';
import type { User } from '@/lib/types';
import 'server-only';

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
        `SELECT u.id, u.username, u.password, u.role, u.personaId, p.nombreCompleto as name
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
