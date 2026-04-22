import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const [rows]: any = await pool.execute(
      `SELECT pc.*, m.name as mosque_name, m.mosque_uuid 
       FROM pairing_codes pc
       JOIN mosques m ON pc.mosque_id = m.id
       WHERE pc.code = ?`,
      [code]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Kode tidak ditemukan' 
      }, { status: 404 });
    }

    const pairing = rows[0];
    const now = new Date();
    const expiresAt = new Date(pairing.expires_at);

    if (pairing.used_at) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Kode sudah digunakan',
        used: true 
      });
    }

    if (now > expiresAt) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Kode sudah kadaluarsa',
        expired: true 
      });
    }

    return NextResponse.json({
      valid: true,
      mosque_id: pairing.mosque_id,
      mosque_name: pairing.mosque_name,
      mosque_uuid: pairing.mosque_uuid,
      expires_at: pairing.expires_at
    });
  } catch (error) {
    console.error('Error checking pairing code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}