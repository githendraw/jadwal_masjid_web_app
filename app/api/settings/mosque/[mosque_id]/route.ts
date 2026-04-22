import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateToken } from '@/lib/auth-middleware';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ mosque_id: string }> }) {
  const user = authenticateToken(req);
  if (!user) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  const { mosque_id } = await params;
  const { prayer_times, ihror, mazhab, hijri, imsak, dark_mode, animations, push_notifications, mosque_uuid } = await req.json();

  try {
    const settings: any = { prayer_times, ihror, mazhab, hijri, imsak };
    if (dark_mode !== undefined) settings.dark_mode = dark_mode;
    if (animations !== undefined) settings.animations = animations;
    if (push_notifications !== undefined) settings.push_notifications = push_notifications;

    await pool.execute(
      'UPDATE mosques SET settings = ? WHERE id = ?',
      [JSON.stringify(settings), mosque_id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
