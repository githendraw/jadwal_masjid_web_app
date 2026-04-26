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
    const { timerSettings, announcements } = body;

    // Load existing settings JSON from DB
    const [existing]: any = await pool.execute('SELECT settings FROM mosques WHERE id = ?', [mosqueId]);
    let settings: Record<string, any> = {};
    if (existing && existing.length && existing[0].settings) {
      settings = typeof existing[0].settings === 'string' ? JSON.parse(existing[0].settings) : existing[0].settings;
    }

    // Update timer settings if provided
    if (timerSettings) {
      const validPrayers = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
      
      // Validate iqamah durations
      for (const prayer of validPrayers) {
        if (timerSettings.iqamah_duration_minutes?.[prayer] !== undefined) {
          const duration = timerSettings.iqamah_duration_minutes[prayer];
          if (duration < 1 || duration > 30) {
            return NextResponse.json({ error: `Durasi iqamah ${prayer} harus antara 1 dan 30 menit` }, { status: 400 });
          }
        }
      }

      settings.timerSettings = {
        pre_adhan_countdown_minutes: timerSettings.pre_adhan_countdown_minutes ?? 2,
        iqamah_duration_minutes: {
          subuh: timerSettings.iqamah_duration_minutes?.subuh ?? 5,
          dzuhur: timerSettings.iqamah_duration_minutes?.dzuhur ?? 3,
          ashar: timerSettings.iqamah_duration_minutes?.ashar ?? 2,
          maghrib: timerSettings.iqamah_duration_minutes?.maghrib ?? 1,
          isya: timerSettings.iqamah_duration_minutes?.isya ?? 2,
        },
        beep_sound_enabled: typeof timerSettings.beep_sound_enabled === 'boolean' ? timerSettings.beep_sound_enabled : true,
        beep_count: Math.max(1, Math.min(5, timerSettings.beep_count ?? 3)),
        show_silent_icon_during_prayer: typeof timerSettings.show_silent_icon_during_prayer !== 'undefined' ? timerSettings.show_silent_icon_during_prayer : true,
        adhan_display_duration: Math.max(3, Math.min(10, timerSettings.adhan_display_duration ?? 5)),
      };

      if (timerSettings.announcement_display_duration !== undefined) {
        settings.timerSettings = {
          ...settings.timerSettings,
          announcement_display_duration: Math.max(10, Math.min(60, timerSettings.announcement_display_duration)),
        };
      }

      if (timerSettings.show_announcement_overlay !== undefined) {
        settings.timerSettings = {
          ...settings.timerSettings,
          show_announcement_overlay: timerSettings.show_announcement_overlay,
        };
      }
    }

    // Update announcements if provided
    if (announcements !== undefined) {
      if (!Array.isArray(announcements)) {
        return NextResponse.json({ error: 'Announcements harus berupa array' }, { status: 400 });
      }
      
      const validTypes = ['pengajian', 'jumat_hari_raya', 'table'];
      for (const ann of announcements) {
        if (!validTypes.includes(ann.type)) {
          return NextResponse.json({ error: `Jenis pengumuman tidak valid: ${ann.type}` }, { status: 400 });
        }
        
        // Validate table format if type is 'table'
        if (ann.type === 'table') {
          if (!ann.headers || !Array.isArray(ann.headers)) {
            return NextResponse.json({ error: 'Tabel harus memiliki headers array' }, { status: 400 });
          }
          if (!ann.rows || !Array.isArray(ann.rows)) {
            return NextResponse.json({ error: 'Tabel harus memiliki rows array' }, { status: 400 });
          }
        }
      }
      
      settings.announcements = announcements;
    }

    // Save back to DB
    await pool.execute('UPDATE mosques SET settings = ? WHERE id = ?', [JSON.stringify(settings), mosqueId]);

    // Emit Socket.IO update to Android TV
    await emitConfigUpdate(mosqueId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating timer/announcements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
