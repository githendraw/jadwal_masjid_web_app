import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken } from '@/lib/auth-middleware';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ deviceId: string }> }) {
  const user = authenticateToken(req);
  if (!user || !user.mosque_id) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }
  const { deviceId } = await params;
  try {
    await pool.execute('UPDATE devices SET is_online = 0 WHERE id = ? AND mosque_id = ?', [deviceId, user.mosque_id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
