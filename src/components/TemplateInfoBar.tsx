import React, { useState, useRef } from 'react';
import {
  Layers,
  CheckCircle2,
  Sliders,
  ChevronDown,
  Sparkles,
  Upload,
  Trash2,
} from 'lucide-react';
import { ResolutionPreset, TemplateInfo } from '../types';

interface TemplateInfoBarProps {
  templateInfo: TemplateInfo;
  availableFrames: TemplateInfo[];
  selectedResolution: ResolutionPreset;
  resolutionPresets: ResolutionPreset[];
  onSelectFrame: (frame: TemplateInfo) => void;
  onUploadCustomFrames: (files: File[]) => void;
  onDeleteFrame: (frameId: string) => void;
  onSelectResolution: (preset: ResolutionPreset) => void;
  onSetCustomResolution: (width: number, height: number) => void;
  imageCount: number;
  onOpenFrameModal: () => void;
}

export const TemplateInfoBar: React.FC<TemplateInfoBarProps> = ({
  templateInfo,
  availableFrames,
  selectedResolution,
  resolutionPresets,
  onSelectFrame,
  onUploadCustomFrames,
  onDeleteFrame,
  onSelectResolution,
  onSetCustomResolution,
  imageCount,
  onOpenFrameModal,
}) => {
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showFrameDropdown, setShowFrameDropdown] = useState(false);
  const [customDimension, setCustomDimension] = useState(1500);

  const fileInputDirectRef = useRef<HTMLInputElement | null>(null);

  const nativeW = templateInfo.width || 2160;
  const nativeH = templateInfo.height || 2160;

  const handleDirectFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadCustomFrames(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <>
      {/* Hidden file input specifically for direct upload fallback */}
      <input
        ref={fileInputDirectRef}
        type="file"
        multiple
        accept="image/png,image/webp"
        className="hidden"
        onChange={handleDirectFrameUpload}
      />

      <div
        className={`w-full bg-white/95 backdrop-blur-md border border-emerald-100 rounded-2xl p-4 shadow-sm relative transition-all ${
          showFrameDropdown || showPresetsMenu ? 'z-40' : 'z-20'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Active Frame details & Quick Switcher */}
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Small thumbnail of active frame */}
            <div
              onClick={onOpenFrameModal}
              className="relative w-14 h-14 rounded-xl border border-emerald-200/90 bg-[repeating-conic-gradient(#f8fafc_0%_25%,#ffffff_0%_50%)] bg-[length:12px_12px] overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-inner cursor-pointer hover:border-emerald-400 group transition-all"
              title="Click to view all frames in gallery"
            >
              <img
                src={templateInfo.url}
                alt={templateInfo.name}
                className="w-full h-full object-contain filter drop-shadow-2xs group-hover:scale-105 transition-transform"
              />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-slate-900 truncate">
                  {templateInfo.name || 'Hospital Letterhead Frame'}
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  Layer 2 Overlay
                </span>
                {templateInfo.isCustom && (
                  <span className="inline-flex text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Custom Frame
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5">
                <span>
                  Frame Size:{' '}
                  <strong className="text-slate-700 font-mono">
                    {nativeW} × {nativeH} px
                  </strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-700">
                  <Layers className="w-3.5 h-3.5" />
                  Layer 1: Back (Photo) &bull; Layer 2: Front (Frame)
                </span>
              </div>
            </div>
          </div>

          {/* Right: Frame selection actions + Export size */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Quick Frame Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFrameDropdown(!showFrameDropdown)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                title="Choose from available frames"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Frames ({availableFrames.length})</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showFrameDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowFrameDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in text-xs">
                    <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Select Layer 2 Frame</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowFrameDropdown(false);
                          onOpenFrameModal();
                        }}
                        className="text-emerald-700 hover:underline normal-case font-medium"
                      >
                        View Gallery
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto py-1">
                      {availableFrames.map((frame) => {
                        const isSelected = frame.id === templateInfo.id;
                        const canDelete = availableFrames.length > 1;

                        return (
                          <div
                            key={frame.id}
                            className={`w-full px-3.5 py-2 flex items-center justify-between gap-2 hover:bg-emerald-50/70 transition-colors ${
                              isSelected
                                ? 'bg-emerald-50 text-emerald-900 font-semibold'
                                : 'text-slate-700'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onSelectFrame(frame);
                                setShowFrameDropdown(false);
                              }}
                              className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                            >
                              <div className="w-8 h-8 rounded-lg border border-slate-200 bg-[repeating-conic-gradient(#f8fafc_0%_25%,#ffffff_0%_50%)] bg-[length:8px_8px] p-0.5 shrink-0 overflow-hidden">
                                <img
                                  src={frame.url}
                                  alt={frame.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="truncate">{frame.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {frame.width}×{frame.height} px
                                  {frame.isCustom && ' • Custom'}
                                </div>
                              </div>
                            </button>

                            <div className="flex items-center gap-1">
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteFrame(frame.id);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  title={`Delete "${frame.name}"`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-100 pt-1.5 px-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowFrameDropdown(false);
                          onOpenFrameModal();
                        }}
                        className="w-full py-2 px-3 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Manage / Upload Frames</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 2. THE USER'S EXPLICIT BUTTON: "Select Frame" -> Opens Frame Selector Modal directly */}
            <button
              type="button"
              onClick={onOpenFrameModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl shadow-xs transition-colors"
              title="Open frame gallery to select, upload, or delete Layer 2 overlay frames"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Select Frame</span>
            </button>

            {/* 3. Export Dimension Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresetsMenu(!showPresetsMenu)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Export:{' '}
                  <strong className="text-emerald-800 font-semibold">
                    {selectedResolution.label}
                  </strong>
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showPresetsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowPresetsMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-fade-in text-xs">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Select Output Dimension
                    </div>
                    {resolutionPresets.map((preset) => {
                      const isSelected = selectedResolution.id === preset.id;
                      const w = preset.width || nativeW;
                      const h = preset.height || nativeH;

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            onSelectResolution(preset);
                            setShowPresetsMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-emerald-50/70 transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-800 font-semibold'
                              : 'text-slate-700'
                          }`}
                        >
                          <div>
                            <div>{preset.label}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {w} × {h} px
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPresetsMenu(false);
                          setShowCustomModal(true);
                        }}
                        className="w-full text-left px-3.5 py-2 text-emerald-700 font-medium hover:bg-emerald-50/70 transition-colors flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Custom Resolution...</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Photo count pill */}
            <div className="px-3 py-2 bg-emerald-50/90 text-emerald-900 border border-emerald-200/60 rounded-xl text-xs font-semibold">
              {imageCount === 0
                ? 'No images loaded'
                : `${imageCount} photo${imageCount > 1 ? 's' : ''}`}
            </div>
          </div>
        </div>

        {/* Custom Dimension Modal */}
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-scale-up">
              <h4 className="text-base font-bold text-slate-800 mb-1">
                Set Custom Export Size
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Specify the output width & height for your downloads. Aspect ratio remains 1:1.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Dimension (pixels)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="300"
                      max="4320"
                      step="10"
                      value={customDimension}
                      onChange={(e) => setCustomDimension(Number(e.target.value))}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-mono text-slate-400">
                      × {customDimension} px
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>Min: 300px</span>
                    <span>Native: {nativeW}px</span>
                    <span>Max: 4320px</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (customDimension >= 300 && customDimension <= 4320) {
                        onSetCustomResolution(customDimension, customDimension);
                        setShowCustomModal(false);
                      }
                    }}
                    className="px-4 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs"
                  >
                    Apply Resolution
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
