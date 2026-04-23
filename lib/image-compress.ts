import sharp from 'sharp';

export async function compressBase64Image(base64: string, options?: {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}): Promise<string> {
  const { quality = 70, maxWidth = 1920, maxHeight = 1080 } = options || {};

  try {
    const buffer = Buffer.from(base64.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
    const metadata = await sharp(buffer).metadata();
    const { width = 0, height = 0 } = metadata;

    let newWidth = width;
    let newHeight = height;

    if (width > maxWidth) {
      newHeight = Math.round((height * maxWidth) / width);
      newWidth = maxWidth;
    }
    if (newHeight > maxHeight) {
      newWidth = Math.round((newWidth * maxHeight) / newHeight);
      newHeight = maxHeight;
    }

    const compressed = await sharp(buffer)
      .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    const base64String = compressed.toString('base64');
    const mime = 'image/jpeg';
    return `data:${mime};base64,${base64String}`;
  } catch (error) {
    console.error('Error compressing image:', error);
    return base64;
  }
}
