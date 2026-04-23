import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken } from '@/lib/auth-middleware';
import { handleCors, corsResponse } from '@/lib/cors';

export async function GET(req: NextRequest) {
  const cors = handleCors(req);
  if (cors) return cors;
  const user = authenticateToken(req);
  if (!user || !user.mosque_id) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }
  try {
    const [rows]: any = await pool.execute(
      'SELECT id, name, address, mosque_slug as slug, settings, lat, `long`, calculation_method, is_online, is_active FROM mosques WHERE id = ?',
      [user.mosque_id]
    );
    if (!rows || !rows.length) {
      return NextResponse.json({ error: 'Mosque not found' }, { status: 404 });
    }
    const mosque = rows[0];
    const settings = typeof mosque.settings === 'string' ? JSON.parse(mosque.settings) : mosque.settings || {};

   const general_settings = Object.entries(settings)
        .filter(([key]) => !['runningText1', 'runningText2', 'location', 'qibla_direction', 'background'].includes(key))
        .map(([key, val]: [string, any]) => {
          if (val && typeof val === 'object') {
            return { id: key, key, value: val.value || '', status: val.status || 'disabled', order: val.order || 0 };
          }
          return { id: key, key, value: String(val), status: 'enabled', order: 0 };
        });

    return NextResponse.json({
       ...mosque,
       latitude: mosque.lat,
       longitude: mosque.long,
       general_settings,
  runningText1: settings.runningText1 || '',
        runningText2: settings.runningText2 || '',
       qibla_direction: settings.qibla_direction || { bearing: 0, method: '' },
       background: settings.background || '',
     });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}