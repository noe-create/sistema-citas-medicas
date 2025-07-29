import { NextResponse, type NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const session = await getIronSession<SessionData>(req.cookies, sessionOptions);
  const { isLoggedIn } = session;
  const { pathname } = req.nextUrl;

  const isPublicPage = pathname.startsWith('/login');

  // If the user is logged in, and tries to access a public page like /login, redirect to dashboard
  if (isLoggedIn && isPublicPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If the user is not logged in and tries to access a protected page, redirect to login
  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
