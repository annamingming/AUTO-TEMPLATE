import React from 'react';
import {
  Download,
  DownloadCloud,
  Trash2,
  Plus,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface HeaderProps {
  imageCount: number;
  onDownloadAllIndividual: () => void;
  onDownloadAllZip: () => void;
  onClearAll: () => void;
  onTriggerUpload: () => void;
  onSelectFrameClick?: () => void;
  enhanceExportQuality?: boolean;
  onToggleEnhance?: () => void;
  isDownloadingAll: boolean;
  downloadProgress?: { current: number; total: number; filename?: string } | null;
  isZipping: boolean;
  zipProgress?: { current: number; total: number; percent: number } | null;
}

export const Header: React.FC<HeaderProps> = ({
  imageCount,
  onDownloadAllIndividual,
  onDownloadAllZip,
  onClearAll,
  onTriggerUpload,
  onSelectFrameClick,
  enhanceExportQuality = true,
  onToggleEnhance,
  isDownloadingAll,
  downloadProgress,
  isZipping,
  zipProgress,
}) => {
  return (
    <header className="w-full border-b border-emerald-100 bg-white/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/15">
            <Layers className="w-5 h-5 stroke-[2.3]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Template Framer
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                100% Client-Side Privacy
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Culion Sanitarium & General Hospital Photo Letterhead Compositor
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Always accessible Select Frame button */}
          {onSelectFrameClick && (
            <button
              type="button"
              onClick={onSelectFrameClick}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 rounded-xl transition-colors"
              title="Upload or change Layer 2 overlay frame"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Select Frame</span>
            </button>
          )}

          {imageCount > 0 && (
            <>
              {/* Clear All */}
              <button
                type="button"
                onClick={onClearAll}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200/80 rounded-xl transition-colors"
                title="Remove all uploaded images"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </button>

              {/* Add More Photos */}
              <button
                type="button"
                onClick={onTriggerUpload}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More</span>
              </button>

              {/* Enhance Quality Toggle */}
              {onToggleEnhance && (
                <button
                  type="button"
                  onClick={onToggleEnhance}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                    enhanceExportQuality
                      ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                  title="Toggle photo clarity & vibrancy enhancement for exports"
                >
                  <Sparkles
                    className={`w-3.5 h-3.5 ${
                      enhanceExportQuality ? 'text-amber-500 fill-amber-400' : 'text-slate-400'
                    }`}
                  />
                  <span>
                    Enhance Quality: <strong>{enhanceExportQuality ? 'ON' : 'OFF'}</strong>
                  </span>
                </button>
              )}

              {/* Primary Download All: Direct Separate PNGs (No Zip) */}
              <button
                type="button"
                onClick={onDownloadAllIndividual}
                disabled={isDownloadingAll || isZipping}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
                title="Download all images directly as separate PNG files (no ZIP folder)"
              >
                {isDownloadingAll ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>
                      {downloadProgress
                        ? `Downloading ${downloadProgress.current}/${downloadProgress.total}...`
                        : 'Downloading PNGs...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 stroke-[2.2]" />
                    <span>
                      Download All (PNGs){' '}
                      <span className="bg-emerald-700/70 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                        {imageCount}
                      </span>
                    </span>
                  </>
                )}
              </button>

              {/* Secondary Download: As ZIP Archive */}
              <button
                type="button"
                onClick={onDownloadAllZip}
                disabled={isDownloadingAll || isZipping}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl transition-all disabled:opacity-50"
                title="Download all images packaged inside a ZIP folder"
              >
                {isZipping ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                    <span className="text-[11px]">Zipping...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-3.5 h-3.5 text-slate-500" />
                    <span>ZIP</span>
                  </>
                )}
              </button>
            </>
          )}

          {imageCount === 0 && (
            <button
              type="button"
              onClick={onTriggerUpload}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Select Photos</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
