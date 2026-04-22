import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken, requireSuperAdmin } from '@/lib/auth-middleware';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const user = authenticateToken(req);
  const superadminError = requireSuperAdmin(user);
  if (superadminError) return superadminError;

  const { slug } = await params;
  try {
    const [rows]: any = await pool.execute(`
      SELECT d.id as device_id, d.name, d.is_active, d.is_online, d.last_seen_at, d.created_at
      FROM devices d
      JOIN mosques m ON m.id = d.mosque_id
      WHERE m.mosque_slug = ?
      ORDER BY d.created_at
    `, [slug]);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
