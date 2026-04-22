import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jadwal-masjid-secret';

export interface AuthUser {
  id: number;
  role: string;
  mosque_id?: number;
  mosque_uuid?: string;
}

export function authenticateToken(req: NextRequest): AuthUser | null {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ||
                req.headers.get('x-token');
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export function requireSuperAdmin(user: AuthUser | null): NextResponse | null {
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
  }
  return null;
}

export function requireAuth(user: AuthUser | null): NextResponse | null {
  if (!user) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }
  return null;
}
