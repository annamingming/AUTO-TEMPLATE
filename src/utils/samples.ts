/**
 * Generates sample photos for users to quickly test the Template Framer with 1 click.
 */
export function createSamplePhoto(title: string, subtitle: string, theme: 'teal' | 'sunset' | 'emerald'): Promise<{ blob: Blob; dataUrl: string; width: number; height: number; name: string }> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d')!;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (theme === 'teal') {
      grad.addColorStop(0, '#0f766e');
      grad.addColorStop(0.5, '#14b8a6');
      grad.addColorStop(1, '#5eead4');
    } else if (theme === 'sunset') {
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(0.5, '#047857');
      grad.addColorStop(1, '#34d399');
    } else {
      grad.addColorStop(0, '#064e3b');
      grad.addColorStop(0.6, '#059669');
      grad.addColorStop(1, '#6ee7b7');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative geometric shapes & circles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(
        (i * 260) % canvas.width,
        ((i * 190) % (canvas.height - 200)) + 100,
        140 + (i * 25) % 180,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Modern card block in center
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.roundRect(320, 260, canvas.width - 640, canvas.height - 520, 32);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Center icon / badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 440, 75, 0, Math.PI * 2);
    ctx.fill();

    // Medical cross icon
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(canvas.width / 2 - 14, 395, 28, 90);
    ctx.fillRect(canvas.width / 2 - 45, 426, 90, 28);

    // Typography
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
    ctx.fillText(title, canvas.width / 2, 590);

    ctx.font = '500 32px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(subtitle, canvas.width / 2, 660);

    ctx.font = '400 24px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText('Sample Event Photo • High Resolution 1920 × 1280', canvas.width / 2, 720);

    canvas.toBlob((blob) => {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      resolve({
        blob: blob!,
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        name: `${title.toLowerCase().replace(/\s+/g, '_')}.jpg`
      });
    }, 'image/jpeg', 0.95);
  });
}
