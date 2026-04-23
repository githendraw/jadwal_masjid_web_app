import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken, requireSuperAdmin } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  const user = authenticateToken(req);
  const superadminError = requireSuperAdmin(user);
  if (superadminError) return superadminError;

  try {
    const [rows]: any = await pool.execute(
      'SELECT id, mosque_uuid, mosque_slug, name as mosque_name, address, settings, lat, `long`, calculation_method, is_online, is_active, created_at FROM mosques ORDER BY name'
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
