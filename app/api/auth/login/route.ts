import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'jadwal-masjid-secret';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  try {
    const [rows]: any = await pool.execute(`
      SELECT u.id, u.role, u.mosque_id, m.mosque_uuid, m.mosque_slug, m.is_active as mosque_is_active, u.is_active, u.password_hash
      FROM users u
      LEFT JOIN mosques m ON u.mosque_id = m.id
      WHERE u.email = ?
    `, [email]);

    if (!rows || !rows.length || !rows[0].is_active) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
    }

    const token = jwt.sign({
      id: user.id,
      role: user.role,
      mosque_id: user.mosque_id,
      mosque_uuid: user.mosque_uuid
    }, JWT_SECRET, { expiresIn: '7d' });

    const response = NextResponse.json({
      token,
      role: user.role,
      mosque_id: user.mosque_id,
      mosque_uuid: user.mosque_uuid,
      mosque_slug: user.mosque_slug
    });

    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      expires,
    });
    response.cookies.set({
      name: 'role',
      value: user.role,
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      expires,
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
