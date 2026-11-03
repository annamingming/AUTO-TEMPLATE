import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Download,
  Trash2,
  RotateCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Sliders,
  CopyCheck,
  Check,
  Settings2,
  Sun,
} from 'lucide-react';
import { FramedImageItem, ResolutionPreset, TemplateInfo } from '../types';
import { drawComposite, renderCompositeToBlob, downloadBlob, formatFramedFilename, formatBytes } from '../utils/canvas';

interface FramedCardProps {
  item: FramedImageItem;
  templateInfo: TemplateInfo;
  globalResolution: ResolutionPreset;
  onUpdateItem: (id: string, updates: Partial<FramedImageItem>) => void;
  onRemoveItem: (id: string) => void;
  onApplyToAll?: (id: string) => void;
  onOpenModal: (item: FramedImageItem) => void;
}

export const FramedCard: React.FC<FramedCardProps> = ({
  item,
  templateInfo,
  globalResolution,
  onUpdateItem,
  onRemoveItem,
  onApplyToAll,
  onOpenModal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; initOffsetX: number; initOffsetY: number }>({
    x: 0,
    y: 0,
    initOffsetX: 0,
    initOffsetY: 0,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [appliedAllNotice, setAppliedAllNotice] = useState(false);
  const [customWidthInput, setCustomWidthInput] = useState<string>('');

  const nativeW = templateInfo.width || 2160;
  const nativeH = templateInfo.height || 2160;

  // Determine current effective export resolution
  const activeWidth = item.overrideResolution
    ? item.overrideResolution.width
    : globalResolution.width || nativeW;
  const activeHeight = item.overrideResolution
    ? item.overrideResolution.height
    : globalResolution.height || nativeH;

  // Draw preview to canvas
  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !templateInfo.element) return;

    // Use high preview resolution for crisp rendering
    const previewSize = 800;
    canvas.width = previewSize;
    canvas.height = previewSize;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    drawComposite(ctx, item, templateInfo.element, previewSize, previewSize, nativeW, nativeH);
  }, [item, templateInfo.element, nativeW, nativeH]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  // Pointer drag for panning
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initOffsetX: item.offsetX,
      initOffsetY: item.offsetY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleFactorX = nativeW / rect.width;
    const scaleFactorY = nativeH / rect.height;

    const dx = (e.clientX - dragStartRef.current.x) * scaleFactorX;
    const dy = (e.clientY - dragStartRef.current.y) * scaleFactorY;

    onUpdateItem(item.id, {
      offsetX: Math.round(dragStartRef.current.initOffsetX + dx),
      offsetY: Math.round(dragStartRef.current.initOffsetY + dy),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDragging(false);
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    const newZoom = Math.min(4.0, Math.max(1.0, Number((item.zoom + delta).toFixed(2))));
    onUpdateItem(item.id, { zoom: newZoom });
  };

  // Actions
  const handleResetPosition = () => {
    onUpdateItem(item.id, { offsetX: 0, offsetY: 0, zoom: 1.0, brightness: 100 });
  };

  const handleRotate = () => {
    const nextRot = ((item.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    onUpdateItem(item.id, { rotation: nextRot });
  };

  const handleApplyToAll = () => {
    if (onApplyToAll) {
      onApplyToAll(item.id);
      setAppliedAllNotice(true);
      setTimeout(() => setAppliedAllNotice(false), 2000);
    }
  };

  // Download individual image
  const handleDownload = async () => {
    if (!templateInfo.element) return;
    setIsExporting(true);

    try {
      const blob = await renderCompositeToBlob(
        item,
        templateInfo.element,
        activeWidth,
        activeHeight,
        nativeW,
        nativeH,
        'image/png',
        1.0,
        true // enhanced quality
      );
      const filename = formatFramedFilename(item.originalName, 'png');
      downloadBlob(blob, filename);
    } catch (err) {
      console.error('Failed to export image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="group relative flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-200/80 transition-all duration-200 overflow-hidden"
    >
      {/* Top Card Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div className="min-w-0 pr-2">
          <h4 className="text-sm font-semibold text-slate-800 truncate" title={item.originalName}>
            {item.originalName}
          </h4>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>
              {item.originalWidth} × {item.originalHeight} px
            </span>
            <span>•</span>
            <span>{formatBytes(item.sizeBytes)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onOpenModal(item)}
            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Inspect full preview"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemoveItem(item.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Remove image"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Canvas Preview with Interactive Drag */}
      <div className="relative aspect-square w-full bg-slate-900/5 select-none overflow-hidden group/canvas">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          className={`w-full h-full object-contain transition-all ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          title="Click and drag to reposition photo, scroll mouse wheel to zoom"
        />

        {/* Drag Hint overlay pill */}
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 opacity-80 group-hover/canvas:opacity-100 transition-opacity">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-medium shadow-sm">
            <Move className="w-3 h-3 text-emerald-400" />
            <span>Drag photo to reposition</span>
          </div>
        </div>

        {/* Rotation indicator badge if rotated */}
        {item.rotation !== 0 && (
          <div className="absolute top-3 left-3 px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-semibold tracking-wide">
            {item.rotation}°
          </div>
        )}

        {/* Quick Zoom & Brightness Badges */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {(item.brightness ?? 100) !== 100 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/90 backdrop-blur-sm text-white rounded-md text-[11px] font-medium shadow-xs">
              <Sun className="w-3 h-3" />
              <span>{item.brightness}%</span>
            </div>
          )}
          <div className="px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white rounded-md text-[11px] font-medium">
            {item.zoom.toFixed(1)}x
          </div>
        </div>
      </div>

      {/* Framing Controls Bar */}
      <div className="p-4 flex flex-col gap-3 bg-white flex-1 justify-between">
        {/* Zoom & Brightness Sliders */}
        <div className="space-y-3">
          {/* Zoom Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                Photo Zoom
              </span>
              <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                {Math.round(item.zoom * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateItem(item.id, {
                    zoom: Math.max(1.0, Number((item.zoom - 0.1).toFixed(2))),
                  })
                }
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="1.0"
                max="3.5"
                step="0.05"
                value={item.zoom}
                onChange={(e) => onUpdateItem(item.id, { zoom: parseFloat(e.target.value) })}
                className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />

              <button
                type="button"
                onClick={() =>
                  onUpdateItem(item.id, {
                    zoom: Math.min(3.5, Number((item.zoom + 0.1).toFixed(2))),
                  })
                }
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Brightness Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                Brightness
              </span>
              <div className="flex items-center gap-1.5">
                {(item.brightness ?? 100) !== 100 && (
                  <button
                    type="button"
                    onClick={() => onUpdateItem(item.id, { brightness: 100 })}
                    className="text-[10px] text-amber-700 hover:text-amber-800 hover:underline font-medium"
                    title="Reset brightness to default 100%"
                  >
                    Reset
                  </button>
                )}
                <span className="font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                  {item.brightness ?? 100}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateItem(item.id, {
                    brightness: Math.max(40, (item.brightness ?? 100) - 10),
                  })
                }
                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors text-xs font-semibold"
                title="Darker (-10%)"
              >
                -
              </button>

              <input
                type="range"
                min="40"
                max="180"
                step="5"
                value={item.brightness ?? 100}
                onChange={(e) =>
                  onUpdateItem(item.id, { brightness: parseInt(e.target.value, 10) })
                }
                className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              <button
                type="button"
                onClick={() =>
                  onUpdateItem(item.id, {
                    brightness: Math.min(180, (item.brightness ?? 100) + 10),
                  })
                }
                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors text-xs font-semibold"
                title="Brighter (+10%)"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick reposition buttons */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={handleResetPosition}
              className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 rounded-lg transition-colors font-medium"
              title="Center & reset scale"
            >
              <RotateCcw className="w-3 h-3" />
              Center
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 rounded-lg transition-colors font-medium"
              title="Rotate 90 degrees clockwise"
            >
              <RotateCw className="w-3 h-3" />
              Rotate
            </button>
            <button
              type="button"
              onClick={handleApplyToAll}
              className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 rounded-lg transition-colors font-medium"
              title="Apply this exact zoom and offset to all other uploaded photos"
            >
              {appliedAllNotice ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600">Applied</span>
                </>
              ) : (
                <>
                  <CopyCheck className="w-3 h-3" />
                  Sync All
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Sizing toggle for this item */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
            <span>Export Resolution:</span>
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="text-emerald-700 font-medium hover:underline flex items-center gap-1"
            >
              <Settings2 className="w-3 h-3" />
              {activeWidth} × {activeHeight} px
            </button>
          </div>

          {showSettings && (
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 mb-2.5 space-y-2">
              <div className="text-[11px] font-semibold text-slate-700">Choose Output Size:</div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateItem(item.id, { overrideResolution: null });
                    setShowSettings(false);
                  }}
                  className={`px-2 py-1.5 text-left rounded-lg border text-[11px] ${
                    !item.overrideResolution
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div className="truncate">Use Global ({globalResolution.label})</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {globalResolution.width || nativeW}×{globalResolution.height || nativeH}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateItem(item.id, {
                      overrideResolution: {
                        width: nativeW,
                        height: nativeH,
                        label: 'Original Template (Full)',
                      },
                    });
                    setShowSettings(false);
                  }}
                  className={`px-2 py-1.5 text-left rounded-lg border text-[11px] ${
                    item.overrideResolution?.width === nativeW
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div className="truncate">Full Template</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {nativeW}×{nativeH}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateItem(item.id, {
                      overrideResolution: {
                        width: 1080,
                        height: 1080,
                        label: 'Social Square (1080p)',
                      },
                    });
                    setShowSettings(false);
                  }}
                  className={`px-2 py-1.5 text-left rounded-lg border text-[11px] ${
                    item.overrideResolution?.width === 1080
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div className="truncate">Social Square</div>
                  <div className="text-[10px] text-slate-500 font-mono">1080×1080</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateItem(item.id, {
                      overrideResolution: {
                        width: 720,
                        height: 720,
                        label: 'Web Fast (720p)',
                      },
                    });
                    setShowSettings(false);
                  }}
                  className={`px-2 py-1.5 text-left rounded-lg border text-[11px] ${
                    item.overrideResolution?.width === 720
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div className="truncate">Compact</div>
                  <div className="text-[10px] text-slate-500 font-mono">720×720</div>
                </button>
              </div>

              {/* Custom size input */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="number"
                  placeholder="Custom px (e.g. 1500)"
                  value={customWidthInput}
                  onChange={(e) => setCustomWidthInput(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-800"
                  min="200"
                  max="4320"
                />
                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseInt(customWidthInput, 10);
                    if (parsed && parsed >= 200 && parsed <= 4320) {
                      onUpdateItem(item.id, {
                        overrideResolution: {
                          width: parsed,
                          height: parsed,
                          label: `Custom (${parsed}×${parsed})`,
                        },
                      });
                      setShowSettings(false);
                    }
                  }}
                  className="px-2.5 py-1 text-xs bg-slate-800 text-white rounded-md font-medium hover:bg-slate-900"
                >
                  Set
                </button>
              </div>
            </div>
          )}

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium rounded-xl text-sm shadow-sm transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating PNG...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Framed PNG</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
