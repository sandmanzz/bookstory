/** Longest side of an uploaded picture. Pages show at most about this wide, so more pixels would only cost bytes. */
export const MAX_SIDE = 1400;
const QUALITY = 0.86;
export const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

/** The size to scale to: never bigger than the original, longest side at most `max`. */
export function fitWithin(width: number, height: number, max = MAX_SIDE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export class ImageError extends Error {}

/**
 * Turns whatever the admin picked (a phone photo can be 8 MB) into a JPEG of at most MAX_SIDE pixels, in the browser,
 * so the upload is small and fast. Anything that is not a JPEG, PNG or WebP is refused with a plain message.
 */
export async function shrinkImage(file: File): Promise<Blob> {
  if (!ACCEPTED.includes(file.type)) throw new ImageError('Choose a JPEG, PNG or WebP picture.');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new ImageError('That file could not be read as a picture. Try another one.');
  }
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ImageError('This browser cannot prepare pictures. Try another browser.');
    ctx.fillStyle = '#ffffff'; // a PNG with see-through parts becomes white, not black, in a JPEG
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
    if (!blob) throw new ImageError('The picture could not be prepared. Try another one.');
    return blob;
  } finally {
    bitmap.close();
  }
}
