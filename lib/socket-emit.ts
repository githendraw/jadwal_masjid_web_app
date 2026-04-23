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