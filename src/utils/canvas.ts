import { FramedImageItem } from '../types';

/**
 * Applies a fast unsharp masking filter to enhance fine edge details,
 * textures, and clarity on the user's photo before overlaying the template.
 */
export function applySharpenKernel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number = 0.18
) {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const copy = new Uint8ClampedArray(data);

    const w = width;
    const h = height;
    const cVal = 1 + 4 * amount;
    const negVal = -amount;

    for (let y = 1; y < h - 1; y++) {
      const rowOffset = y * w;
      for (let x = 1; x < w - 1; x++) {
        const i = (rowOffset + x) * 4;

        // Skip completely transparent pixels
        if (copy[i + 3] === 0) continue;

        const top = i - w * 4;
        const bottom = i + w * 4;
        const left = i - 4;
        const right = i + 4;

        // Red
        data[i] = copy[i] * cVal + (copy[top] + copy[bottom] + copy[left] + copy[right]) * negVal;
        // Green
        data[i + 1] = copy[i + 1] * cVal + (copy[top + 1] + copy[bottom + 1] + copy[left + 1] + copy[right + 1]) * negVal;
        // Blue
        data[i + 2] = copy[i + 2] * cVal + (copy[top + 2] + copy[bottom + 2] + copy[left + 2] + copy[right + 2]) * negVal;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    // If browser security limits getImageData, continue gracefully
    console.warn('Canvas sharpen pass bypassed:', err);
  }
}

/**
 * Composites the user image (Layer 1, back) and template overlay (Layer 2, front)
 * onto a target canvas context with optional high-definition quality enhancement.
 */
export function drawComposite(
  ctx: CanvasRenderingContext2D,
  item: FramedImageItem,
  templateImg: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  nativeTemplateWidth: number = 2160,
  nativeTemplateHeight: number = 2160,
  enhanceQuality: boolean = false
) {
  // Clear canvas
  ctx.clearRect(0, 0, targetWidth, targetHeight);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const imgW = item.imgElement.naturalWidth || item.originalWidth;
  const imgH = item.imgElement.naturalHeight || item.originalHeight;

  // Account for 90/270 deg rotation swapping effective dimensions
  const isRotatedQuarter = item.rotation === 90 || item.rotation === 270;
  const effectiveW = isRotatedQuarter ? imgH : imgW;
  const effectiveH = isRotatedQuarter ? imgW : imgH;

  // Cover behavior: scale to fill canvas completely without distortion
  const baseScale = Math.max(targetWidth / effectiveW, targetHeight / effectiveH);
  const finalScale = baseScale * (item.zoom || 1.0);

  // Scaled dimensions of original unrotated image
  const drawW = imgW * finalScale;
  const drawH = imgH * finalScale;

  // Scale offset proportionately if target canvas is resized
  const scaleRatioX = targetWidth / (nativeTemplateWidth || targetWidth);
  const scaleRatioY = targetHeight / (nativeTemplateHeight || targetHeight);
  const cx = targetWidth / 2 + item.offsetX * scaleRatioX;
  const cy = targetHeight / 2 + item.offsetY * scaleRatioY;

  // Transform and draw Layer 1: User Image (Back)
  const brightnessVal = typeof item.brightness === 'number' ? item.brightness : 100;
  
  if (enhanceQuality) {
    // Enhanced quality: subtle clarity, micro-contrast & vibrancy boost
    ctx.filter = `brightness(${brightnessVal}%) contrast(104%) saturate(106%)`;
  } else {
    ctx.filter = `brightness(${brightnessVal}%)`;
  }

  ctx.translate(cx, cy);
  if (item.rotation) {
    ctx.rotate((item.rotation * Math.PI) / 180);
  }
  ctx.drawImage(item.imgElement, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // If quality enhancement is enabled, apply edge clarity sharpening to the photo
  if (enhanceQuality) {
    applySharpenKernel(ctx, targetWidth, targetHeight, 0.16);
  }

  // Layer 2: Template Overlay (Front) - drawn on top, completely unchanged
  ctx.filter = 'none';
  if (templateImg && templateImg.complete && templateImg.naturalWidth > 0) {
    ctx.drawImage(templateImg, 0, 0, targetWidth, targetHeight);
  }
}

/**
 * Renders the composite to an offscreen canvas and returns a high-resolution Blob.
 * By default enhanceQuality is true for maximum clarity on exports.
 */
export async function renderCompositeToBlob(
  item: FramedImageItem,
  templateImg: HTMLImageElement,
  exportWidth: number,
  exportHeight: number,
  nativeTemplateWidth: number,
  nativeTemplateHeight: number,
  format: 'image/png' | 'image/jpeg' = 'image/png',
  quality: number = 1.0,
  enhanceQuality: boolean = true
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = exportWidth;
  canvas.height = exportHeight;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context');
  }

  drawComposite(
    ctx,
    item,
    templateImg,
    exportWidth,
    exportHeight,
    nativeTemplateWidth,
    nativeTemplateHeight,
    enhanceQuality
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob failed'));
        }
      },
      format,
      quality
    );
  });
}

/**
 * Triggers a browser download for a given Blob and filename.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Formats a clean output filename: originalname_framed.png
 */
export function formatFramedFilename(originalName: string, ext = 'png'): string {
  // Strip existing extension
  const dotIndex = originalName.lastIndexOf('.');
  const baseName = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  // Clean special characters but keep readable name
  const cleanBase = baseName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'image';
  return `${cleanBase}_framed.${ext}`;
}

/**
 * Formats byte size into human readable string
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
