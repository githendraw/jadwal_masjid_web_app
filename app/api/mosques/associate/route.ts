import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  try {
    const [devices]: any = await pool.execute(
      'SELECT id, mosque_id FROM devices WHERE id = ?',
      [code]
    );
    if (!devices || !devices.length) {
      return NextResponse.json({ error: 'Kode tidak valid' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      device_uuid: devices[0].id,
      mosque_id: devices[0].mosque_id
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
