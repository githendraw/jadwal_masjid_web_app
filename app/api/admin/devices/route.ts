import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';
import { authenticateToken, requireSuperAdmin } from '@/lib/auth-middleware';

export async function POST(req: NextRequest) {
  const user = authenticateToken(req);
  const superadminError = requireSuperAdmin(user);
  if (superadminError) return superadminError;

  const { mosque_id, name } = await req.json();
  try {
    const device_uuid = crypto.randomUUID();
    await pool.execute(
      'INSERT INTO devices (id, mosque_id, name) VALUES (?, ?, ?)',
      [device_uuid, mosque_id, name || 'Device']
    );
    return NextResponse.json({
      device_uuid,
      qr_url: `https://app.jadwalmasjid.com/pair?device=${device_uuid}`
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = authenticateToken(req);
  const superadminError = requireSuperAdmin(user);
  if (superadminError) return superadminError;

  const { searchParams } = new URL(req.url);
  const device_uuid = searchParams.get('device_uuid');
  try {
    await pool.execute('DELETE FROM devices WHERE id = ?', [device_uuid]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
