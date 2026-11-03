import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onAddSample?: (sampleData: { file: File; width: number; height: number; dataUrl: string }) => void;
  isLoadingSample?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFilesSelected,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  const processFiles = (fileList: FileList | File[]) => {
    setErrorMsg(null);
    const validFiles: File[] = [];
    const invalidCount = 0;

    Array.from(fileList).forEach((file) => {
      if (acceptedTypes.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name)) {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0 && fileList.length > 0) {
      setErrorMsg('Please upload standard JPG, PNG, or WEBP image files.');
      return;
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed rounded-3xl transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50/80 shadow-lg scale-[1.005]'
            : 'border-emerald-200/90 bg-white/80 hover:bg-emerald-50/40 hover:border-emerald-400 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              processFiles(e.target.files);
              e.target.value = ''; // Reset input to allow re-upload of same file
            }
          }}
        />

        {/* Upload Icon circle */}
        <div className="w-16 h-16 mb-4 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-inner group-hover:scale-105 transition-transform">
          <UploadCloud className="w-8 h-8 stroke-[2.2]" />
        </div>

        <h3 className="text-lg md:text-xl font-bold text-slate-800 text-center mb-1">
          Upload your images to place them in the template
        </h3>
        <p className="text-sm text-slate-500 text-center max-w-md mb-4">
          Drag and drop photo files here, or click to browse. Supports JPG, PNG, and WEBP. Upload
          multiple images at once.
        </p>

        {/* Accepted formats badge */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100/90 px-3 py-1 rounded-full">
          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
          <span>JPG • PNG • WEBP • Preserves full resolution</span>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
