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
  if (path.startsWith('/admin') && role !== 'superadmin') {
    return NextResponse.redirect(new URL('/settings', request.url));
  }
  
  if (path.startsWith('/settings') && role === 'superadmin') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/settings/:path*', '/admin/:path*'],
};
