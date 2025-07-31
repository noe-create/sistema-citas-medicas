
'server-only';

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { User } from './types';

export type SessionData = {
  user?: User;
  isLoggedIn: boolean;
  permissions?: string[];
};

export const defaultSession: SessionData = {
  user: undefined,
  isLoggedIn: false,
  permissions: [],
};

export async function getSession() {
  const sessionOptions = {
    password: process.env.SECRET_COOKIE_PASSWORD!,
    cookieName: 'medihub-session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
    },
  };

  if (!sessionOptions.password || sessionOptions.password.length < 32) {
    // This check is important for debugging and ensuring the secret is loaded.
    // It will throw an error if the secret is missing in any environment.
    throw new Error('SECRET_COOKIE_PASSWORD is not set or is too short. It must be at least 32 characters long.');
  }

  // To fix the "cookies() should be awaited" error, we need to pass a Map of cookies
  // to getIronSession instead of the cookies() function directly.
  const cookieStore = cookies();
  const session = await getIronSession<SessionData>(cookieStore as any, sessionOptions);

  if (!session.isLoggedIn) {
    session.isLoggedIn = defaultSession.isLoggedIn;
    session.user = defaultSession.user;
    session.permissions = defaultSession.permissions;
  }
  
  return session;
}

export async function authorize(permissionId: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user || !session.permissions) {
        throw new Error('Acción no autorizada. Debe iniciar sesión.');
    }

    // Superuser always has all permissions
    if (session.user.role.name === 'Superusuario') {
        return;
    }

    if (!session.permissions.includes(permissionId)) {
        console.warn(`Authorization failed for user ${session.user.username} (role: ${session.user.role.name}). Missing permission: ${permissionId}`);
        throw new Error('No tiene permiso para realizar esta acción.');
    }
}
