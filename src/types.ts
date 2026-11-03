export interface FramedImageItem {
  id: string;
  name: string;
  originalName: string;
  dataUrl: string;
  imgElement: HTMLImageElement;
  originalWidth: number;
  originalHeight: number;
  sizeBytes: number;
  // Positioning and visual adjustments
  zoom: number; // 1.0 to 4.0
  offsetX: number; // normalized relative to template coordinate space
  offsetY: number;
  rotation: number; // 0, 90, 180, 270
  brightness: number; // percentage, e.g. 50 to 180, default 100
  // Custom export resolution if overridden (null means use global setting)
  overrideResolution?: {
    width: number;
    height: number;
    label: string;
  } | null;
}

export interface ResolutionPreset {
  id: string;
  label: string;
  width?: number; // if undefined, use native template width
  height?: number; // if undefined, use native template height
  isOriginal?: boolean;
}

export interface TemplateInfo {
  id: string;
  name: string;
  url: string;
  element: HTMLImageElement | null;
  width: number;
  height: number;
  loaded: boolean;
  error?: string;
  isCustom?: boolean;
}
