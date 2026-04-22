import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  try {
    const [rows]: any = await pool.execute(
      'SELECT name, address, settings, lat, `long`, calculation_method FROM mosques WHERE mosque_slug = ?',
      [slug]
    );
    if (!rows || !rows.length) {
      return NextResponse.json({ error: 'Mosque not found' }, { status: 404 });
    }
    const row = rows[0];
    const settings = typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings || {};
    return NextResponse.json({
      ...row,
      pengumumanJumat: settings.pengumumanJumat || '',
      pengumumanKajian: settings.pengumumanKajian || '',
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}