import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken } from '@/lib/auth-middleware';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = authenticateToken(req);
  if (!user || !user.mosque_id) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }
  const { id } = await params;
  try {
    const [rows]: any = await pool.execute('SELECT settings FROM mosques WHERE id = ?', [user.mosque_id]);
    if (!rows || !rows.length) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }
    const settings = typeof rows[0].settings === 'string' ? JSON.parse(rows[0].settings) : rows[0].settings;
    const setting = settings[id] || {};
    return NextResponse.json({ id, key: id, ...setting });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = authenticateToken(req);
  if (!user || !user.mosque_id) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }
  const { id } = await params;
  const { value, status } = await req.json();
  try {
    const [rows]: any = await pool.execute('SELECT settings FROM mosques WHERE id = ?', [user.mosque_id]);
    let settings: Record<string, any> = {};
    if (rows && rows.length && rows[0].settings) {
      settings = typeof rows[0].settings === 'string' ? JSON.parse(rows[0].settings) : rows[0].settings;
    }
    if (!settings[id]) {
      settings[id] = {};
    }
    if (value !== undefined) settings[id].value = value;
    if (status !== undefined) settings[id].status = status;
    await pool.execute('UPDATE mosques SET settings = ? WHERE id = ?', [JSON.stringify(settings), user.mosque_id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
