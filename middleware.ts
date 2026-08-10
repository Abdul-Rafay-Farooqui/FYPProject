import { NextRequest, NextResponse } from 'next/server';

const TOKEN_COOKIE = 'weconnect_token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  const isAuthRoute = pathname.startsWith('/auth');
  const isApiRoute = pathname.startsWith('/api');
  const isPublicAsset =
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname);

  if (isApiRoute || isPublicAsset) return NextResponse.next();

  if (!token && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  if (token && isAuthRoute && pathname !== '/auth/onboarding') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};