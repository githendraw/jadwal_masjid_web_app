import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken, requireSuperAdmin } from '@/lib/auth-middleware';

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const user = authenticateToken(req);
  const superadminError = requireSuperAdmin(user);
  if (superadminError) return superadminError;

  const { userId } = await params;
  try {
    const [rows]: any = await pool.execute(
      'SELECT id, email, role, mosque_id, is_active as status FROM users WHERE id = ?',
      [userId]
    );
    if (!rows || !rows.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const user = authenticateToken(req);
  const superadminError = requireSuperAdmin(user);
  if (superadminError) return superadminError;

  const { userId } = await params;
  const { name, role, mosque_id } = await req.json();
  try {
    await pool.execute(
      'UPDATE users SET role = ?, mosque_id = ? WHERE id = ?',
      [role, mosque_id, userId]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
