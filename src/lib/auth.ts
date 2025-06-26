'server-only';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { User } from './types';

export type SessionData = {
  user?: User;
  isLoggedIn: boolean;
};

export const defaultSession: SessionData = {
  user: undefined,
  isLoggedIn: false,
};

if (!process.env.SECRET_COOKIE_PASSWORD || process.env.SECRET_COOKIE_PASSWORD.length < 32) {
    throw new Error('SECRET_COOKIE_PASSWORD is not set or is too short. It must be at least 32 characters long.');
}

export const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD,
  cookieName: 'careflow-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export async function getSession() {
  const cookieStore = cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.isLoggedIn) {
    session.isLoggedIn = defaultSession.isLoggedIn;
    session.user = defaultSession.user;
  }
  
  return session;
}
