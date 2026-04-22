import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken, requireSuperAdmin } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  const user = authenticateToken(req);
  const superadminError = requireSuperAdmin(user);
  if (superadminError) return superadminError;

  try {
    const [rows]: any = await pool.execute(`
      SELECT u.id, u.email, u.role, u.mosque_id, m.name as mosque_name, u.is_active as status
      FROM users u
      LEFT JOIN mosques m ON u.mosque_id = m.id
      ORDER BY u.id
    `);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = authenticateToken(req);
  const superadminError = requireSuperAdmin(user);
  if (superadminError) return superadminError;

  const { email, name, password, role, mosque_id } = await req.json();
  try {
    const [existing]: any = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password || 'password123', 10);
    const [result]: any = await pool.execute(
      'INSERT INTO users (email, password_hash, role, mosque_id, is_active) VALUES (?, ?, ?, ?, ?)',
      [email, hash, role || 'user', mosque_id || null, 1]
    );
    return NextResponse.json({ id: result.insertId, success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
