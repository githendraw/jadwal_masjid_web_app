import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken } from '@/lib/auth-middleware';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest) {
  const user = authenticateToken(req);
  if (!user || !user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Password lama dan baru harus diisi' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    const [rows]: any = await pool.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [user.id]
    );

    if (!rows || !rows.length) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) {
      return NextResponse.json({ error: 'Password lama salah' }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}