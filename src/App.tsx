/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import {
  Layers,
  Sparkles,
  Upload,
  Download,
  AlertCircle,
  ShieldCheck,
  Check,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { FramedCard } from './components/FramedCard';
import { TemplateInfoBar } from './components/TemplateInfoBar';
import { ModalPreview } from './components/ModalPreview';
import { FrameSelectorModal } from './components/FrameSelectorModal';
import { FramedImageItem, ResolutionPreset, TemplateInfo } from './types';
import {
  renderCompositeToBlob,
  downloadBlob,
  formatFramedFilename,
} from './utils/canvas';
import { createPresetFrame } from './utils/framePresets';

const DEFAULT_TEMPLATE_PATH = '/template.png';
const FALLBACK_TEMPLATE_PATH =
  '/assets/aistudio/EventsActivities_C_title__7__15d55bbb.png';

export default function App() {
  const [templateInfo, setTemplateInfo] = useState<TemplateInfo>({
    id: 'hospital-letterhead',
    name: 'Culion Hospital Letterhead',
    url: DEFAULT_TEMPLATE_PATH,
    element: null,
    width: 2160,
    height: 2160,
    loaded: false,
    isCustom: false,
  });

  const [availableFrames, setAvailableFrames] = useState<TemplateInfo[]>([]);
  const [images, setImages] = useState<FramedImageItem[]>([]);
  const [isProcessingUploads, setIsProcessingUploads] = useState(false);
  const [modalItem, setModalItem] = useState<FramedImageItem | null>(null);
  const [isFrameModalOpen, setIsFrameModalOpen] = useState(false);

  // Resolution presets (dynamically computed once template is loaded)
  const [selectedResolution, setSelectedResolution] = useState<ResolutionPreset>({
    id: 'original',
    label: 'Original Template (Full 2160×2160)',
    isOriginal: true,
  });

  // Batch export states
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
    filename?: string;
  } | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [enhanceExportQuality, setEnhanceExportQuality] = useState(true);
  const [zipProgress, setZipProgress] = useState<{
    current: number;
    total: number;
    percent: number;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputGlobalRef = useRef<HTMLInputElement | null>(null);
  const frameInputGlobalRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Load the fixed template image and additional preset frames
  useEffect(() => {
    const loadDefaultTemplate = (srcUrl: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = srcUrl;

      img.onload = async () => {
        const w = img.naturalWidth || 2160;
        const h = img.naturalHeight || 2160;
        const initialTemplate: TemplateInfo = {
          id: 'hospital-letterhead',
          name: 'Culion Hospital Official Letterhead',
          url: srcUrl,
          element: img,
          width: w,
          height: h,
          loaded: true,
          isCustom: false,
        };

        setTemplateInfo(initialTemplate);

        setSelectedResolution({
          id: 'original',
          label: `Frame Native (${w}×${h})`,
          width: w,
          height: h,
          isOriginal: true,
        });

        // Initialize available frames and load built-in alternatives
        try {
          const [minimalFrame, certFrame, modernFrame] = await Promise.all([
            createPresetFrame('minimal'),
            createPresetFrame('certificate'),
            createPresetFrame('modern'),
          ]);
          setAvailableFrames([initialTemplate, minimalFrame, certFrame, modernFrame]);
        } catch {
          setAvailableFrames([initialTemplate]);
        }
      };

      img.onerror = () => {
        if (srcUrl !== FALLBACK_TEMPLATE_PATH) {
          loadDefaultTemplate(FALLBACK_TEMPLATE_PATH);
        } else {
          setTemplateInfo((prev) => ({
            ...prev,
            error: 'Failed to load overlay template image.',
          }));
        }
      };
    };

    loadDefaultTemplate(DEFAULT_TEMPLATE_PATH);
  }, []);

  // Frame selection handler
  const handleSelectFrame = (frame: TemplateInfo) => {
    setTemplateInfo(frame);
    setSelectedResolution({
      id: 'original',
      label: `Frame Native (${frame.width}×${frame.height})`,
      width: frame.width,
      height: frame.height,
      isOriginal: true,
    });
    showToast(`Active frame: ${frame.name}`);
  };

  // Custom Frame Upload ("Select Frame") - supports single or multiple files
  const handleUploadCustomFrames = async (files: File[]) => {
    const newFrames: TemplateInfo[] = [];

    for (const file of files) {
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = dataUrl;
        });

        const cleanName =
          file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ') || 'Custom Frame';

        const newFrame: TemplateInfo = {
          id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: cleanName,
          url: dataUrl,
          element: img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          loaded: true,
          isCustom: true,
        };

        newFrames.push(newFrame);
      } catch (err) {
        console.error('Failed to parse frame file:', file.name, err);
      }
    }

    if (newFrames.length > 0) {
      setAvailableFrames((prev) => [...newFrames, ...prev]);
      handleSelectFrame(newFrames[0]);
      showToast(`Added ${newFrames.length} frame${newFrames.length > 1 ? 's' : ''}`);
    }
  };

  // Delete Frame handler
  const handleDeleteFrame = (frameId: string) => {
    if (availableFrames.length <= 1) {
      alert('You must keep at least one frame.');
      return;
    }

    const targetFrame = availableFrames.find((f) => f.id === frameId);
    const remaining = availableFrames.filter((f) => f.id !== frameId);
    setAvailableFrames(remaining);

    // If deleting currently active frame, switch to another frame
    if (templateInfo.id === frameId) {
      const fallback = remaining[0];
      handleSelectFrame(fallback);
    }

    showToast(`Deleted frame: "${targetFrame?.name || 'Frame'}"`);
  };

  const resolutionPresets: ResolutionPreset[] = [
    {
      id: 'original',
      label: `Frame Native (${templateInfo.width}×${templateInfo.height})`,
      width: templateInfo.width,
      height: templateInfo.height,
      isOriginal: true,
    },
    {
      id: 'hd',
      label: 'High Definition (1440×1440)',
      width: 1440,
      height: 1440,
    },
    {
      id: 'social',
      label: 'Social Media Square (1080×1080)',
      width: 1080,
      height: 1080,
    },
    {
      id: 'compact',
      label: 'Fast Web / Compact (720×720)',
      width: 720,
      height: 720,
    },
  ];

  // Process uploaded images
  const handleAddFiles = useCallback(async (files: File[]) => {
    setIsProcessingUploads(true);

    const newItems: FramedImageItem[] = [];

    for (const file of files) {
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = dataUrl;
        });

        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          originalName: file.name,
          dataUrl,
          imgElement: img,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          sizeBytes: file.size,
          zoom: 1.0,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          brightness: 100,
        });
      } catch (err) {
        console.error('Failed to parse image file:', file.name, err);
      }
    }

    setImages((prev) => [...prev, ...newItems]);
    setIsProcessingUploads(false);
    showToast(`Added ${newItems.length} photo${newItems.length > 1 ? 's' : ''}`);
  }, []);

  // Handle sample photo
  const handleAddSample = (sampleData: {
    file: File;
    width: number;
    height: number;
    dataUrl: string;
  }) => {
    const img = new Image();
    img.src = sampleData.dataUrl;
    img.onload = () => {
      const item: FramedImageItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: sampleData.file.name,
        originalName: sampleData.file.name,
        dataUrl: sampleData.dataUrl,
        imgElement: img,
        originalWidth: sampleData.width,
        originalHeight: sampleData.height,
        sizeBytes: sampleData.file.size,
        zoom: 1.0,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        brightness: 100,
      };
      setImages((prev) => [...prev, item]);
      showToast(`Sample photo added!`);
    };
  };

  // Update individual photo adjustments
  const handleUpdateItem = (id: string, updates: Partial<FramedImageItem>) => {
    setImages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Remove individual photo
  const handleRemoveItem = (id: string) => {
    setImages((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear all photos
  const handleClearAll = () => {
    if (images.length === 0) return;
    if (window.confirm(`Clear all ${images.length} uploaded images?`)) {
      setImages([]);
      showToast('All photos removed');
    }
  };

  // Apply positioning to all other images
  const handleApplyToAll = (sourceId: string) => {
    const source = images.find((i) => i.id === sourceId);
    if (!source) return;

    setImages((prev) =>
      prev.map((item) => ({
        ...item,
        zoom: source.zoom,
        offsetX: source.offsetX,
        offsetY: source.offsetY,
        rotation: source.rotation,
        brightness: source.brightness ?? 100,
      }))
    );
    showToast('Applied framing settings to all photos');
  };

  // Set custom export resolution
  const handleSetCustomResolution = (w: number, h: number) => {
    const customPreset: ResolutionPreset = {
      id: `custom-${w}x${h}`,
      label: `Custom (${w}×${h})`,
      width: w,
      height: h,
    };
    setSelectedResolution(customPreset);
    showToast(`Global export size set to ${w} × ${h} px`);
  };

  // Batch Download all as direct individual PNG files (NO ZIP FOLDER)
  const handleDownloadAllIndividual = async () => {
    if (!templateInfo.element || images.length === 0) return;
    setIsDownloadingAll(true);
    setDownloadProgress({ current: 0, total: images.length });

    try {
      const usedFilenames = new Map<string, number>();

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        let filename = formatFramedFilename(item.originalName, 'png');
        if (usedFilenames.has(filename)) {
          const count = usedFilenames.get(filename)! + 1;
          usedFilenames.set(filename, count);
          const dot = filename.lastIndexOf('.');
          filename = `${filename.slice(0, dot)}_${count}.png`;
        } else {
          usedFilenames.set(filename, 1);
        }

        setDownloadProgress({
          current: i + 1,
          total: images.length,
          filename,
        });

        const targetW =
          item.overrideResolution?.width ||
          selectedResolution.width ||
          templateInfo.width;
        const targetH =
          item.overrideResolution?.height ||
          selectedResolution.height ||
          templateInfo.height;

        const blob = await renderCompositeToBlob(
          item,
          templateInfo.element,
          targetW,
          targetH,
          templateInfo.width,
          templateInfo.height,
          'image/png',
          1.0,
          enhanceExportQuality
        );

        downloadBlob(blob, filename);

        // Stagger browser downloads by 350ms so browser doesn't block multi-downloads
        if (i < images.length - 1) {
          await new Promise((r) => setTimeout(r, 350));
        }
      }

      showToast(`Downloaded all ${images.length} framed PNGs directly to your computer!`);
    } catch (err) {
      console.error('Failed to download individual images:', err);
      alert('Error during export. Please try again.');
    } finally {
      setIsDownloadingAll(false);
      setDownloadProgress(null);
    }
  };

  // Batch Download as ZIP
  const handleDownloadAllZip = async () => {
    if (!templateInfo.element || images.length === 0) return;
    setIsZipping(true);
    setZipProgress({ current: 0, total: images.length, percent: 0 });

    try {
      const zip = new JSZip();
      const usedFilenames = new Map<string, number>();

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        setZipProgress({
          current: i + 1,
          total: images.length,
          percent: ((i + 1) / images.length) * 80,
        });

        const targetW =
          item.overrideResolution?.width ||
          selectedResolution.width ||
          templateInfo.width;
        const targetH =
          item.overrideResolution?.height ||
          selectedResolution.height ||
          templateInfo.height;

        const blob = await renderCompositeToBlob(
          item,
          templateInfo.element,
          targetW,
          targetH,
          templateInfo.width,
          templateInfo.height,
          'image/png',
          1.0,
          enhanceExportQuality
        );

        let filename = formatFramedFilename(item.originalName, 'png');
        if (usedFilenames.has(filename)) {
          const count = usedFilenames.get(filename)! + 1;
          usedFilenames.set(filename, count);
          const dot = filename.lastIndexOf('.');
          filename = `${filename.slice(0, dot)}_${count}.png`;
        } else {
          usedFilenames.set(filename, 1);
        }

        zip.file(filename, blob);
      }

      setZipProgress({
        current: images.length,
        total: images.length,
        percent: 90,
      });

      const zipBlob = await zip.generateAsync(
        { type: 'blob' },
        (metadata) => {
          setZipProgress({
            current: images.length,
            total: images.length,
            percent: 90 + (metadata.percent / 100) * 10,
          });
        }
      );

      downloadBlob(zipBlob, 'framed_photos_enhanced.zip');
      showToast(
        `Downloaded ${images.length} ${enhanceExportQuality ? 'enhanced ' : ''}framed photos in ZIP!`
      );
    } catch (err) {
      console.error('Failed to create ZIP:', err);
      alert('Error creating ZIP archive. Please try again.');
    } finally {
      setIsZipping(false);
      setZipProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Hidden Global Input for "Select Photos" header button */}
      <input
        ref={fileInputGlobalRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleAddFiles(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
      />

      {/* Hidden Global Input for "Select Frame" button in Header */}
      <input
        ref={frameInputGlobalRef}
        type="file"
        multiple
        accept="image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleUploadCustomFrames(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
      />

      {/* Main Header */}
      <Header
        imageCount={images.length}
        onDownloadAllIndividual={handleDownloadAllIndividual}
        onDownloadAllZip={handleDownloadAllZip}
        onClearAll={handleClearAll}
        onTriggerUpload={() => fileInputGlobalRef.current?.click()}
        onSelectFrameClick={() => setIsFrameModalOpen(true)}
        enhanceExportQuality={enhanceExportQuality}
        onToggleEnhance={() => setEnhanceExportQuality((prev) => !prev)}
        isDownloadingAll={isDownloadingAll}
        downloadProgress={downloadProgress}
        isZipping={isZipping}
        zipProgress={zipProgress}
      />

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl border border-white/10">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Template info bar banner with frame selector, delete, and Select Frame button */}
        <TemplateInfoBar
          templateInfo={templateInfo}
          availableFrames={availableFrames}
          selectedResolution={selectedResolution}
          resolutionPresets={resolutionPresets}
          onSelectFrame={handleSelectFrame}
          onUploadCustomFrames={handleUploadCustomFrames}
          onDeleteFrame={handleDeleteFrame}
          onSelectResolution={setSelectedResolution}
          onSetCustomResolution={handleSetCustomResolution}
          imageCount={images.length}
          onOpenFrameModal={() => setIsFrameModalOpen(true)}
        />

        {/* Global Loading state for heavy uploads */}
        {isProcessingUploads && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center gap-3 text-emerald-900 text-sm font-medium animate-pulse">
            <div className="w-5 h-5 border-2 border-emerald-300 border-t-emerald-700 rounded-full animate-spin" />
            <span>Processing and decoding uploaded images in full quality...</span>
          </div>
        )}

        {/* Upload Dropzone */}
        {images.length === 0 ? (
          <div className="max-w-3xl mx-auto py-4 relative z-10">
            <Dropzone
              onFilesSelected={handleAddFiles}
              onAddSample={handleAddSample}
            />

            {/* How it works info pill cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-8 text-left">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold text-sm mb-2">
                  1
                </div>
                <h4 className="text-xs font-bold text-slate-800">Layer 1: Back</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your photo fills the frame using center-cover scaling. Reposition, zoom, and adjust brightness.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold text-sm mb-2">
                  2
                </div>
                <h4 className="text-xs font-bold text-slate-800">Layer 2: Front</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your selected overlay frame sits on top untouched. Use the "Select Frame" button to pick or upload any frame.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold text-sm mb-2">
                  3
                </div>
                <h4 className="text-xs font-bold text-slate-800">Adjust & Export</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Fine-tune each photo, choose output resolutions, and download individual PNGs or all in one ZIP package.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick add more banner while viewing grid */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-emerald-950">
                  {images.length} photo{images.length > 1 ? 's' : ''} composited with "{templateInfo.name}".
                  Drag on any card to reposition or adjust brightness.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadAllIndividual}
                  disabled={isDownloadingAll}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
                  title="Download all images directly as individual PNGs (no ZIP folder)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {isDownloadingAll
                      ? `Downloading ${downloadProgress?.current || 0}/${images.length}...`
                      : 'Download All (PNGs)'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFrameModalOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Select Frame</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputGlobalRef.current?.click()}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photos</span>
                </button>
              </div>
            </div>

            {/* Grid of Framed Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((item) => (
                <FramedCard
                  key={item.id}
                  item={item}
                  templateInfo={templateInfo}
                  globalResolution={selectedResolution}
                  onUpdateItem={handleUpdateItem}
                  onRemoveItem={handleRemoveItem}
                  onApplyToAll={handleApplyToAll}
                  onOpenModal={setModalItem}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Frame Selection & Management Modal (Always above everything with z-[100]) */}
      <FrameSelectorModal
        isOpen={isFrameModalOpen}
        onClose={() => setIsFrameModalOpen(false)}
        availableFrames={availableFrames}
        activeFrameId={templateInfo.id}
        onSelectFrame={handleSelectFrame}
        onUploadCustomFrames={handleUploadCustomFrames}
        onDeleteFrame={handleDeleteFrame}
      />

      {/* Full Preview Modal */}
      {modalItem && (
        <ModalPreview
          item={modalItem}
          templateInfo={templateInfo}
          globalResolution={selectedResolution}
          onClose={() => setModalItem(null)}
        />
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-6 mt-12 text-slate-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Template Framer</span>
            <span>&bull;</span>
            <span>Layer 1 (Back) Photo + Layer 2 (Front) Overlay Frame</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Runs completely in your browser • Photos & frames are never uploaded to a server</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
