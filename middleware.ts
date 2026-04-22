import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;
  const path = request.nextUrl.pathname;

  // Redirect to login if no token
  if (path.startsWith('/login') || path.startsWith('/register')) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based guards
  // Superadmin can access /admin, regular users are redirected to /settings
  if (path.startsWith('/admin') && role !== 'superadmin') {
    return NextResponse.redirect(new URL('/settings', request.url));
  }
  
  // Superadmin can also access /settings (removed the redirect)
  // Regular users stay at /settings as-is

  return NextResponse.next();
}

export const config = {
  matcher: ['/settings/:path*', '/admin/:path*'],
};
