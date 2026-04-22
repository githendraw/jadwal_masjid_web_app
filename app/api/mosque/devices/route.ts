import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';
import { authenticateToken } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  const user = authenticateToken(req);
  if (!user || !user.mosque_id) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }
  try {
    const mosque_id = user.mosque_id;
    const [rows]: any = await pool.execute(`
      SELECT d.id as device_id, d.name, d.is_active, d.is_online, d.last_seen_at, d.created_at
      FROM devices d
      WHERE d.mosque_id = ?
      ORDER BY d.created_at
    `, [mosque_id]);
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
    const mosque_id = user.mosque_id;
    const device_uuid = crypto.randomUUID();
    await pool.execute(
      'INSERT INTO devices (id, mosque_id, name) VALUES (?, ?, ?)',
      [device_uuid, mosque_id, 'TV Baru']
    );
    return NextResponse.json({
      device_uuid,
      qr_url: `https://app.jadwalmasjid.com/pair?device=${device_uuid}`
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
