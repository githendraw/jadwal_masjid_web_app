import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { emitConfigUpdate } from '@/lib/socket-emit';

export async function PUT(req: NextRequest) {
  const user = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify token and get mosque_id
    const [rows]: any = await pool.execute(
      'SELECT id, mosque_uuid FROM mosques WHERE id = (SELECT id FROM users WHERE token = ? LIMIT 1)',
      [user]
    );

    if (!rows || !rows.length) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mosqueId = rows[0].id;
    const body = await req.json();
    const { announcements, timerSettings } = body;

    // Load existing settings JSON from DB
    const [existing]: any = await pool.execute('SELECT settings FROM mosques WHERE id = ?', [mosqueId]);
    let settings: Record<string, any> = {};
    if (existing && existing.length && existing[0].settings) {
      settings = typeof existing[0].settings === 'string' ? JSON.parse(existing[0].settings) : existing[0].settings;
    }

    // Update announcements if provided
    if (announcements !== undefined) {
      if (!Array.isArray(announcements)) {
        return NextResponse.json({ error: 'Announcements harus berupa array' }, { status: 400 });
      }
      settings.announcements = announcements;
    }

    // Update timer settings if provided
    if (timerSettings) {
      const validTypes = ['pengajian', 'jumat_hari_raya', 'table'];
      
      for (const ann of (settings.announcements || [])) {
        if (!validTypes.includes(ann.type)) {
          return NextResponse.json({ error: `Jenis pengumuman tidak valid: ${ann.type}` }, { status: 400 });
        }
      }

      settings.timerSettings = {
        pre_adhan_countdown_minutes: timerSettings.pre_adhan_countdown_minutes ?? 2,
        iqamah_duration_minutes: timerSettings.iqamah_duration_minutes ?? 2,
        beep_sound_enabled: typeof timerSettings.beep_sound_enabled === 'boolean' ? timerSettings.beep_sound_enabled : true,
        beep_count: timerSettings.beep_count ?? 3,
        show_silent_icon_during_prayer: typeof timerSettings.show_silent_icon_during_prayer !== 'undefined' ? timerSettings.show_silent_icon_during_prayer : true,
      };

      if (timerSettings.announcement_display_duration !== undefined) {
        settings.timerSettings = {
          ...settings.timerSettings,
          announcement_display_duration: Math.max(10, Math.min(60, timerSettings.announcement_display_duration)), // 10-60 seconds
        };
      }

      if (timerSettings.show_announcement_overlay !== undefined) {
        settings.timerSettings = {
          ...settings.timerSettings,
          show_announcement_overlay: timerSettings.show_announcement_overlay,
        };
      }
    }

    // Save back to DB
    await pool.execute('UPDATE mosques SET settings = ? WHERE id = ?', [JSON.stringify(settings), mosqueId]);

    // Emit Socket.IO update to Android TV
    await emitConfigUpdate(mosqueId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating announcements/timer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
