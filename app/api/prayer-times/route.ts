import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken } from '@/lib/auth-middleware';

const DEFAULT_PRAYER_TIMES = [
  { id: 'subuh', name: 'subuh', time: '04:30', status: 'enabled' },
  { id: 'terbit', name: 'terbit', time: '05:45', status: 'enabled' },
  { id: 'dhuhur', name: 'dhuhur', time: '11:45', status: 'enabled' },
  { id: 'ashar', name: 'ashar', time: '15:15', status: 'enabled' },
  { id: 'maghrib', name: 'maghrib', time: '17:45', status: 'enabled' },
  { id: 'isya', name: 'isya', time: '19:00', status: 'enabled' },
];

export async function GET(req: NextRequest) {
  const user = authenticateToken(req);
  if (!user || !user.mosque_id) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }
  try {
    const [rows]: any = await pool.execute('SELECT settings FROM mosques WHERE id = ?', [user.mosque_id]);
    let prayer_times = DEFAULT_PRAYER_TIMES;
    if (rows && rows.length && rows[0].settings) {
      const settings = typeof rows[0].settings === 'string' ? JSON.parse(rows[0].settings) : rows[0].settings;
      if (settings.prayer_times) {
        prayer_times = settings.prayer_times;
      }
    }
    return NextResponse.json(prayer_times);
  } catch (err) {
    return NextResponse.json(DEFAULT_PRAYER_TIMES);
  }
}
