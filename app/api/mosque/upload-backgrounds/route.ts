import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { compressBase64Image } from '@/lib/image-compress';
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
    const mosqueUuid = rows[0].mosque_uuid;

    const body = await req.json();
    const { backgrounds, slideInterval, animationType, isInfiniteLoop } = body;

    // Validate fields
    if (!backgrounds || !Array.isArray(backgrounds)) {
      return NextResponse.json({ error: 'Field backgrounds harus berupa array' }, { status: 400 });
    }

    if (backgrounds.length === 0) {
      return NextResponse.json({ error: 'Setidaknya ada 1 gambar yang harus diupload' }, { status: 400 });
    }

    if (backgrounds.length > 10) {
      return NextResponse.json({ error: 'Maksimal 10 gambar. Hapus beberapa gambar terlebih dahulu.' }, { status: 400 });
    }

    // Validate slide interval if provided
    if (slideInterval !== undefined && (slideInterval < 5000 || slideInterval > 300000)) {
      return NextResponse.json({ error: 'Durasi slide harus antara 5 detik dan 300 detik' }, { status: 400 });
    }

    // Validate animation type if provided
    const validAnimationTypes = ['slide_ltr', 'fade'];
    if (animationType !== undefined && !validAnimationTypes.includes(animationType)) {
      return NextResponse.json({ error: 'Jenis animasi tidak valid' }, { status: 400 });
    }

    // Compress all images server-side
    const compressedBackgrounds = [];
    for (const bg of backgrounds) {
      try {
        const compressed = await compressBase64Image(bg);
        compressedBackgrounds.push(compressed);
      } catch (error) {
        console.error('Error compressing image:', error);
        return NextResponse.json({ error: 'Gagal memproses gambar' }, { status: 500 });
      }
    }

    // Load existing settings JSON from DB
    const [existing]: any = await pool.execute('SELECT settings FROM mosques WHERE id = ?', [mosqueId]);
    let settings: Record<string, any> = {};
    if (existing && existing.length && existing[0].settings) {
      settings = typeof existing[0].settings === 'string' ? JSON.parse(existing[0].settings) : existing[0].settings;
    }

    // Update settings
    settings.backgrounds = compressedBackgrounds;
    
    if (slideInterval !== undefined) {
      settings.slideInterval = slideInterval;
    } else {
      settings.slideInterval = 30000; // default 30 seconds
    }

    if (animationType !== undefined) {
      settings.animationType = animationType;
    } else {
      settings.animationType = 'slide_ltr'; // default slide left to right
    }

    if (isInfiniteLoop !== undefined) {
      settings.isInfiniteLoop = isInfiniteLoop;
    } else {
      settings.isInfiniteLoop = true; // default infinite loop
    }

    // Save back to DB
    await pool.execute('UPDATE mosques SET settings = ? WHERE id = ?', [JSON.stringify(settings), mosqueId]);

    // Emit Socket.IO update to Android TV
    await emitConfigUpdate(mosqueId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating background slider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
