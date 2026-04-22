import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  const { email, password, mosque_name, mosque_id, mosque_uuid, device_uuid } = await req.json();
  try {
    let finalMosqueId: number | null = mosque_id;
    let finalMosqueUuid: string | null = mosque_uuid;

    if (mosque_name && !finalMosqueId) {
      const slug = mosque_name.toLowerCase().replace(/\s+/g, '-');
      const [existing]: any = await pool.execute('SELECT id, mosque_uuid FROM mosques WHERE mosque_slug = ?', [slug]);
      if (!existing || !(existing as any[]).length) {
        const newMosqueUuid = crypto.randomUUID();
        try {
          const [newMosque] = await pool.execute(
            'INSERT INTO mosques (name, mosque_slug, mosque_uuid, settings) VALUES (?, ?, ?, ?)',
            [mosque_name, slug, newMosqueUuid, JSON.stringify({})]
          );
          finalMosqueId = (newMosque as any).insertId;
          finalMosqueUuid = newMosqueUuid;
        } catch (err: any) {
          console.warn('mosque_uuid column not found, using fallback:', err.message);
          const [newMosque] = await pool.execute(
            'INSERT INTO mosques (name, mosque_slug, settings) VALUES (?, ?, ?)',
            [mosque_name, slug, JSON.stringify({})]
          );
          finalMosqueId = (newMosque as any).insertId;
        }
      } else {
        finalMosqueId = existing[0].id;
        finalMosqueUuid = existing[0].mosque_uuid;
      }
    }

    if (device_uuid) {
      try {
        await pool.execute(
          'INSERT INTO devices (id, mosque_id, name) VALUES (?, ?, ?)',
          [device_uuid, finalMosqueId, 'Device']
        );
      } catch (err: any) {
        console.warn('Device table not found:', err.message);
      }
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, role, mosque_id, is_active) VALUES (?, ?, ?, ?, ?)',
      [email, hash, 'user', finalMosqueId, 1]
    );

    return NextResponse.json({
      id: (result as any).insertId,
      mosque_id: finalMosqueId,
      mosque_uuid: finalMosqueUuid,
      success: true
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
