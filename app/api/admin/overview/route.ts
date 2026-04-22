import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken, requireSuperAdmin } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  const user = authenticateToken(req);
  const superadminError = requireSuperAdmin(user);
  if (superadminError) return superadminError;

  try {
    const [stats]: any = await pool.execute(`
      SELECT
        COUNT(m.id) as total_mosques,
        COUNT(CASE WHEN m.is_active = 1 THEN 1 END) as active_tenants,
        COUNT(CASE WHEN m.is_online = 1 THEN 1 END) as online_count,
        COUNT(DISTINCT CASE WHEN m.is_active = 1 THEN m.id END) as active_mosques,
        (SELECT COUNT(*) FROM devices WHERE is_online = 1) as total_devices_online
      FROM mosques m
    `);
    return NextResponse.json(stats[0] || { total_mosques: 0, active_tenants: 0, online_count: 0, total_devices_online: 0 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
