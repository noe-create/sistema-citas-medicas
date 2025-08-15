import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getSession(req.cookies);
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

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
