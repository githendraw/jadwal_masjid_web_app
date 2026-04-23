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
      'SELECT id, name, email, role, mosque_id, is_active as status FROM users WHERE id = ?',
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
  const { name, role, mosque_id, status } = await req.json();
  try {
    const is_active = status === 'active' ? 1 : 0;
    await pool.execute(
      'UPDATE users SET name = ?, role = ?, mosque_id = ?, is_active = ? WHERE id = ?',
      [name, role, mosque_id, is_active, userId]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
