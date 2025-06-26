import { NextResponse, type NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req.cookies, sessionOptions);
  const { isLoggedIn } = session;
  const { pathname } = req.nextUrl;

  const isPublicPage = pathname.startsWith('/login');
  const isDashboardPage = pathname.startsWith('/dashboard') || pathname === '/';

  if (isPublicPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (isDashboardPage && !isLoggedIn) {
    let from = pathname;
    if (req.nextUrl.search) {
        from += req.nextUrl.search;
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', from);
    
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
