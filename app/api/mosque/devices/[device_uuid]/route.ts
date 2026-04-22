import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken } from '@/lib/auth-middleware';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ device_uuid: string }> }) {
  const user = authenticateToken(req);
  if (!user || !user.mosque_id) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  const { device_uuid } = await params;
  try {
    const mosque_id = user.mosque_id;
    const [result]: any = await pool.execute(
      'DELETE FROM devices WHERE id = ? AND mosque_id = ?',
      [device_uuid, mosque_id]
    );
    const deleted = result.affectedRows || 0;
    return NextResponse.json({ success: deleted > 0 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
