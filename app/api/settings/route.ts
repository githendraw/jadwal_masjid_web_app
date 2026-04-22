import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken } from '@/lib/auth-middleware';

export async function PUT(req: NextRequest) {
  const user = authenticateToken(req);
  if (!user || !user.mosque_id) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }
  const { key, value } = await req.json();
  try {
    const [rows]: any = await pool.execute('SELECT settings FROM mosques WHERE id = ?', [user.mosque_id]);
    let settings: Record<string, any> = {};
    if (rows && rows.length && rows[0].settings) {
      settings = typeof rows[0].settings === 'string' ? JSON.parse(rows[0].settings) : rows[0].settings;
    }
    settings[key] = value;
    await pool.execute('UPDATE mosques SET settings = ? WHERE id = ?', [JSON.stringify(settings), user.mosque_id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
