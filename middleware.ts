import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

function getSecret() {
  const s = process.env.ADMIN_SESSION_SECRET ?? 'mosque-dev-secret-change-before-deploy';
  return new TextEncoder().encode(s);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin routes (but not /admin/login or /api/admin/auth)
  if (
    pathname.startsWith('/admin') &&
    !pathname.startsWith('/admin/login') &&
    !pathname.startsWith('/api/admin/auth')
  ) {
    const token = req.cookies.get('admin_session')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    try {
      await jwtVerify(token, getSecret());
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL('/admin/login', req.url));
      res.cookies.set('admin_session', '', { maxAge: 0, path: '/' });
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
