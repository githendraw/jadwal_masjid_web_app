import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const deviceUuid = req.nextUrl.searchParams.get('device_uuid');

  if (!deviceUuid) {
    return NextResponse.json({ error: 'device_uuid required' }, { status: 400 });
  }

  try {
    const [rows]: any = await pool.execute(
      'SELECT d.id AS device_uuid, d.mosque_id, m.name AS mosque_name, m.mosque_uuid, m.settings, m.address, m.lat, m.`long`, m.calculation_method FROM devices d JOIN mosques m ON d.mosque_id = m.id WHERE d.id = ?',
      [deviceUuid]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ registered: false });
    }

    const row = rows[0];
    const settings = typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings || {};

    return NextResponse.json({
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}