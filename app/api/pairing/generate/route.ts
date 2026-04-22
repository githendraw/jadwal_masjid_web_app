import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    const user = authenticateToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.mosque_id) {
      return NextResponse.json({ error: 'Mosque ID not found' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const device_uuid = body.device_uuid;

    const code = generateCode();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);

    await pool.execute(
      'INSERT INTO pairing_codes (code, mosque_id, device_uuid, expires_at) VALUES (?, ?, ?, ?)',
      [code, user.mosque_id, device_uuid || null, expires_at]
    );

    return NextResponse.json({
      code,
      expires_at: expires_at.toISOString(),
      message: 'Pairing code generated successfully'
    });
  } catch (error) {
    console.error('Error generating pairing code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}