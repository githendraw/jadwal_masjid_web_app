import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';
import { authenticateToken } from '@/lib/auth-middleware';

export async function POST(req: NextRequest) {
  const user = authenticateToken(req);
  if (!user) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }
  const { device_uuid } = await req.json();
  const mosque_id = user.mosque_id;
  try {
    const device = device_uuid || crypto.randomUUID();

    const [existing]: any = await pool.execute('SELECT id FROM devices WHERE id = ?', [device]);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Device sudah terdaftar', device_uuid: device }, { status: 409 });
    }

    await pool.execute(
      'INSERT INTO devices (id, mosque_id, name) VALUES (?, ?, ?)',
      [device, mosque_id, 'Device']
    );

    return NextResponse.json({
      device_uuid: device,
      success: true
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
