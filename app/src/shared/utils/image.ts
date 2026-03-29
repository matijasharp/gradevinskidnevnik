// Helper to trim canvas (replaces broken trim-canvas library)
export const trimCanvas = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const getAlpha = (x: number, y: number) => data[4 * (y * width + x) + 3];

  let top = null, bottom = null, left = null, right = null;

  // Find top
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (getAlpha(x, y) > 0) {
        top = y;
        break;
      }
    }
    if (top !== null) break;
  }

  if (top === null) return canvas; // Empty canvas

  // Find bottom
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      if (getAlpha(x, y) > 0) {
        bottom = y;
        break;
      }
    }
    if (bottom !== null) break;
  }

  // Find left
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (getAlpha(x, y) > 0) {
        left = x;
        break;
      }
    }
    if (left !== null) break;
  }

  // Find right
  for (let x = width - 1; x >= 0; x--) {
    for (let y = 0; y < height; y++) {
      if (getAlpha(x, y) > 0) {
        right = x;
        break;
      }
    }
    if (right !== null) break;
  }

  if (bottom === null || left === null || right === null) return canvas;

  const trimmedWidth = right - left + 1;
  const trimmedHeight = bottom - top + 1;
  const trimmedData = ctx.getImageData(left, top, trimmedWidth, trimmedHeight);

  const trimmedCanvas = document.createElement('canvas');
  trimmedCanvas.width = trimmedWidth;
  trimmedCanvas.height = trimmedHeight;
  const trimmedCtx = trimmedCanvas.getContext('2d');
  if (trimmedCtx) {
    trimmedCtx.putImageData(trimmedData, 0, 0);
  }

  return trimmedCanvas;
};

export async function compressImage(base64Str: string, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Failed to get canvas context'));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (e) => reject(e);
  });
}
