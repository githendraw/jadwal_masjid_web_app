import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken } from '@/lib/auth-middleware';
import { handleCors, corsResponse } from '@/lib/cors';

export async function GET(req: NextRequest) {
  const cors = handleCors(req);
  if (cors) return cors;

  const user = authenticateToken(req);
  if (!user || !user.mosque_id) {
    return corsResponse({ error: 'No token provided' }, 401);
  }
  try {
    const [rows]: any = await pool.execute(
      'SELECT id, name, address, mosque_slug as slug, settings, lat, `long`, calculation_method, is_online, is_active FROM mosques WHERE id = ?',
      [user.mosque_id]
    );
    if (!rows || !rows.length) {
      return corsResponse({ error: 'Mosque not found' }, 404);
    }
    const mosque = rows[0];
    const settings = typeof mosque.settings === 'string' ? JSON.parse(mosque.settings) : mosque.settings || {};

   const general_settings = Object.entries(settings)
        .filter(([key]) => !['runningText1', 'runningText2', 'location', 'background', 'is_muadzin'].includes(key))
        .map(([key, val]: [string, any]) => {
          if (val && typeof val === 'object') {
            return { id: key, key, value: val.value || '', status: val.status || 'disabled', order: val.order || 0 };
          }
          return { id: key, key, value: String(val), status: 'enabled', order: 0 };
        });

    return corsResponse({
       ...mosque,
       latitude: mosque.lat,
       longitude: mosque.long,
       general_settings,
  runningText1: settings.runningText1 || '',
runningText2: settings.runningText2 || '',
       background: settings.background || '',
        is_muadzin: settings.is_muadzin || false,
        theme: settings.theme || 'klasik',
      });
   } catch (err) {
    return corsResponse({ error: String(err) }, 500);
   }
}