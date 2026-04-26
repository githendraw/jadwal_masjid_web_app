import { Server } from 'socket.io';
import pool from './db';

export async function emitConfigUpdate(mosqueId: number) {
  const io = globalThis.io as Server | undefined;
  if (!io) return;

  try {
    const [rows]: any = await pool.execute(
      'SELECT mosque_uuid, name, address, settings, lat, `long`, calculation_method FROM mosques WHERE id = ?',
      [mosqueId]
    );

    if (!rows || !rows.length) return;

    const mosque = rows[0];
    const settings = typeof mosque.settings === 'string' ? JSON.parse(mosque.settings) : mosque.settings || {};

    io.to(mosque.mosque_uuid).emit('config_update', {
      mosqueName: mosque.name,
      location: mosque.address || settings.location || '',
      runningText1: settings.runningText1 || '',
      runningText2: settings.runningText2 || '',
      background: settings.background || '',
      backgrounds: settings.backgrounds || [],
      slideInterval: settings.slideInterval ?? 30000,
      animationType: settings.animationType || 'slide_ltr',
      isInfiniteLoop: typeof settings.isInfiniteLoop !== 'undefined' ? settings.isInfiniteLoop : true,
      timerSettings: settings.timerSettings || {
        pre_adhan_countdown_minutes: 2,
        iqamah_duration_minutes: { subuh: 5, dzuhur: 3, ashar: 2, maghrib: 1, isya: 2 },
        beep_sound_enabled: true,
        beep_count: 3,
        show_silent_icon_during_prayer: true,
        adhan_display_duration: 5,
      },
      announcements: settings.announcements || [],
      lat: mosque.lat,
      long: mosque.long,
      calculationMethod: mosque.calculation_method || 'KEMENAG',
      is_muadzin: settings.is_muadzin || false,
    });
  } catch (err) {
    console.error('Failed to emit config_update:', err);
  }
}

declare global {
  var io: Server | undefined;
}