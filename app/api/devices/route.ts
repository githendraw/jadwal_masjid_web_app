import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  const user = authenticateToken(req);
  if (!user || !user.mosque_id) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }
  try {
    const [rows]: any = await pool.execute(
      'SELECT id, name, is_active, is_online, last_seen_at, created_at FROM devices WHERE mosque_id = ? ORDER BY created_at',
      [user.mosque_id]
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = authenticateToken(req);
  if (!user || !user.mosque_id) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }
  try {
    const [rows]: any = await pool.execute(
      'SELECT id, name, is_active, is_online, last_seen_at, created_at FROM devices WHERE mosque_id = ? ORDER BY created_at',
      [user.mosque_id]
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
