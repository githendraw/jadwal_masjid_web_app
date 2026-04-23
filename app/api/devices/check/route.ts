import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { corsResponse, handleCors } from '@/lib/cors';

export async function GET(req: NextRequest) {
  const corsResult = handleCors(req);
  if (corsResult) return corsResult;
  const deviceUuid = req.nextUrl.searchParams.get('device_uuid');

  if (!deviceUuid) {
    return corsResponse({ error: 'device_uuid required' }, 400);
  }

  try {
    const [rows]: any = await pool.execute(
      'SELECT d.id AS device_uuid, d.mosque_id, m.name AS mosque_name, m.mosque_uuid, m.settings, m.address, m.lat, m.`long`, m.calculation_method FROM devices d JOIN mosques m ON d.mosque_id = m.id WHERE d.id = ?',
      [deviceUuid]
    );

    if (!rows || rows.length === 0) {
      return corsResponse({ registered: false });
    }

    const row = rows[0];
    const settings = typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings || {};

    return corsResponse({
      registered: true,
      device_uuid: row.device_uuid,
      mosque_id: row.mosque_id,
      mosque_uuid: row.mosque_uuid,
      mosque_name: row.mosque_name,
      settings: {
        mosqueName: row.mosque_name,
        location: row.address || settings.location || '',
 runningText1: settings.runningText1 || '',
         runningText2: settings.runningText2 || '',
        lat: row.lat,
        long: row.long,
        calculationMethod: row.calculation_method || 'KEMENAG',
      },
    });
  } catch (error) {
    console.error('Error checking device:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}