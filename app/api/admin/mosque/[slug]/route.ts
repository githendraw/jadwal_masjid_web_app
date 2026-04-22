import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken, requireSuperAdmin } from '@/lib/auth-middleware';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const user = authenticateToken(req);
  const superadminError = requireSuperAdmin(user);
  if (superadminError) return superadminError;

  const { slug } = await params;
  try {
    const [rows]: any = await pool.execute('SELECT * FROM mosques WHERE mosque_slug = ?', [slug]);
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
