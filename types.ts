
export type HorizontalPos = 'left' | 'center' | 'right';
export type VerticalPos = 'top' | 'center' | 'bottom';
export type TextAlign = 'left' | 'center' | 'right';
export type GradientDirection = 
  | 'to-right' 
  | 'to-left' 
  | 'to-bottom' 
  | 'to-top' 
  | 'to-bottom-right' 
  | 'to-bottom-left' 
  | 'to-top-right' 
  | 'to-top-left'
  | 'radial-out' 
  | 'radial-in';

export interface LogoItem {
  id: string;
  src: string;
  imgElement: HTMLImageElement;
  horizontal: HorizontalPos;
  vertical: VerticalPos;
}

export interface LogoConfig {
  horizontal: HorizontalPos;
  vertical: VerticalPos;
  scale: number;
  rotate: number;
  opacity: number;
  borderColor: string;
  borderWidth: number;
  padding: number;
  logoSpacing: number;
  bgEnabled: boolean;
  bgColor: string;
  bgOpacity: number;
  bgPadding: number;
  bgBorderRadius: number;
  bgWidthScale: number;
  bgHeightScale: number;
  bgFullWidth: boolean;
  bgBorderWidth: number;
  bgBorderColor: string;
}

export interface LogoTemplate {
  id: string;
  name: string;
  config: LogoConfig;
  logoSrc: string; 
}

export interface AIConfig {
  sharpen: number;
  denoise: number;
  filter: string;
}

export interface TextWatermarkConfig {
  enabled: boolean;
  content: string;
  color: string;
  fontSize: number;
  opacity: number;
  fontFamily: 'Inter' | 'Serif' | 'Monospace' | 'Arial';
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: TextAlign;
  horizontal: HorizontalPos;
  vertical: VerticalPos;
  paddingX: number;
  paddingY: number;
  bgEnabled: boolean;
  bgColor: string;
  bgOpacity: number;
  bgShape: 'rect' | 'rounded';
  bgBorderRadius: number;
  bgBorderEnabled: boolean;
  bgBorderColor: string;
  bgBorderWidth: number;
  bgFullWidth: boolean;
  bgFullHeight: boolean;
  bgHeightScale: number;
  bgInternalPadding: number;
  bgGradientEnabled: boolean;
  bgGradientStart: string;
  bgGradientStartOpacity: number;
  bgGradientStartPos: number;
  bgGradientEnd: string;
  bgGradientEndOpacity: number;
  bgGradientEndPos: number;
  bgGradientDirection: GradientDirection;
}

export interface ProcessedImage {
  id: string;
  file: File;
  originalUrl: string;
  processedUrl: string;
  selected: boolean;
  customTitle?: string;
  customPaddingX?: number;
  customPaddingY?: number;
  customLogoPaddingX?: number;
  customLogoPaddingY?: number;
}

export type ExportFormat = 'image/jpeg' | 'image/png' | 'image/webp';
