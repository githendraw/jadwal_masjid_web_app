import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { corsResponse, handleCors } from '@/lib/cors';

export async function POST(request: NextRequest) {
  const corsResult = handleCors(request);
  if (corsResult) return corsResult;
  try {
    const { code, device_uuid } = await request.json();

    if (!code || !device_uuid) {
      return corsResponse({ 
        error: 'Code and device_uuid are required' 
      }, 400);
    }

    const [rows]: any = await pool.execute(
      'SELECT pc.*, m.name as mosque_name, m.mosque_uuid, m.settings, m.lat, m.`long`, m.calculation_method, m.address FROM pairing_codes pc JOIN mosques m ON pc.mosque_id = m.id WHERE pc.code = ?',
      [code]
    );

    if (!rows || rows.length === 0) {
      return corsResponse({ 
        error: 'Kode tidak ditemukan' 
      }, 404);
    }

    const pairing = rows[0];
    const now = new Date();
    const expiresAt = new Date(pairing.expires_at);

    if (pairing.used_at) {
      return corsResponse({ 
        error: 'Kode sudah digunakan oleh perangkat lain' 
      }, 400);
    }

    if (now > expiresAt) {
      return corsResponse({ 
        error: 'Kode sudah kadaluarsa' 
      }, 400);
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

    const dbSettings = typeof pairing.settings === 'string' 
      ? JSON.parse(pairing.settings) 
      : pairing.settings || {};

    return corsResponse({
      success: true,
      device_uuid: device_uuid,
      mosque_uuid: pairing.mosque_uuid,
      mosque_id: pairing.mosque_id,
      mosque_name: pairing.mosque_name,
      settings: {
        mosqueName: pairing.mosque_name,
        location: pairing.address || dbSettings.location || '',
  runningText1: dbSettings.runningText1 || '',
         runningText2: dbSettings.runningText2 || '',
        lat: pairing.lat,
        long: pairing.long,
        calculationMethod: pairing.calculation_method || 'KEMENAG',
      },
    });
  } catch (error) {
    console.error('Error verifying pairing code:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}