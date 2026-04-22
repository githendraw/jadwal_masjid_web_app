import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken, requireSuperAdmin } from '@/lib/auth-middleware';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const user = authenticateToken(req);
  const superadminError = requireSuperAdmin(user);
  if (superadminError) return superadminError;

  const { userId } = await params;
  const { status } = await req.json();
  try {
    const isActive = status === 'active' ? 1 : 0;
    await pool.execute('UPDATE users SET is_active = ? WHERE id = ?', [isActive, userId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
