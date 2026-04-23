import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken } from '@/lib/auth-middleware';
import { emitConfigUpdate } from '@/lib/socket-emit';

export async function PUT(req: NextRequest) {
  const user = authenticateToken(req);
  if (!user || !user.mosque_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { background } = body;

    if (background === undefined) {
      return NextResponse.json({ error: 'Field background wajib diisi' }, { status: 400 });
    }

    const [existing]: any = await pool.execute('SELECT settings FROM mosques WHERE id = ?', [user.mosque_id]);
    let settings: Record<string, any> = {};
    if (existing && existing.length && existing[0].settings) {
      settings = typeof existing[0].settings === 'string' ? JSON.parse(existing[0].settings) : existing[0].settings;
    }
    settings.background = background;

    await pool.execute('UPDATE mosques SET settings = ? WHERE id = ?', [JSON.stringify(settings), user.mosque_id]);

    await emitConfigUpdate(user.mosque_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating background:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
