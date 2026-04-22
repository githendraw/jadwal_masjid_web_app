import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken } from '@/lib/auth-middleware';

const DEFAULT_ADHAN_SETTINGS = [
  { id: 'subuh', name: 'Subuh', volume: 80, enabled: true },
  { id: 'dhuhur', name: 'Dzuhur', volume: 80, enabled: true },
  { id: 'ashar', name: 'Ashar', volume: 80, enabled: true },
  { id: 'maghrib', name: 'Maghrib', volume: 80, enabled: true },
  { id: 'isya', name: 'Isya', volume: 80, enabled: true },
];

export async function GET(req: NextRequest) {
  const user = authenticateToken(req);
  if (!user || !user.mosque_id) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }
  try {
    const [rows]: any = await pool.execute('SELECT settings FROM mosques WHERE id = ?', [user.mosque_id]);
    let adhan_settings = DEFAULT_ADHAN_SETTINGS;
    if (rows && rows.length && rows[0].settings) {
      const settings = typeof rows[0].settings === 'string' ? JSON.parse(rows[0].settings) : rows[0].settings;
      if (settings.adhan_settings) {
        adhan_settings = settings.adhan_settings;
      }
    }
    return NextResponse.json(adhan_settings);
  } catch (err) {
    return NextResponse.json(DEFAULT_ADHAN_SETTINGS);
  }
}
