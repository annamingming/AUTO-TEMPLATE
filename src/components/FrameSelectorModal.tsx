import React, { useRef, useState } from 'react';
import {
  X,
  Check,
  Upload,
  Trash2,
  Layers,
  Sparkles,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { TemplateInfo } from '../types';

interface FrameSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableFrames: TemplateInfo[];
  activeFrameId: string;
  onSelectFrame: (frame: TemplateInfo) => void;
  onUploadCustomFrames: (files: File[]) => void;
  onDeleteFrame: (frameId: string) => void;
}

export const FrameSelectorModal: React.FC<FrameSelectorModalProps> = ({
  isOpen,
  onClose,
  availableFrames,
  activeFrameId,
  onSelectFrame,
  onUploadCustomFrames,
  onDeleteFrame,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [frameToDelete, setFrameToDelete] = useState<TemplateInfo | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadCustomFrames(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/') || /\.(png|webp)$/i.test(f.name)
      );
      if (validFiles.length > 0) {
        onUploadCustomFrames(validFiles);
      }
    }
  };

  const confirmDelete = () => {
    if (frameToDelete) {
      onDeleteFrame(frameToDelete.id);
      setFrameToDelete(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Hidden multi-file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Drag Over Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-30 bg-emerald-600/90 backdrop-blur-xs flex flex-col items-center justify-center text-white border-4 border-dashed border-white m-3 rounded-2xl pointer-events-none">
            <Upload className="w-12 h-12 mb-2 animate-bounce stroke-[2.3]" />
            <h3 className="text-xl font-bold">Drop Frame Images Here</h3>
            <p className="text-sm text-emerald-100">
              Files will be added directly to your Layer 2 frames
            </p>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Choose Layer 2 Overlay Frame
              </h3>
              <p className="text-xs text-slate-500">
                Select an existing template, upload new frames, or delete unwanted frames
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* The primary "Select Frame" Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl shadow-xs transition-colors shrink-0"
              title="Upload custom PNG or WEBP overlay frames"
            >
              <Upload className="w-4 h-4 stroke-[2.2]" />
              <span>Select Frame</span>
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

        {/* Quick Upload Drop Area Banner */}
        <div className="px-6 pt-4 pb-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-between p-3 bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/80 rounded-2xl cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                  Upload More Overlay Frames
                </div>
                <div className="text-[11px] text-slate-500">
                  Click or drag-and-drop PNGs here &bull; Transparent center recommended
                </div>
              </div>
            </div>

            <button
              type="button"
              className="px-3 py-1.5 text-xs font-semibold bg-white text-emerald-800 border border-emerald-200 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors"
            >
              Select Frame
            </button>
          </div>
        </div>

        {/* Frames Gallery Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {availableFrames.map((frame) => {
              const isSelected = frame.id === activeFrameId;
              const canDelete = availableFrames.length > 1;

              return (
                <div
                  key={frame.id}
                  onClick={() => onSelectFrame(frame)}
                  className={`group relative flex flex-col rounded-2xl border-2 transition-all cursor-pointer overflow-hidden text-left ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200/90 hover:border-emerald-300 hover:shadow-sm bg-white'
                  }`}
                >
                  {/* Thumbnail viewport with checkerboard pattern for transparency */}
                  <div className="relative aspect-square w-full bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px] flex items-center justify-center p-3 border-b border-slate-100">
                    <img
                      src={frame.url}
                      alt={frame.name}
                      className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-102 transition-transform duration-200"
                    />

                    {/* Active checkmark badge */}
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md z-10">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    )}

                    {/* Custom badge */}
                    {frame.isCustom && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-amber-500/90 text-white text-[10px] font-semibold tracking-wide z-10 shadow-xs">
                        Custom
                      </div>
                    )}

                    {/* DELETE BUTTON */}
                    <button
                      type="button"
                      disabled={!canDelete}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFrameToDelete(frame);
                      }}
                      className={`absolute bottom-2.5 right-2.5 p-1.5 rounded-lg transition-all z-10 shadow-sm ${
                        canDelete
                          ? 'bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-300 opacity-80 group-hover:opacity-100'
                          : 'bg-white/60 text-slate-300 border border-slate-200/40 cursor-not-allowed opacity-0'
                      }`}
                      title={
                        canDelete
                          ? `Delete "${frame.name}"`
                          : 'Cannot delete the only remaining frame'
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & Dimension */}
                  <div className="p-3 bg-white flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors"
                          title={frame.name}
                        >
                          {frame.name}
                        </h4>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {frame.width} × {frame.height} px
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-slate-400">
                        {isSelected ? 'Active Frame' : 'Click to apply'}
                      </span>
                      <span
                        className={`text-[11px] font-semibold ${
                          isSelected ? 'text-emerald-700' : 'text-slate-600'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Use this'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Upload New Frame Card in Grid */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-300/80 hover:border-emerald-500 rounded-2xl bg-emerald-50/20 hover:bg-emerald-50/60 transition-all cursor-pointer text-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                <Upload className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 mb-1">Upload New Frame</h4>
              <p className="text-[11px] text-slate-500 max-w-[180px] mb-3">
                Upload PNG or WEBP with transparent cutouts
              </p>
              <span className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-xl shadow-xs group-hover:bg-emerald-700 transition-colors">
                Select Frame
              </span>
            </div>
          </div>
        </div>

        {/* Footer info note */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {availableFrames.length} frame{availableFrames.length > 1 ? 's' : ''} available.
              Layer 2 sits strictly in front of photos.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Deleting Frame */}
      {frameToDelete && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setFrameToDelete(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Delete Frame?</h4>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              Are you sure you want to remove{' '}
              <strong className="text-slate-900 font-semibold truncate block mt-0.5">
                "{frameToDelete.name}"
              </strong>
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setFrameToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-xs"
              >
                Delete Frame
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
