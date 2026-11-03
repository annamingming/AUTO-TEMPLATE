import { TemplateInfo } from '../types';

/**
 * Creates preset transparent overlay frames rendered on 2160x2160 canvases
 * with transparent middle so photos shine through.
 */
export function createPresetFrame(type: 'minimal' | 'certificate' | 'modern'): Promise<TemplateInfo> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 2160;
    canvas.height = 2160;
    const ctx = canvas.getContext('2d')!;

    // Transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (type === 'minimal') {
      // Modern Minimal Emerald Frame
      // Top bar with branding
      ctx.fillStyle = '#065f46'; // emerald 800
      ctx.fillRect(0, 0, canvas.width, 180);

      // Accent gold stripe
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(0, 175, canvas.width, 10);

      // Top text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('HEALTHCARE EXCELLENCE & MEDICAL OUTREACH', 120, 95);

      // Bottom footer band
      const footerH = 260;
      const footerY = canvas.height - footerH;
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, footerY, canvas.width, footerH);

      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, footerY - 8, canvas.width, 8);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'italic 52px Georgia, serif';
      ctx.fillText('Dedicated to Compassion, Healing, and Community Health', canvas.width / 2, footerY + 90);

      ctx.font = '400 36px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('📍 Palawan Regional Health Center   •   🌐 www.healthservices.gov   •   📞 (02) 8888-HEALTH', canvas.width / 2, footerY + 180);
    } else if (type === 'certificate') {
      // Golden Certificate Border Frame
      ctx.lineWidth = 40;
      ctx.strokeStyle = '#047857';
      ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

      ctx.lineWidth = 14;
      ctx.strokeStyle = '#d97706';
      ctx.strokeRect(100, 100, canvas.width - 200, canvas.height - 200);

      // Top crest plaque
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.roundRect(canvas.width / 2 - 420, 50, 840, 140, 24);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
      ctx.fillText('OFFICIAL EVENT DOCUMENTATION', canvas.width / 2, 120);

      // Bottom band
      const footerH = 220;
      const footerY = canvas.height - footerH - 60;
      ctx.fillStyle = 'rgba(6, 78, 59, 0.95)';
      ctx.beginPath();
      ctx.roundRect(140, footerY, canvas.width - 280, footerH, 20);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
      ctx.fillText('Culion Sanitarium and General Hospital', canvas.width / 2, footerY + 80);

      ctx.font = '400 32px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('Healthcare Services in Action • Brgy. Tiza, Culion, Palawan', canvas.width / 2, footerY + 150);
    } else {
      // Modern Vibrant Frame
      // Top header with curved badge
      ctx.fillStyle = '#0f766e';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(canvas.width, 0);
      ctx.lineTo(canvas.width, 160);
      ctx.lineTo(0, 200);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 58px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ANNUAL MEDICAL MISSION & ASSEMBLY', canvas.width / 2, 95);

      // Bottom curved footer
      const footerY = canvas.height - 240;
      ctx.fillStyle = '#0f766e';
      ctx.beginPath();
      ctx.moveTo(0, footerY + 40);
      ctx.lineTo(canvas.width, footerY);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#2dd4bf';
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'italic bold 52px system-ui, -apple-system, sans-serif';
      ctx.fillText('We Care More, We Serve Better, We Excel Further', canvas.width / 2, canvas.height - 145);

      ctx.font = '400 34px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('Official Activity Record • Department of Health Philippines', canvas.width / 2, canvas.height - 75);
    }

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob!);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const names = {
          minimal: 'Emerald Outreach Banner',
          certificate: 'Official Event Certificate',
          modern: 'Annual Assembly Banner',
        };
        resolve({
          id: `preset-${type}`,
          name: names[type],
          url,
          element: img,
          width: canvas.width,
          height: canvas.height,
          loaded: true,
          isCustom: false,
        });
      };
    }, 'image/png');
  });
}
