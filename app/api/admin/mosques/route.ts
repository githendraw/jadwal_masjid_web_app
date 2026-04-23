import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken, requireSuperAdmin } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  const user = authenticateToken(req);
  const superadminError = requireSuperAdmin(user);
  if (superadminError) return superadminError;

  try {
    const [mosques]: any = await pool.execute(
      'SELECT id, mosque_uuid, mosque_slug, name as mosque_name, address, settings, lat, `long`, calculation_method, is_online, is_active, created_at FROM mosques ORDER BY name'
    );

    // Fetch devices for all mosques
    const mosque_ids = mosques.map((m: any) => m.id);
    let devices = [];
    if (mosque_ids.length > 0) {
      const [deviceRows]: any = await pool.execute(
        'SELECT id, mosque_id, name, is_online, is_active FROM devices WHERE mosque_id IN (?) ORDER BY name',
        [mosque_ids]
      );
      devices = deviceRows;
    }

    // Group devices by mosque_id
    const devicesByMosque: Record<number, any[]> = {};
    devices.forEach((d: any) => {
      if (!devicesByMosque[d.mosque_id]) devicesByMosque[d.mosque_id] = [];
      devicesByMosque[d.mosque_id].push(d);
    });

    // Attach devices to each mosque
    const result = mosques.map((m: any) => ({
      ...m,
      devices: devicesByMosque[m.id] || [],
      device_count: (devicesByMosque[m.id] || []).length,
      online_devices: (devicesByMosque[m.id] || []).filter((d: any) => d.is_online).length,
    }));

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
