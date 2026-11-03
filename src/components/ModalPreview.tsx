import React, { useRef, useEffect, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, Eye, Layers } from 'lucide-react';
import { FramedImageItem, ResolutionPreset, TemplateInfo } from '../types';
import { drawComposite, renderCompositeToBlob, downloadBlob, formatFramedFilename } from '../utils/canvas';

interface ModalPreviewProps {
  item: FramedImageItem | null;
  templateInfo: TemplateInfo;
  globalResolution: ResolutionPreset;
  onClose: () => void;
}

export const ModalPreview: React.FC<ModalPreviewProps> = ({
  item,
  templateInfo,
  globalResolution,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [zoomScale, setZoomScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const nativeW = templateInfo.width || 2160;
  const nativeH = templateInfo.height || 2160;

  const targetW = item?.overrideResolution?.width || globalResolution.width || nativeW;
  const targetH = item?.overrideResolution?.height || globalResolution.height || nativeH;

  useEffect(() => {
    if (!item || !templateInfo.element) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use crisp display size
    const displaySize = 1200;
    canvas.width = displaySize;
    canvas.height = displaySize;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (showOverlay) {
      drawComposite(ctx, item, templateInfo.element, displaySize, displaySize, nativeW, nativeH);
    } else {
      // Draw only user image to see underlying layer
      ctx.clearRect(0, 0, displaySize, displaySize);
      ctx.save();
      const brightnessVal = typeof item.brightness === 'number' ? item.brightness : 100;
      ctx.filter = `brightness(${brightnessVal}%)`;
      const imgW = item.imgElement.naturalWidth || item.originalWidth;
      const imgH = item.imgElement.naturalHeight || item.originalHeight;
      const isRotatedQuarter = item.rotation === 90 || item.rotation === 270;
      const effectiveW = isRotatedQuarter ? imgH : imgW;
      const effectiveH = isRotatedQuarter ? imgW : imgH;
      const baseScale = Math.max(displaySize / effectiveW, displaySize / effectiveH);
      const finalScale = baseScale * item.zoom;
      const drawW = imgW * finalScale;
      const drawH = imgH * finalScale;

      const scaleRatio = displaySize / nativeW;
      const cx = displaySize / 2 + item.offsetX * scaleRatio;
      const cy = displaySize / 2 + item.offsetY * scaleRatio;

      ctx.translate(cx, cy);
      if (item.rotation) ctx.rotate((item.rotation * Math.PI) / 180);
      ctx.drawImage(item.imgElement, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
      ctx.filter = 'none';
    }
  }, [item, templateInfo.element, showOverlay, nativeW, nativeH]);

  if (!item) return null;

  const handleDownload = async () => {
    if (!templateInfo.element) return;
    setIsExporting(true);
    try {
      const blob = await renderCompositeToBlob(
        item,
        templateInfo.element,
        targetW,
        targetH,
        nativeW,
        nativeH,
        'image/png',
        1.0,
        true // enhanced quality
      );
      const filename = formatFramedFilename(item.originalName, 'png');
      downloadBlob(blob, filename);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="text-base font-bold text-slate-800 truncate max-w-md">
              {item.originalName}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Framed preview • Export output: {targetW} × {targetH} px
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOverlay(!showOverlay)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                showOverlay
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
              title="Toggle overlay template on/off to view original image"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showOverlay ? 'Overlay: ON' : 'Overlay: OFF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas Display Viewport */}
        <div className="relative flex-1 bg-slate-900/90 flex items-center justify-center p-4 md:p-8 overflow-auto min-h-[350px]">
          <div
            className="relative shadow-2xl rounded-lg overflow-hidden transition-transform duration-150"
            style={{ transform: `scale(${zoomScale})` }}
          >
            <canvas
              ref={canvasRef}
              className="max-h-[62vh] max-w-[85vw] aspect-square object-contain block bg-white"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>Full quality composite preview with transparent letterhead</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setZoomScale(Math.max(0.6, zoomScale - 0.2))}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white"
                title="Zoom view out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono font-medium text-slate-700">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale(Math.min(2.0, zoomScale + 0.2))}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white"
                title="Zoom view in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm shadow-sm transition-all disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download {targetW}×{targetH} PNG</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
