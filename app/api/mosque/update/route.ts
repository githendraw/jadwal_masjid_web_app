import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken } from '@/lib/auth-middleware';
import { emitConfigUpdate } from '@/lib/socket-emit';

export async function PUT(req: NextRequest) {
  const user = authenticateToken(req);
  if (!user || !user.mosque_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, address, lat, long, calculation_method, runningText1, runningText2, background, is_muadzin } = body;

    const columns: string[] = [];
    const values: any[] = [];
    let needSettingsUpdate = false;
    let settingsUpdateData: Record<string, any> = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json({ error: 'Nama masjid minimal 2 karakter' }, { status: 400 });
      }
      columns.push('name = ?');
      values.push(name.trim());
    }

    if (address !== undefined) {
      columns.push('address = ?');
      values.push(address);
      settingsUpdateData.location = address;
      needSettingsUpdate = true;
    }

    if (lat !== undefined) {
      const latNum = Number(lat);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        return NextResponse.json({ error: 'Latitude harus antara -90 dan 90' }, { status: 400 });
      }
      columns.push('lat = ?');
      values.push(latNum);
    }

    if (long !== undefined) {
      const longNum = Number(long);
      if (isNaN(longNum) || longNum < -180 || longNum > 180) {
        return NextResponse.json({ error: 'Longitude harus antara -180 dan 180' }, { status: 400 });
      }
      columns.push('`long` = ?');
      values.push(longNum);
    }

    if (calculation_method !== undefined) {
      const validMethods = ['KEMENAG', 'JAKARTA_IST', 'ASRA', 'UM', 'MECCAH'];
      if (!validMethods.includes(calculation_method)) {
        return NextResponse.json({ error: `Metode harus salah satu: ${validMethods.join(', ')}` }, { status: 400 });
      }
      columns.push('calculation_method = ?');
      values.push(calculation_method);
    }

 if (runningText1 !== undefined) {
       settingsUpdateData.runningText1 = runningText1;
       needSettingsUpdate = true;
     }

     if (runningText2 !== undefined) {
        settingsUpdateData.runningText2 = runningText2;
        needSettingsUpdate = true;
      }

      if (background !== undefined) {
        settingsUpdateData.background = background;
        needSettingsUpdate = true;
      }

      if (is_muadzin !== undefined) {
        settingsUpdateData.is_muadzin = Boolean(is_muadzin);
        needSettingsUpdate = true;
      }

    if (columns.length === 0 && !needSettingsUpdate) {
      return NextResponse.json({ error: 'Tidak ada field yang diupdate' }, { status: 400 });
    }

    values.push(user.mosque_id);

    if (columns.length > 0) {
      await pool.execute(`UPDATE mosques SET ${columns.join(', ')} WHERE id = ?`, values);
    }

    if (needSettingsUpdate) {
      const [existing]: any = await pool.execute('SELECT settings FROM mosques WHERE id = ?', [user.mosque_id]);
      let settings: Record<string, any> = {};
      if (existing && existing.length && existing[0].settings) {
        settings = typeof existing[0].settings === 'string' ? JSON.parse(existing[0].settings) : existing[0].settings;
      }
      for (const [key, val] of Object.entries(settingsUpdateData)) {
        settings[key] = val;
      }
      await pool.execute('UPDATE mosques SET settings = ? WHERE id = ?', [JSON.stringify(settings), user.mosque_id]);
    }

    await emitConfigUpdate(user.mosque_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating mosque:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}