import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { code, device_uuid } = await request.json();

    if (!code || !device_uuid) {
      return NextResponse.json({ 
        error: 'Code and device_uuid are required' 
      }, { status: 400 });
    }

    const [rows]: any = await pool.execute(
      `SELECT pc.*, m.name as mosque_name, m.mosque_uuid, m.settings
       FROM pairing_codes pc
       JOIN mosques m ON pc.mosque_id = m.id
       WHERE pc.code = ?`,
      [code]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ 
        error: 'Kode tidak ditemukan' 
      }, { status: 404 });
    }

    const pairing = rows[0];
    const now = new Date();
    const expiresAt = new Date(pairing.expires_at);

    if (pairing.used_at) {
      return NextResponse.json({ 
        error: 'Kode sudah digunakan oleh perangkat lain' 
      }, { status: 400 });
    }

    if (now > expiresAt) {
      return NextResponse.json({ 
        error: 'Kode sudah kadaluarsa' 
      }, { status: 400 });
    }

    const deviceName = `TV ${Date.now().toString(36).slice(-4).toUpperCase()}`;

    await pool.execute(
      'INSERT INTO devices (id, mosque_id, name) VALUES (?, ?, ?)',
      [device_uuid, pairing.mosque_id, deviceName]
    );

    await pool.execute(
      'UPDATE pairing_codes SET used_at = NOW(), used_by_device = ? WHERE code = ?',
      [device_uuid, code]
    );

    const settings = typeof pairing.settings === 'string' 
      ? JSON.parse(pairing.settings) 
      : pairing.settings;

    return NextResponse.json({
      success: true,
      device_uuid: device_uuid,
      mosque_uuid: pairing.mosque_uuid,
      mosque_id: pairing.mosque_id,
      mosque_name: pairing.mosque_name,
      settings
    });
  } catch (error) {
    console.error('Error verifying pairing code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}