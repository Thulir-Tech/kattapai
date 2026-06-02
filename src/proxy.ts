import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has('admin-session');

  // Route protection for Admin Panel
  if (pathname.startsWith('/AdminPanel')) {
    const isLoginPage = pathname === '/AdminPanel/login';

    if (isLoginPage) {
      // If user has a valid admin session, don't show the login page
      if (hasSession) {
        return NextResponse.redirect(new URL('/AdminPanel', request.url));
      }
      return NextResponse.next();
    }

    // For all other admin panel paths, enforce presence of admin-session cookie
    if (!hasSession) {
      const loginUrl = new URL('/AdminPanel/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Config to apply proxy only to the Admin Panel routes
export const config = {
  matcher: ['/AdminPanel/:path*'],
};
