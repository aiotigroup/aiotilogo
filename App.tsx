
import React, { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react';
import { 
  Upload, 
  Settings, 
  Image as ImageIcon, 
  Download, 
  Layers, 
  Move, 
  RotateCw, 
  Type, 
  RefreshCw,
  CheckSquare,
  Square,
  X,
  Italic,
  Bold,
  Layout,
  Maximize,
  Grid,
  StretchHorizontal,
  Palette,
  Save,
  Trash2,
  Bookmark,
  Zap,
  Sparkles,
  Droplets,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpLeft,
  ArrowDownLeft,
  Edit3,
  Circle,
  Minimize2,
  Activity,
  Maximize2,
  Search,
  ChevronRight,
  ChevronLeft,
  Monitor,
  MonitorDot,
  Underline,
  RotateCcw,
  ArrowDownUp,
  Loader2,
  PlusCircle,
  ShieldCheck,
  MousePointer2,
  ClipboardPaste,
  ImagePlus,
  FileSearch,
  GripVertical,
  ArrowLeftCircle,
  MoveDiagonal,
  AlignCenter,
  AlignLeft,
  AlignRight
} from 'lucide-react';
import { LogoConfig, TextWatermarkConfig, ProcessedImage, ExportFormat, LogoTemplate, AIConfig, GradientDirection, VerticalPos, HorizontalPos, LogoItem } from './types';
import { processWatermark, hexToRgba } from './services/canvasService';

const QUICK_COLORS = [
  '#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FFFFFF', '#E0E0E0', '#C0C0C0', '#A0A0A0', '#808080', '#606060', '#404040', '#202020', '#000000',
  '#FF8080', '#FFFF80', '#80FF80', '#80FFFF', '#8080FF', '#FF80FF', '#C6A48E', '#D9BDAC', '#E5D1C3', '#EFE1D6', '#B79178', '#A07E66', '#866955', '#6D5645', '#524134',
  '#FF4040', '#FFFF40', '#40FF40', '#40FFFF', '#4040FF', '#FF40FF', '#C27346', '#8F5E3F', '#5C4332', '#3D2F22', '#1F1711', '#B79268', '#997A57', '#7B6246', '#5D4935',
  '#CC0000', '#CCCC00', '#00CC00', '#00CCCC', '#0000CC', '#CC00CC', '#008000', '#006400', '#004B00', '#003200', '#001900', '#000080', '#000064', '#00004B', '#000032'
];

const STORAGE_KEY = 'watermark_logo_templates';
const TITLES_STORAGE_KEY = 'watermark_saved_titles';

const DEFAULT_LOGO_CONFIG: LogoConfig = {
  horizontal: 'center',
  vertical: 'bottom',
  scale: 100,
  rotate: 0,
  opacity: 100,
  borderColor: '#ffffff',
  borderWidth: 0,
  padding: 5, 
  logoSpacing: 10,
  bgEnabled: false,
  bgColor: '#000000',
  bgOpacity: 50,
  bgPadding: 10,
  bgBorderRadius: 0,
  bgWidthScale: 0,
  bgHeightScale: 0,
  bgFullWidth: false,
  bgBorderWidth: 0,
  bgBorderColor: '#ffffff'
};

const DEFAULT_AI_CONFIG: AIConfig = {
  sharpen: 0,
  denoise: 0,
  filter: 'none'
};

const DEFAULT_TEXT_CONFIG: TextWatermarkConfig = {
  enabled: true,
  content: 'NHẬP TIÊU ĐỀ',
  color: '#FFFFFF',
  fontSize: 150, 
  opacity: 100,
  fontFamily: 'Inter',
  fontWeight: 'bold',
  fontStyle: 'normal',
  textDecoration: 'none',
  textAlign: 'center',
  horizontal: 'center',
  vertical: 'top',
  paddingX: 5,
  paddingY: 0,
  bgEnabled: true,
  bgColor: '#000000',
  bgOpacity: 100,
  bgShape: 'rect',
  bgBorderRadius: 0, 
  bgBorderEnabled: true,
  bgBorderColor: '#FFFFFF',
  bgBorderWidth: 2,
  bgFullWidth: true,
  bgFullHeight: false,
  bgHeightScale: 0,
  bgInternalPadding: 5, 
  bgGradientEnabled: true,
  bgGradientStart: '#730505', 
  bgGradientStartOpacity: 100,
  bgGradientStartPos: 50, 
  bgGradientEnd: '#202020', 
  bgGradientEndOpacity: 50, 
  bgGradientEndPos: 100,
  bgGradientDirection: 'radial-in' 
};

const GRADIENT_DIRECTIONS: { dir: GradientDirection; icon: React.ReactNode }[] = [
  { dir: 'to-top-left', icon: <ArrowUpLeft size={12} /> },
  { dir: 'to-top', icon: <ArrowUp size={12} /> },
  { dir: 'to-top-right', icon: <ArrowUpRight size={12} /> },
  { dir: 'to-left', icon: <ArrowLeft size={12} /> },
  { dir: 'to-right', icon: <ArrowRight size={12} /> },
  { dir: 'to-bottom-left', icon: <ArrowDownLeft size={12} /> },
  { dir: 'to-bottom', icon: <ArrowDown size={12} /> },
  { dir: 'to-bottom-right', icon: <ArrowDownRight size={12} /> },
  { dir: 'radial-out', icon: <Circle size={12} className="scale-125" /> },
  { dir: 'radial-in', icon: <Minimize2 size={12} /> },
];

type PreviewSize = 'medium' | 'large' | 'extra-large';

/**
 * Thành phần nhập liệu Rich Text hỗ trợ Bold/Italic/Underline từng phần.
 */
const RichInput = memo(({ value, onChange, placeholder, className, style }: any) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalUpdate.current = false;
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      let html = editorRef.current.innerHTML;
      
      // Chuẩn hóa HTML: xóa các thuộc tính không cần thiết nhưng giữ lại b, i, u, br
      let cleanHtml = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') 
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/style="[^"]*"/gi, '')
        .replace(/class="[^"]*"/gi, '')
        .replace(/<div[^>]*>/gi, '<br>')
        .replace(/<\/div>/gi, '');
      
      // Đồng nhất các thẻ định dạng
      cleanHtml = cleanHtml
        .replace(/<strong>/gi, '<b>').replace(/<\/strong>/gi, '</b>')
        .replace(/<em>/gi, '<i>').replace(/<\/em>/gi, '</i>');

      onChange(cleanHtml);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.execCommand('insertLineBreak');
    }
  };

  return (
    <div
      ref={editorRef}
      contentEditable
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onBlur={handleInput}
      className={`${className} cursor-text outline-none whitespace-pre-wrap min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-700`}
      data-placeholder={placeholder}
      style={style}
      spellCheck={false}
    />
  );
});

const ZoomTitleInput = memo(({ 
  activeImg, 
  placeholder, 
  onUpdateTitle, 
  onResetTitle,
  onResetPosition,
  onResetLogoPosition
}: { 
  activeImg: ProcessedImage; 
  placeholder: string;
  onUpdateTitle: (id: string, title: string) => void;
  onResetTitle: (id: string) => void;
  onResetPosition: (id: string) => void;
  onResetLogoPosition: (id: string) => void;
}) => {
  const [val, setVal] = useState(activeImg.customTitle ?? '');
  
  useEffect(() => {
    setVal(activeImg.customTitle ?? '');
  }, [activeImg.id, activeImg.customTitle]);

  const handleChange = (newValue: string) => {
    setVal(newValue);
    onUpdateTitle(activeImg.id, newValue);
  };

  const handleClear = () => {
    setVal('');
    onResetTitle(activeImg.id);
  };

  const hasCustomPos = activeImg.customPaddingX !== undefined || activeImg.customPaddingY !== undefined;
  const hasCustomLogoPos = activeImg.customLogoPaddingX !== undefined || activeImg.customLogoPaddingY !== undefined;

  return (
    <div className="flex items-center bg-zinc-950 border-2 border-yellow-400/80 rounded-lg px-3 py-1 min-h-[40px] min-w-[280px] transition-all focus-within:ring-4 focus-within:ring-yellow-400/20 shadow-lg">
      <div className="flex items-center gap-1.5 mr-2 shrink-0 select-none">
        <Type size={12} className="text-yellow-400 font-black" />
        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">Tiêu đề riêng</span>
      </div>
      <div className="w-px h-5 bg-zinc-800 mr-3 shrink-0" />
      <RichInput 
        value={val}
        onChange={handleChange}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none text-[11px] font-black text-white tracking-tight py-1.5 leading-tight"
      />
      <div className="flex items-center gap-1 ml-1.5 border-l border-zinc-800 pl-2 shrink-0">
        {hasCustomLogoPos && (
          <button onClick={() => onResetLogoPosition(activeImg.id)} className="text-amber-400 hover:text-white transition-colors p-1" title="Đặt lại vị trí Logo">
            <ImageIcon size={12} />
          </button>
        )}
        {hasCustomPos && (
          <button onClick={() => onResetPosition(activeImg.id)} className="text-cyan-400 hover:text-white transition-colors p-1" title="Đặt lại vị trí tiêu đề">
            <Move size={12} />
          </button>
        )}
        {(val || activeImg.customTitle !== undefined) && (
          <button onClick={handleClear} className="text-zinc-600 hover:text-white transition-colors p-1" title="Xóa tiêu đề riêng">
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
});

const ImageCard = memo(({ 
  img, 
  previewSize, 
  textConfig, 
  onSelect, 
  onDelete, 
  onPreview, 
  onDownload, 
  onUpdateImageTitle, 
  onResetAll 
}: { 
  img: ProcessedImage; 
  previewSize: PreviewSize; 
  textConfig: TextWatermarkConfig; 
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (img: ProcessedImage) => void;
  onDownload: (img: ProcessedImage) => void;
  onUpdateImageTitle: (id: string, title: string) => void;
  onResetAll: (id: string) => void;
}) => {
  const [localTitle, setLocalTitle] = useState(img.customTitle ?? '');
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalTitle(img.customTitle ?? '');
  }, [img.customTitle]);

  const handleTitleChange = (newVal: string) => {
    setLocalTitle(newVal);
    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => {
      onUpdateImageTitle(img.id, newVal);
    }, 400);
  };

  return (
    <div className={`bg-zinc-900 rounded-3xl shadow-2xl border-2 overflow-hidden flex flex-col group transition-all relative ${img.selected ? 'border-cyan-500 ring-4 ring-cyan-500/20 scale-[0.98]' : 'border-zinc-800 hover:border-zinc-700'}`}>
      <div className="relative aspect-square bg-zinc-950 overflow-hidden cursor-pointer" onClick={() => onPreview(img)}>
        {img.processedUrl ? (
          <div className="relative w-full h-full group/image">
            <img src={img.processedUrl} className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover/image:scale-105" alt="" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
               <div className="bg-cyan-500/80 p-3 rounded-full text-black shadow-2xl transform scale-75 group-hover/image:scale-100 transition-transform duration-300">
                 <Search size={24} />
               </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            <span className="text-[8px] font-black text-zinc-700 uppercase">Đang xử lý...</span>
          </div>
        )}
        <div 
          className={`absolute top-4 left-4 transition-all duration-300 z-10 ${img.selected ? 'scale-110 opacity-100' : 'scale-75 opacity-0 group-hover:opacity-100'}`}
          onClick={(e) => { e.stopPropagation(); onSelect(img.id); }}
        >
          <div className={`rounded-xl shadow-2xl transition-all ${img.selected ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-zinc-800/80 backdrop-blur-md text-zinc-400 border-zinc-700'} border p-2`}>
            {img.selected ? <CheckSquare size={previewSize === 'medium' ? 14 : 18} /> : <Square size={previewSize === 'medium' ? 14 : 18} />}
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(img.id); }} 
          className="absolute top-4 right-4 p-2 bg-red-500/10 backdrop-blur-md text-red-500 hover:bg-red-500 hover:text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10 border border-red-500/20"
        >
          <X size={16} />
        </button>
      </div>
      {previewSize !== 'medium' && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex flex-col truncate flex-1">
                <span className="truncate font-black text-[9px] text-zinc-400 uppercase tracking-tighter">{img.file.name}</span>
                <span className="text-[8px] font-bold text-zinc-600 italic">{(img.file.size / 1024).toFixed(1)} KB</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onDownload(img); }} className="bg-zinc-800 text-zinc-300 p-2.5 hover:bg-cyan-500 hover:text-black rounded-xl transition-all shadow-lg"><Download size={16} /></button>
          </div>

          <div className="flex flex-col gap-1 w-full pt-2 border-t border-zinc-800/50">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[7px] font-black text-zinc-500 uppercase tracking-tighter flex items-center gap-1">
                <Edit3 size={10} className="text-zinc-600" /> TIÊU ĐỀ RIÊNG
              </span>
              {(img.customTitle !== undefined || img.customPaddingX !== undefined || img.customPaddingY !== undefined || img.customLogoPaddingX !== undefined || img.customLogoPaddingY !== undefined) && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onResetAll(img.id); }}
                  className="flex items-center gap-1 text-[7px] font-black text-cyan-400 hover:text-white transition-all uppercase tracking-tighter group/reset"
                  title="Quay lại tiêu đề & vị trí mặc định"
                >
                  <RotateCcw size={10} className="group-hover/reset:rotate-180 transition-transform duration-500" /> Reset
                </button>
              )}
            </div>
            <div className="relative flex items-center group/input">
              <RichInput 
                value={localTitle}
                onChange={handleTitleChange}
                className={`w-full bg-black/80 border ${img.customTitle !== undefined ? 'border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'border-zinc-800/80 text-zinc-500'} rounded-lg px-3 py-2 text-[10px] font-black outline-none focus:border-cyan-500 transition-all pr-8 leading-tight`}
                placeholder={textConfig.content}
                onClick={(e: any) => e.stopPropagation()}
              />
              <div className="absolute right-2.5 top-2.5 flex items-center gap-1 pointer-events-none">
                  {img.customTitle !== undefined ? (
                     <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_5px_rgba(6,182,212,0.5)]" />
                  ) : (
                     <div className="opacity-0 group-hover/input:opacity-10 transition-opacity">
                        <Sparkles size={8} className="text-zinc-500" />
                     </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default function App() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [activeLogos, setActiveLogos] = useState<LogoItem[]>([]);
  const [logoTemplates, setLogoTemplates] = useState<LogoTemplate[]>([]);
  const [savedTitles, setSavedTitles] = useState<string[]>(['', '', '']);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [previewQuality, setPreviewQuality] = useState(0.2); 
  const [isExporting, setIsExporting] = useState(false);
  const [previewSize, setPreviewSize] = useState<PreviewSize>('large');
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const sizeMenuRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingLogoFile, setIsDraggingLogoFile] = useState(false);
  const [isHoveringLogoZone, setIsHoveringLogoZone] = useState(true); 
  
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [activeZoomImageId, setActiveZoomImageId] = useState<string | null>(null);
  const [isZooming, setIsZooming] = useState(false);
  
  const [modalZoom, setModalZoom] = useState(1);
  const [modalOffset, setModalOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const zoomContainerRef = useRef<HTMLDivElement>(null);

  const [isDraggingText, setIsDraggingText] = useState(false);
  const [dragStartTextPos, setDragStartTextPos] = useState({ x: 0, y: 0 });
  const [dragStartPadding, setDragStartPadding] = useState({ x: 0, y: 0 });
  const [livePadding, setLivePadding] = useState({ x: 0, y: 0 });

  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [dragStartLogoPos, setDragStartLogoPos] = useState({ x: 0, y: 0 });
  const [dragStartLogoPadding, setDragStartLogoPadding] = useState({ x: 0, y: 0 });
  const [liveLogoPadding, setLiveLogoPadding] = useState({ x: 0, y: 0 });

  const dragCacheRef = useRef<{
    shorterDim: number;
    imageRect: DOMRect;
    width: number;
    height: number;
    h_align: string;
    v_align: string;
  } | null>(null);

  const [logoConfig, setLogoConfig] = useState<LogoConfig>(DEFAULT_LOGO_CONFIG);
  const [aiConfig, setAiConfig] = useState<AIConfig>(DEFAULT_AI_CONFIG);
  const [textConfig, setTextConfig] = useState<TextWatermarkConfig>(DEFAULT_TEXT_CONFIG);

  const [exportSettings, setExportSettings] = useState({
    format: 'image/jpeg' as ExportFormat,
    quality: 100
  });

  const selectedCount = images.filter(img => img.selected).length;
  const isAllSelected = images.length > 0 && images.every(img => img.selected);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setLogoTemplates(JSON.parse(saved));
      } catch (e) {
        console.error("Lỗi khi tải mẫu từ bộ nhớ", e);
      }
    }
    const titles = localStorage.getItem(TITLES_STORAGE_KEY);
    if (titles) {
      try {
        setSavedTitles(JSON.parse(titles));
      } catch (e) {
        console.error("Lỗi khi tải tiêu đề mẫu", e);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sizeMenuRef.current && !sizeMenuRef.current.contains(event.target as Node)) {
        setShowSizeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const filesArray = Array.from(files);
    const imageFiles = filesArray.filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;

    const newImages = imageFiles.map((file: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      originalUrl: URL.createObjectURL(file),
      processedUrl: '',
      selected: true
    }));
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const handleLogoFiles = useCallback((files: FileList | File[]) => {
    const file = Array.from(files).find(f => f.type.startsWith('image/'));
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const newItem: LogoItem = {
          id: Math.random().toString(36).substr(2, 9),
          src,
          imgElement: img,
          horizontal: logoConfig.horizontal,
          vertical: logoConfig.vertical
        };
        setActiveLogos(prev => [...prev, newItem]);
        
        const newTemplate: LogoTemplate = {
          id: Math.random().toString(36).substr(2, 9),
          name: `Logo ${new Date().toLocaleTimeString()}`,
          config: JSON.parse(JSON.stringify(logoConfig)),
          logoSrc: src
        };
        setLogoTemplates(prev => [newTemplate, ...prev]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([newTemplate, ...logoTemplates]));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, [logoConfig, logoTemplates]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      
      if (files.length > 0) {
        if (isHoveringLogoZone) {
          handleLogoFiles(files);
        } else {
          handleFiles(files);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFiles, handleLogoFiles, isHoveringLogoZone]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogoFile(true);
  };

  const handleLogoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogoFile(false);
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogoFile(false);
    if (e.dataTransfer.files) {
      handleLogoFiles(e.dataTransfer.files);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleLogoFiles(e.target.files);
    }
  };

  const saveCurrentTemplate = () => {
    if (activeLogos.length === 0) return;
    const lastLogo = activeLogos[activeLogos.length - 1];
    const newTemplate: LogoTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Mẫu mới ${new Date().toLocaleTimeString()}`,
      config: JSON.parse(JSON.stringify(logoConfig)),
      logoSrc: lastLogo.src
    };
    const updated = [newTemplate, ...logoTemplates];
    setLogoTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const saveTitleToSlot = (index: number) => {
    const newTitles = [...savedTitles];
    newTitles[index] = textConfig.content;
    setSavedTitles(newTitles);
    localStorage.setItem(TITLES_STORAGE_KEY, JSON.stringify(newTitles));
  };

  const clearAllImages = () => {
    setImages([]);
  };

  const deleteTemplate = (id: string) => {
    const updated = logoTemplates.filter(t => t.id !== id);
    setLogoTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const renameTemplate = (id: string) => {
    const updated = logoTemplates.map(t => t.id === id ? { ...t, name: editName } : t);
    setLogoTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setEditingTemplateId(null);
  };

  const toggleTemplate = (template: LogoTemplate) => {
    const index = activeLogos.findIndex(l => l.src === template.logoSrc);
    if (index > -1) {
      setActiveLogos(prev => prev.filter((_, i) => i !== index));
    } else {
      const img = new Image();
      img.onload = () => {
        setActiveLogos(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          src: template.logoSrc,
          imgElement: img,
          horizontal: logoConfig.horizontal,
          vertical: logoConfig.vertical
        }]);
      };
      img.src = template.logoSrc;
    }
  };

  const updateLogoPosition = (index: number, v: VerticalPos, h: HorizontalPos) => {
    const newList = [...activeLogos];
    newList[index] = { ...newList[index], vertical: v, horizontal: h };
    setActiveLogos(newList);
  };

  const moveLogo = (index: number, direction: 'up' | 'down') => {
    const newList = [...activeLogos];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newList.length) return;
    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
    setActiveLogos(newList);
  };

  const updateImageTitle = useCallback((id: string, title: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, customTitle: title } : img));
  }, []);

  const resetImageTitleOnly = useCallback((id: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, customTitle: undefined } : img));
  }, []);

  const resetImagePositionOnly = useCallback((id: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, customPaddingX: undefined, customPaddingY: undefined } : img));
  }, []);

  const resetImageLogoPositionOnly = useCallback((id: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, customLogoPaddingX: undefined, customLogoPaddingY: undefined } : img));
  }, []);

  const resetImageAllCustoms = useCallback((id: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, customTitle: undefined, customPaddingX: undefined, customPaddingY: undefined, customLogoPaddingX: undefined, customLogoPaddingY: undefined } : img));
  }, []);

  const updateProcessedImages = useCallback(async (currentImages: ProcessedImage[]) => {
    if (currentImages.length === 0) return;
    const updated = await Promise.all(currentImages.map(async (img) => {
      const contentToUse = img.customTitle !== undefined ? img.customTitle : textConfig.content;
      const currentTextConfig = { 
        ...textConfig, 
        content: contentToUse,
        paddingX: img.customPaddingX ?? textConfig.paddingX,
        paddingY: img.customPaddingY ?? textConfig.paddingY
      };
      const logoPadX = img.customLogoPaddingX ?? logoConfig.padding;
      const logoPadY = img.customLogoPaddingY ?? logoConfig.padding;
      const processedUrl = await processWatermark(
        img.originalUrl, 
        activeLogos, 
        logoConfig, 
        currentTextConfig, 
        exportSettings, 
        previewQuality, 
        aiConfig,
        { x: logoPadX, y: logoPadY }
      );
      return { ...img, processedUrl };
    }));
    
    setImages(prev => {
        const hasChanged = updated.some((img, i) => img.processedUrl !== prev[i]?.processedUrl);
        if (!hasChanged) return prev;
        return updated;
    });
  }, [activeLogos, logoConfig, textConfig, exportSettings, previewQuality, aiConfig]);

  const customTitlesHash = images.map(img => img.customTitle ?? '___UNDEF___').join('|');
  const customPaddingHash = images.map(img => `${img.customPaddingX ?? 'G'}-${img.customPaddingY ?? 'G'}`).join('|');
  const customLogoPaddingHash = images.map(img => `${img.customLogoPaddingX ?? 'G'}-${img.customLogoPaddingY ?? 'G'}`).join('|');
  const imageIdsHash = images.map(img => img.id).join('|');

  useEffect(() => {
    if (isDraggingText || isDraggingLogo) return;
    
    const timer = setTimeout(() => {
      updateProcessedImages(images);
    }, 400); 
    return () => clearTimeout(timer);
  }, [activeLogos, logoConfig, textConfig, exportSettings, previewQuality, aiConfig, customTitlesHash, customPaddingHash, customLogoPaddingHash, imageIdsHash, updateProcessedImages, isDraggingText, isDraggingLogo]);

  useEffect(() => {
    if (!activeZoomImageId || isDraggingText || isDraggingLogo) return;
    
    const activeImg = images.find(img => img.id === activeZoomImageId);
    if (!activeImg) return;

    const timer = setTimeout(async () => {
      const contentToUse = activeImg.customTitle !== undefined ? activeImg.customTitle : textConfig.content;
      const currentTextConfig = { 
        ...textConfig, 
        content: contentToUse,
        paddingX: activeImg.customPaddingX ?? textConfig.paddingX,
        paddingY: activeImg.customPaddingY ?? textConfig.paddingY
      };
      const logoPadX = activeImg.customLogoPaddingX ?? logoConfig.padding;
      const logoPadY = activeImg.customLogoPaddingY ?? logoConfig.padding;
      const fullResUrl = await processWatermark(
        activeImg.originalUrl, 
        activeLogos, 
        logoConfig, 
        currentTextConfig, 
        exportSettings, 
        1.0, 
        aiConfig,
        { x: logoPadX, y: logoPadY }
      );
      setZoomImageUrl(fullResUrl);
    }, 300);

    return () => clearTimeout(timer);
  }, [activeZoomImageId, activeLogos, logoConfig, textConfig, aiConfig, customTitlesHash, customPaddingHash, customLogoPaddingHash, isDraggingText, isDraggingLogo]);

  const toggleSelectAll = () => {
    const allSelected = images.every(img => img.selected);
    setImages(prev => prev.map(img => ({ ...img, selected: !allSelected })));
  };

  const toggleSelectImage = useCallback((id: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, selected: !img.selected } : img));
  }, []);

  const openFullPreview = async (img: ProcessedImage) => {
    setIsZooming(true);
    setActiveZoomImageId(img.id);
    setModalZoom(1);
    setModalOffset({ x: 0, y: 0 });
    
    try {
      const contentToUse = img.customTitle !== undefined ? img.customTitle : textConfig.content;
      const currentTextConfig = { 
        ...textConfig, 
        content: contentToUse,
        paddingX: img.customPaddingX ?? textConfig.paddingX,
        paddingY: img.customPaddingY ?? textConfig.paddingY
      };
      const logoPadX = img.customLogoPaddingX ?? logoConfig.padding;
      const logoPadY = img.customLogoPaddingY ?? logoConfig.padding;
      const fullResUrl = await processWatermark(
        img.originalUrl, 
        activeLogos, 
        logoConfig, 
        currentTextConfig, 
        exportSettings, 
        1.0, 
        aiConfig,
        { x: logoPadX, y: logoPadY }
      );
      setZoomImageUrl(fullResUrl);
    } catch (error) {
      console.error("Lỗi khi tạo bản xem thử:", error);
    } finally {
      setIsZooming(false);
    }
  };

  const navigateZoom = (direction: 'next' | 'prev') => {
    if (!activeZoomImageId || images.length <= 1) return;
    const currentIndex = images.findIndex(img => img.id === activeZoomImageId);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= images.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = images.length - 1;
    openFullPreview(images[nextIndex]);
  };

  const handleModalWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (!zoomContainerRef.current) return;
    const zoomStep = 1.01; 
    const delta = -e.deltaY;
    const factor = delta > 0 ? zoomStep : (1 / zoomStep);
    setModalZoom(prev => {
      const nextZoom = Math.max(1, Math.min(prev * factor, 8));
      if (nextZoom === 1) {
        setModalOffset({ x: 0, y: 0 });
        return 1;
      }
      return nextZoom;
    });
  };

  const getTextBounds = (forceQuery = false) => {
    if (!zoomContainerRef.current || !activeZoomImageId) return null;
    const activeImg = images.find(img => img.id === activeZoomImageId);
    if (!activeImg) return null;

    const imgElement = zoomContainerRef.current.querySelector('img');
    if (!imgElement) return null;

    const rect = imgElement.getBoundingClientRect();
    const shorterDim = Math.min(rect.width, rect.height);
    
    const curPaddingX = activeImg.customPaddingX ?? textConfig.paddingX;
    const curPaddingY = activeImg.customPaddingY ?? textConfig.paddingY;

    const px = (shorterDim * curPaddingX) / 1000;
    const py = (shorterDim * curPaddingY) / 1000;
    
    const internalPad = (textConfig.bgInternalPadding || 5) * (rect.width / imgElement.naturalWidth);
    const displayContent = activeImg.customTitle !== undefined ? activeImg.customTitle : textConfig.content;
    const estimatedTextWidth = (displayContent.length * textConfig.fontSize * 0.4) * (rect.width / imgElement.naturalWidth);
    const estimatedTextHeight = (textConfig.fontSize * 1.0) * (rect.width / imgElement.naturalWidth);
    
    const baseBW = estimatedTextWidth + internalPad * 2;
    const baseBH = estimatedTextHeight + internalPad * 2;
    
    const isFullWidth = textConfig.bgEnabled && textConfig.bgFullWidth;
    let bw = isFullWidth ? rect.width : baseBW;
    let bh = textConfig.bgEnabled ? baseBH + (rect.height - baseBH) * (textConfig.bgHeightScale / 100) : baseBH;

    let bx = 0, by = 0;
    if (isFullWidth) {
      bx = rect.left;
    } else {
      if (textConfig.horizontal === 'left') bx = rect.left + px;
      else if (textConfig.horizontal === 'center') bx = rect.left + rect.width / 2 - bw / 2 + px;
      else bx = rect.left + rect.width - bw - px;
    }

    if (textConfig.vertical === 'top') by = rect.top + py;
    else if (textConfig.vertical === 'center') by = rect.top + rect.height / 2 - bh / 2 + py;
    else by = rect.top + rect.height - bh - py;

    return { 
      left: bx, 
      top: by, 
      width: bw, 
      height: bh, 
      imageRect: rect, 
      shorterDim, 
      h_align: textConfig.horizontal, 
      v_align: textConfig.vertical 
    };
  };

  const getLogoBounds = (forceQuery = false) => {
    if (!zoomContainerRef.current || !activeZoomImageId || activeLogos.length === 0) return null;
    const activeImg = images.find(img => img.id === activeZoomImageId);
    if (!activeImg) return null;

    const imgElement = zoomContainerRef.current.querySelector('img');
    if (!imgElement) return null;

    const rect = imgElement.getBoundingClientRect();
    const shorterDim = Math.min(rect.width, rect.height);
    
    const lpX = (shorterDim * (activeImg.customLogoPaddingX ?? logoConfig.padding)) / 1000;
    const lpY = (shorterDim * (activeImg.customLogoPaddingY ?? logoConfig.padding)) / 1000;
    const logoScale = logoConfig.scale / 100;
    const spacing = (logoConfig.logoSpacing || 10) * (rect.width / imgElement.naturalWidth);

    const targetWidth = shorterDim * logoScale;
    const targetHeight = (targetWidth / activeLogos[0].imgElement.width) * activeLogos[0].imgElement.height;
    
    const totalGroupWidth = activeLogos.length * targetWidth + (activeLogos.length - 1) * spacing;
    const maxGroupHeight = targetHeight;

    const h_pos = logoConfig.horizontal;
    const v = logoConfig.vertical;

    let bx = 0, by = 0;
    if (h_pos === 'left') bx = rect.left + lpX;
    else if (h_pos === 'center') bx = rect.left + rect.width / 2 - totalGroupWidth / 2 + lpX;
    else bx = rect.left + rect.width - totalGroupWidth - lpX;

    if (v === 'top') by = rect.top + lpY;
    else if (v === 'center') by = rect.top + rect.height / 2 - maxGroupHeight / 2 + lpY;
    else by = rect.top + rect.height - maxGroupHeight - lpY;

    return { 
      left: bx, 
      top: by, 
      width: totalGroupWidth, 
      height: maxGroupHeight, 
      imageRect: rect, 
      shorterDim,
      h_align: h_pos,
      v_align: v
    };
  };

  const handleModalMouseDown = (e: React.MouseEvent) => {
    if (!zoomContainerRef.current || !activeZoomImageId) return;
    
    const textData = getTextBounds();
    const isClickInText = textData && 
      e.clientX >= textData.left && e.clientX <= textData.left + textData.width &&
      e.clientY >= textData.top && e.clientY <= textData.top + textData.height;

    if (textConfig.enabled && isClickInText) {
      const activeImg = images.find(img => img.id === activeZoomImageId);
      if (activeImg) {
        dragCacheRef.current = textData;
        setIsDraggingText(true);
        setDragStartTextPos({ x: e.clientX, y: e.clientY });
        const initialPaddingX = activeImg.customPaddingX ?? textConfig.paddingX;
        const initialPaddingY = activeImg.customPaddingY ?? textConfig.paddingY;
        setDragStartPadding({ x: initialPaddingX, y: initialPaddingY });
        setLivePadding({ x: initialPaddingX, y: initialPaddingY });
        return;
      }
    }

    const logoData = getLogoBounds();
    const isClickInLogo = logoData && 
      e.clientX >= logoData.left && e.clientX <= logoData.left + logoData.width &&
      e.clientY >= logoData.top && e.clientY <= logoData.top + logoData.height;

    if (activeLogos.length > 0 && isClickInLogo) {
      const activeImg = images.find(img => img.id === activeZoomImageId);
      if (activeImg) {
        dragCacheRef.current = logoData;
        setIsDraggingLogo(true);
        setDragStartLogoPos({ x: e.clientX, y: e.clientY });
        const initialLogoPaddingX = activeImg.customLogoPaddingX ?? logoConfig.padding;
        const initialLogoPaddingY = activeImg.customLogoPaddingY ?? logoConfig.padding;
        setDragStartLogoPadding({ x: initialLogoPaddingX, y: initialLogoPaddingY });
        setLiveLogoPadding({ x: initialLogoPaddingX, y: initialLogoPaddingY });
        return;
      }
    }

    if (modalZoom <= 1.001) return; 
    setIsPanning(true);
    setPanStart({ x: e.clientX - modalOffset.x, y: e.clientY - modalOffset.y });
  };

  const handleModalMouseMove = (e: React.MouseEvent) => {
    if (isDraggingText && dragCacheRef.current && activeZoomImageId) {
      const data = dragCacheRef.current;
      const dx = e.clientX - dragStartTextPos.x;
      const dy = e.clientY - dragStartTextPos.y;
      let relativeDx = (dx / data.shorterDim) * 1000;
      let relativeDy = (dy / data.shorterDim) * 1000;
      if (data.h_align === 'right') relativeDx = -relativeDx;
      if (data.v_align === 'bottom') relativeDy = -relativeDy;
      setLivePadding({
        x: Math.round(dragStartPadding.x + relativeDx),
        y: Math.round(dragStartPadding.y + relativeDy)
      });
      return;
    }

    if (isDraggingLogo && dragCacheRef.current && activeZoomImageId) {
      const data = dragCacheRef.current;
      const dx = e.clientX - dragStartLogoPos.x;
      const dy = e.clientY - dragStartLogoPos.y;
      let relativeDx = (dx / data.shorterDim) * 1000;
      let relativeDy = (dy / data.shorterDim) * 1000;
      if (data.h_align === 'right') relativeDx = -relativeDx;
      if (data.v_align === 'bottom') relativeDy = -relativeDy;
      setLiveLogoPadding({
        x: Math.round(dragStartLogoPadding.x + relativeDx),
        y: Math.round(dragStartLogoPadding.y + relativeDy)
      });
      return;
    }

    if (!isPanning) return;
    setModalOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleModalMouseUp = () => {
    if (isDraggingText && activeZoomImageId) {
      setImages(prev => prev.map(img => 
        img.id === activeZoomImageId 
          ? { ...img, customPaddingX: livePadding.x, customPaddingY: livePadding.y } 
          : img
      ));
    }
    if (isDraggingLogo && activeZoomImageId) {
      setImages(prev => prev.map(img => 
        img.id === activeZoomImageId 
          ? { ...img, customLogoPaddingX: liveLogoPadding.x, customLogoPaddingY: liveLogoPadding.y } 
          : img
      ));
    }
    setIsPanning(false);
    setIsDraggingText(false);
    setIsDraggingLogo(false);
    dragCacheRef.current = null;
  };

  const handleSingleDownload = useCallback(async (img: ProcessedImage) => {
    const contentToUse = img.customTitle !== undefined ? img.customTitle : textConfig.content;
    const currentTextConfig = { 
      ...textConfig, 
      content: contentToUse,
      paddingX: img.customPaddingX ?? textConfig.paddingX,
      paddingY: img.customPaddingY ?? textConfig.paddingY
    };
    const logoPadX = img.customLogoPaddingX ?? logoConfig.padding;
    const logoPadY = img.customLogoPaddingY ?? logoConfig.padding;
    const finalUrl = await processWatermark(img.originalUrl, activeLogos, logoConfig, currentTextConfig, exportSettings, 1.0, aiConfig, { x: logoPadX, y: logoPadY });
    const link = document.createElement('a'); 
    link.href = finalUrl; 
    link.download = `watermark_${img.file.name}`; 
    link.click();
  }, [activeLogos, logoConfig, textConfig, exportSettings, aiConfig]);

  const getGridClasses = () => {
    switch (previewSize) {
      case 'medium': return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4';
      case 'large': return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6';
      case 'extra-large': return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8';
      default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8';
    }
  };

  const POSITION_GRID_ITEMS: {v: VerticalPos, h: HorizontalPos}[] = [
    {v: 'top', h: 'left'}, {v: 'top', h: 'center'}, {v: 'top', h: 'right'},
    {v: 'center', h: 'left'}, {v: 'center', h: 'center'}, {v: 'center', h: 'right'},
    {v: 'bottom', h: 'left'}, {v: 'bottom', h: 'center'}, {v: 'bottom', h: 'right'}
  ];

  const DragOverlay = useMemo(() => {
    if (!isDraggingText || !activeZoomImageId || !dragCacheRef.current) return null;
    const activeImg = images.find(img => img.id === activeZoomImageId);
    if (!activeImg) return null;

    const data = dragCacheRef.current;
    const px = (data.shorterDim * livePadding.x) / 1000;
    const py = (data.shorterDim * livePadding.y) / 1000;

    const isFullWidth = textConfig.bgEnabled && textConfig.bgFullWidth;
    let bx = 0, by = 0;
    if (isFullWidth) {
      bx = data.imageRect.left;
    } else {
      if (data.h_align === 'left') bx = data.imageRect.left + px;
      else if (data.h_align === 'center') bx = data.imageRect.left + data.imageRect.width / 2 - data.width / 2 + px;
      else bx = data.imageRect.left + data.imageRect.width - data.width - px;
    }

    if (data.v_align === 'top') by = data.imageRect.top + py;
    else if (data.v_align === 'center') by = data.imageRect.top + data.imageRect.height / 2 - data.height / 2 + py;
    else by = data.imageRect.top + data.imageRect.height - data.height - py;

    return (
      <div 
        className="fixed pointer-events-none z-[100] border-2 border-cyan-400/50 shadow-2xl flex items-center justify-center overflow-hidden"
        style={{
          left: bx,
          top: by,
          width: data.width,
          height: data.height,
          backgroundColor: textConfig.bgEnabled ? (textConfig.bgGradientEnabled ? hexToRgba(textConfig.bgGradientStart, textConfig.bgGradientStartOpacity) : hexToRgba(textConfig.bgColor, textConfig.bgOpacity)) : 'transparent',
          borderRadius: `${textConfig.bgBorderRadius * (data.imageRect.width / 2000)}px`, 
        }}
      >
        <div 
          className="whitespace-pre-wrap text-center"
          style={{
            color: textConfig.color,
            fontSize: `${textConfig.fontSize * (data.imageRect.width / 2000)}px`, 
            fontWeight: textConfig.fontWeight,
            fontStyle: textConfig.fontStyle,
            fontFamily: textConfig.fontFamily,
            opacity: textConfig.opacity / 100,
            transform: isFullWidth ? `translateX(${data.h_align === 'right' ? -px : px}px)` : 'none'
          }}
          dangerouslySetInnerHTML={{ __html: activeImg.customTitle ?? textConfig.content }}
        />
      </div>
    );
  }, [isDraggingText, livePadding, activeZoomImageId, textConfig, images]);

  const LogoDragOverlay = useMemo(() => {
    if (!isDraggingLogo || !activeZoomImageId || activeLogos.length === 0 || !dragCacheRef.current) return null;
    const data = dragCacheRef.current;
    const px = (data.shorterDim * liveLogoPadding.x) / 1000;
    const py = (data.shorterDim * liveLogoPadding.y) / 1000;
    let bx = 0, by = 0;
    if (data.h_align === 'left') bx = data.imageRect.left + px;
    else if (data.h_align === 'center') bx = data.imageRect.left + data.imageRect.width / 2 - data.width / 2 + px;
    else bx = data.imageRect.left + data.imageRect.width - data.width - px;
    if (data.v_align === 'top') by = data.imageRect.top + py;
    else if (data.v_align === 'center') by = data.imageRect.top + data.imageRect.height / 2 - data.height / 2 + py;
    else by = data.imageRect.top + data.imageRect.height - data.height - py;
    return (
      <div 
        className="fixed pointer-events-none z-[101] border-2 border-amber-400/50 bg-amber-400/10 flex items-center justify-center overflow-hidden"
        style={{ left: bx, top: by, width: data.width, height: data.height }}
      >
         <div className="flex gap-2">
           {activeLogos.map(l => (
             <img key={l.id} src={l.src} style={{ width: data.width / activeLogos.length, height: data.height, objectFit: 'contain', opacity: 0.5 }} alt="" />
           ))}
         </div>
      </div>
    );
  }, [isDraggingLogo, liveLogoPadding, activeZoomImageId, activeLogos, logoConfig]);

  const handleFormatCommand = (command: string) => {
    document.execCommand(command, false);
    // Kích hoạt cập nhật cho RichInput
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const container = selection.anchorNode?.parentElement;
        if (container) {
            const event = new Event('input', { bubbles: true });
            container.dispatchEvent(event);
        }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden h-screen font-inter">
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center justify-between z-50 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500 p-2 rounded-lg shadow-lg shadow-cyan-500/20">
            <Layout className="text-black w-5 h-5" />
          </div>
          <div className="flex flex-col justify-center leading-none">
            <h1 className="text-xl font-black tracking-tighter uppercase text-white">
              AIOTI GROUP - <span className="text-cyan-400">LOGO</span>
            </h1>
            <span className="text-[11px] font-medium text-zinc-400 mt-1">0978.113.762</span>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-3 bg-zinc-800/50 p-1.5 rounded-full border border-zinc-700">
             <div className="flex items-center gap-2 pl-3">
                <span className="text-[8px] font-black uppercase text-zinc-500">Định dạng:</span>
                <select 
                  value={exportSettings.format} 
                  onChange={e => setExportSettings(p => ({ ...p, format: e.target.value as ExportFormat }))}
                  className="bg-transparent text-[10px] font-black text-cyan-400 outline-none cursor-pointer"
                >
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WEBP</option>
                </select>
             </div>
             <div className="h-4 w-px bg-zinc-700" />
             <div className="flex items-center gap-2 pr-4">
                <span className="text-[8px] font-black uppercase text-zinc-500">Chất lượng:</span>
                <input 
                  type="number" 
                  value={exportSettings.quality} 
                  onChange={e => setExportSettings(p => ({ ...p, quality: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
                  className="bg-transparent w-14 text-[10px] font-black text-cyan-400 outline-none border-b border-transparent focus:border-cyan-500 text-center"
                />
             </div>
          </div>

          <div className="flex bg-zinc-800 p-1 rounded-full items-center border border-zinc-700">
            <span className="text-[8px] font-black uppercase px-3 text-zinc-500">Preview:</span>
            {[0.2, 0.5, 1.0].map(q => (
              <button 
                key={q} 
                onClick={() => setPreviewQuality(q)}
                className={`px-3 py-1 rounded-full text-[9px] font-black transition-all ${previewQuality === q ? 'bg-zinc-700 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {q * 100}%
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => {
                const selectedImages = images.filter(img => img.selected);
                if (selectedImages.length === 0) return;
                setIsExporting(true);
                Promise.all(selectedImages.map(async img => {
                  const contentToUse = img.customTitle !== undefined ? img.customTitle : textConfig.content;
                  const currentTextConfig = { 
                    ...textConfig, 
                    content: contentToUse,
                    paddingX: img.customPaddingX ?? textConfig.paddingX,
                    paddingY: img.customPaddingY ?? textConfig.paddingY
                  };
                  const logoPadX = img.customLogoPaddingX ?? logoConfig.padding;
                  const logoPadY = img.customLogoPaddingY ?? logoConfig.padding;
                  const finalUrl = await processWatermark(img.originalUrl, activeLogos, logoConfig, currentTextConfig, exportSettings, 1.0, aiConfig, { x: logoPadX, y: logoPadY });
                  const link = document.createElement('a');
                  link.href = finalUrl;
                  link.download = `pro_watermark_${img.file.name.split('.')[0]}.${exportSettings.format.split('/')[1]}`;
                  link.click();
                })).finally(() => setIsExporting(false));
            }}
            disabled={selectedCount === 0 || isExporting}
            className="flex items-center gap-2 px-6 py-2 bg-cyan-500 text-black rounded-full hover:bg-cyan-400 disabled:opacity-20 transition-all font-black uppercase text-[10px] shadow-lg shadow-cyan-500/20"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Đang xuất...' : `Xuất file (${selectedCount})`}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r border-zinc-800 overflow-y-auto p-6 space-y-8 flex-shrink-0 bg-zinc-900 scrollbar-thin scrollbar-thumb-zinc-700">
          <section className="space-y-4">
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2 text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">AI Enhancement</h2>
               </div>
               <button onClick={() => setAiConfig(DEFAULT_AI_CONFIG)} className="p-1.5 bg-zinc-800/50 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-400/10 transition-all flex items-center gap-1 text-[8px] font-black uppercase" title="Đặt lại toàn bộ AI">
                 <RotateCcw size={12}/> Đặt lại
               </button>
            </div>
            <div className="space-y-5 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 shadow-inner">
               <Slider label="Khử nhiễu / Làm sạch (AI Clear)" value={aiConfig.denoise} onChange={(v: number) => setAiConfig(p => ({ ...p, denoise: v }))} unit="%" min={0} max={100} icon={<ShieldCheck size={12} className="text-green-400"/>} />
               <Slider label="Tăng độ nét AI" value={aiConfig.sharpen} onChange={(v: number) => setAiConfig(p => ({ ...p, sharpen: v }))} unit="%" min={0} max={100} icon={<Maximize size={12}/>} />
               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-500 flex items-center gap-2">
                    <Droplets size={12} /> Bộ lọc màu AI
                  </label>
                  <select value={aiConfig.filter} onChange={e => setAiConfig(p => ({ ...p, filter: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-[10px] font-black text-indigo-400 outline-none focus:border-indigo-500">
                    <option value="none">Gốc (None)</option>
                    <option value="vivid">Sống động (Vivid)</option>
                    <option value="cinematic">Điện ảnh (Cinematic)</option>
                    <option value="bw">Trắng đen (B&W)</option>
                    <option value="vintage">Hoài cổ (Vintage)</option>
                    <option value="warm">Ấp áp (Warm)</option>
                    <option value="cool">Lạnh (Cool)</option>
                  </select>
               </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-zinc-800 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-500"><Bookmark size={14} /><h3 className="text-[10px] font-black uppercase tracking-widest">Mẫu logo</h3></div>
              <button onClick={saveCurrentTemplate} className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-[8px] font-black uppercase hover:bg-cyan-500 hover:text-black transition-all" title="Lưu mẫu hiện tại"><PlusCircle size={10} /></button>
            </div>
            <div className="flex flex-col gap-2">
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 pr-1">
                {logoTemplates.length === 0 ? <p className="text-[8px] text-zinc-700 font-bold uppercase text-center py-2 italic">Chưa có mẫu nào được lưu</p> : logoTemplates.map(t => {
                    const isActive = activeLogos.some(l => l.src === t.logoSrc);
                    return (
                      <div key={t.id} className={`group flex flex-col bg-zinc-950 border rounded-lg transition-all overflow-hidden mb-1 ${isActive ? 'border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'border-zinc-800 hover:border-cyan-500/30'}`}>
                        <div className="flex items-center justify-between p-2">
                          <button onClick={() => toggleTemplate(t)} className="flex items-center gap-2 flex-1 text-left min-w-0">
                            <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center overflow-hidden border border-zinc-700"><img src={t.logoSrc} className="max-w-full max-h-full object-contain" alt="" /></div>
                            <div className="flex flex-col flex-1 truncate">
                                {editingTemplateId === t.id ? <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={() => renameTemplate(t.id)} onKeyDown={(e) => e.key === 'Enter' && renameTemplate(t.id)} className="bg-zinc-900 text-[9px] font-black text-white px-1 outline-none border-b border-cyan-500 truncate" onClick={e => e.stopPropagation()} /> : <span className="text-[9px] font-black text-zinc-400 uppercase truncate">{t.name}</span>}
                                {isActive && <span className="text-[7px] text-cyan-400 font-black uppercase tracking-tighter">Đã chọn</span>}
                            </div>
                          </button>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={(e) => { e.stopPropagation(); setEditingTemplateId(t.id); setEditName(t.name); }} className="text-zinc-600 hover:text-cyan-400 p-1"><Edit3 size={12} /></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }} className="text-zinc-600 hover:text-red-500 p-1"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-zinc-800 pt-6">
            <div className="flex items-center gap-2 text-cyan-500 mb-2">
               <Upload className="w-4 h-4" />
               <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Nguồn hình ảnh</h2>
            </div>
            <div className="flex flex-row items-stretch gap-2 p-1.5 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-inner min-w-0 overflow-hidden">
               <div className={`flex-1 relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 cursor-pointer border-2 border-dashed ${isDragging ? 'border-cyan-500 bg-cyan-500/10' : 'border-zinc-800/50 hover:border-zinc-700 bg-zinc-900/40'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onMouseEnter={() => setIsHoveringLogoZone(false)}>
                  <div className={`p-1.5 rounded-full mb-1 transition-colors ${isDragging ? 'bg-cyan-500 text-black' : 'text-zinc-500'}`}><ImageIcon size={16} /></div>
                  <p className="text-[7px] font-black uppercase text-zinc-500 text-center leading-tight tracking-tighter">Hình ảnh</p>
                  <label className="absolute inset-0 cursor-pointer"><input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} /></label>
                  {isDragging && <div className="absolute inset-0 pointer-events-none rounded-xl animate-pulse ring-1 ring-cyan-500" />}
               </div>
               <div className={`flex-1 relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 cursor-pointer border-2 border-dashed ${isDraggingLogoFile ? 'border-amber-500 bg-amber-500/10' : activeLogos.length > 0 ? 'border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/50' : 'border-zinc-800/50 hover:border-zinc-700 bg-zinc-900/40'}`} onDragOver={handleLogoDragOver} onDragLeave={handleLogoDragLeave} onDrop={handleLogoDrop} onMouseEnter={() => setIsHoveringLogoZone(true)}>
                  <div className="flex flex-wrap gap-1 justify-center mb-1 max-w-full overflow-hidden">
                    {activeLogos.length > 0 ? activeLogos.slice(0, 3).map(l => (
                      <div key={l.id} className="w-5 h-5 rounded bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center shadow-sm">
                        <img src={l.src} className="max-w-full max-h-full object-contain" alt="" />
                      </div>
                    )) : <div className={`p-1.5 rounded-full transition-colors ${isDraggingLogoFile ? 'bg-amber-500 text-black' : 'text-zinc-500'}`}><ImagePlus size={16} /></div>}
                    {activeLogos.length > 3 && <span className="text-[6px] font-black text-zinc-600">+{activeLogos.length - 3}</span>}
                  </div>
                  <p className="text-[7px] font-black uppercase text-zinc-500 text-center leading-tight tracking-tighter">Logo</p>
                  <label className="absolute inset-0 cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /></label>
                  {isDraggingLogoFile && <div className="absolute inset-0 pointer-events-none rounded-xl animate-pulse ring-1 ring-amber-500" />}
               </div>
            </div>
          </section>

          {activeLogos.length > 0 && (
            <section className="space-y-6 pt-6 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2 text-cyan-500"><ImageIcon className="w-4 h-4" /><h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cấu hình Logo</h2></div>
                 <button onClick={() => setLogoConfig(DEFAULT_LOGO_CONFIG)} className="p-1 text-zinc-500 hover:text-cyan-400 transition-colors" title="Đặt lại Logo"><RotateCcw size={14}/></button>
              </div>
              <div className="space-y-3 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 mb-4">
                  <div className="flex items-center justify-between mb-1"><span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Logo đang dùng ({activeLogos.length})</span><button onClick={() => setActiveLogos([])} className="text-[8px] font-black uppercase text-red-500 hover:underline">Xóa tất cả</button></div>
                  <div className="flex flex-col gap-3">
                    {activeLogos.map((l, i) => (
                      <div key={l.id} className="flex flex-col bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 group space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                               <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0"><img src={l.src} className="max-w-full max-h-full object-contain" alt="" /></div>
                               <span className="text-[8px] font-black text-zinc-400 uppercase truncate">Logo #{i+1}</span>
                            </div>
                            <div className="flex items-center gap-1">
                               <button onClick={() => moveLogo(i, 'up')} disabled={i === 0} className="p-1 text-zinc-600 hover:text-cyan-400 disabled:opacity-20"><ArrowUp size={12}/></button>
                               <button onClick={() => moveLogo(i, 'down')} disabled={i === activeLogos.length - 1} className="p-1 text-zinc-600 hover:text-cyan-400 disabled:opacity-20"><ArrowDown size={12}/></button>
                               <button onClick={() => setActiveLogos(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-zinc-600 hover:text-red-500"><X size={12}/></button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="grid grid-cols-3 gap-0.5 p-0.5 bg-black/30 rounded border border-zinc-800/50">
                              {POSITION_GRID_ITEMS.map(({v, h}) => (
                                <button key={`l-${i}-${v}-${h}`} onClick={() => updateLogoPosition(i, v, h)} className={`h-4 rounded-sm transition-all ${l.vertical === v && l.horizontal === h ? 'bg-cyan-500 text-black' : 'bg-zinc-800/50 hover:bg-zinc-700/50'}`} />
                              ))}
                            </div>
                          </div>
                      </div>
                    ))}
                  </div>
              </div>
              <div className="space-y-5">
                <Slider label="Kích thước Logo" value={logoConfig.scale} onChange={(v: number) => setLogoConfig(p => ({ ...p, scale: v }))} unit="%" min={1} max={200} icon={<Maximize size={12}/>}/>
                {activeLogos.length > 1 && <Slider label="Khoảng cách giữa Logo" value={logoConfig.logoSpacing} onChange={(v: number) => setLogoConfig(p => ({ ...p, logoSpacing: v }))} unit="px" min={0} max={200} icon={<ArrowDownUp size={12} className="rotate-90"/>}/>}
                <Slider label="Khoảng đệm mép" value={logoConfig.padding} onChange={(v: number) => setLogoConfig(p => ({ ...p, padding: v }))} unit="px" min={0} max={500} icon={<Grid size={12}/>}/>
                <Slider label="Độ mờ Logo" value={logoConfig.opacity} onChange={(v: number) => setLogoConfig(p => ({ ...p, opacity: v }))} unit="%" min={0} max={100} icon={<Layers size={12}/>}/>
                <Slider label="Xoay Logo" value={logoConfig.rotate} onChange={(v: number) => setLogoConfig(p => ({ ...p, rotate: v }))} unit="°" min={0} max={360} icon={<RotateCw size={12}/>}/>
              </div>
            </section>
          )}

          <section className="space-y-6 pt-6 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2 text-amber-500"><Type className="w-4 h-4" /><h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">tiêu đề chính</h2></div>
               <div className="flex items-center gap-2"><button onClick={() => setTextConfig(DEFAULT_TEXT_CONFIG)} className="p-1 text-zinc-500 hover:text-amber-500 transition-colors" title="Đặt lại Tiêu đề"><RotateCcw size={14}/></button><Switch enabled={textConfig.enabled} onChange={() => setTextConfig(p => ({...p, enabled: !p.enabled}))} /></div>
            </div>
            {textConfig.enabled && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <RichInput
                    value={textConfig.content}
                    onChange={(v: string) => setTextConfig(p => ({...p, content: v}))}
                    placeholder="NHẬP TIÊU ĐỀ"
                    className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-xl text-sm font-bold text-white transition-colors shadow-inner leading-tight min-h-[40px]"
                    style={{ border: '1px solid #27272a' }}
                  />
                  <div className="flex items-center gap-1.5 px-0.5">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter mr-auto">Mẫu</span>
                    {savedTitles.map((t, i) => (
                      <div key={i} className="flex items-center bg-black/40 border border-zinc-800 rounded px-2 h-6 gap-2 group/slot">
                        <button 
                          onClick={() => t && setTextConfig(p => ({...p, content: t}))}
                          className={`text-[9px] font-black truncate max-w-[40px] transition-colors ${t ? 'text-zinc-400 hover:text-amber-500' : 'text-zinc-800 cursor-default'}`}
                          title={t || "Slot trống"}
                          dangerouslySetInnerHTML={{ __html: t ? t : `#${i+1}` }}
                        />
                        <button onClick={() => saveTitleToSlot(i)} className="text-zinc-800 hover:text-amber-600 transition-colors" title="Lưu tiêu đề hiện tại vào mẫu này">
                          <Save size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Vị trí Tiêu đề</label>
                  <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-900">
                    {POSITION_GRID_ITEMS.map(({v, h}) => (
                      <button key={`text-${v}-${h}`} onClick={() => setTextConfig(p => ({ ...p, vertical: v, horizontal: h }))} className={`h-9 rounded-md border transition-all ${textConfig.vertical === v && textConfig.horizontal === h ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-zinc-900 border-zinc-800 text-[8px] hover:border-zinc-700'}`} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Phông chữ</label>
                    <select value={textConfig.fontFamily} onChange={e => setTextConfig(p => ({...p, fontFamily: e.target.value as any}))} className="w-full text-xs font-bold border border-zinc-800 p-2.5 rounded-lg bg-black text-white outline-none focus:border-amber-500">
                      <option value="Inter">Inter</option>
                      <option value="Serif">Serif</option>
                      <option value="Monospace">Mono</option>
                      <option value="Arial">Arial</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Màu chữ</label>
                    <div className="flex items-center gap-3 bg-black p-2 border border-zinc-800 rounded-lg h-[46px]">
                        <input type="color" value={textConfig.color} onChange={e => setTextConfig(p => ({...p, color: e.target.value}))} className="w-8 h-8 rounded-full cursor-pointer bg-transparent border border-zinc-700 overflow-hidden shadow-lg" />
                        <div className="flex flex-col gap-1 min-w-0"><span className="text-[10px] font-mono font-black text-zinc-300 truncate">{textConfig.color.toUpperCase()}</span><CompactColorPicker selectedColor={textConfig.color} onSelect={(c: string) => setTextConfig(p => ({...p, color: c}))} /></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button 
                      onMouseDown={(e) => { e.preventDefault(); handleFormatCommand('bold'); }} 
                      className={`flex-1 flex items-center justify-center p-2.5 rounded-xl border transition-all bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white`} 
                      title="In đậm (Bôi đen để áp dụng)"
                    >
                      <Bold size={16} />
                    </button>
                    <button 
                      onMouseDown={(e) => { e.preventDefault(); handleFormatCommand('italic'); }} 
                      className={`flex-1 flex items-center justify-center p-2.5 rounded-xl border transition-all bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white`} 
                      title="In nghiêng (Bôi đen để áp dụng)"
                    >
                      <Italic size={16} />
                    </button>
                    <button 
                      onMouseDown={(e) => { e.preventDefault(); handleFormatCommand('underline'); }} 
                      className={`flex-1 flex items-center justify-center p-2.5 rounded-xl border transition-all bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white`} 
                      title="Gạch chân (Bôi đen để áp dụng)"
                    >
                      <Underline size={16} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setTextConfig(p => ({...p, textAlign: 'left'}))} className={`flex-1 flex items-center justify-center p-2.5 rounded-xl border transition-all ${textConfig.textAlign === 'left' ? 'bg-white text-black border-white shadow-lg' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'}`} title="Canh lề trái"><AlignLeft size={16} /></button>
                    <button onClick={() => setTextConfig(p => ({...p, textAlign: 'center'}))} className={`flex-1 flex items-center justify-center p-2.5 rounded-xl border transition-all ${textConfig.textAlign === 'center' ? 'bg-white text-black border-white shadow-lg' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'}`} title="Canh lề giữa"><AlignCenter size={16} /></button>
                    <button onClick={() => setTextConfig(p => ({...p, textAlign: 'right'}))} className={`flex-1 flex items-center justify-center p-2.5 rounded-xl border transition-all ${textConfig.textAlign === 'right' ? 'bg-white text-black border-white shadow-lg' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'}`} title="Canh lề phải"><AlignRight size={16} /></button>
                  </div>
                </div>
                <div className="space-y-4 pt-2">
                  <Slider label="Cỡ chữ" value={textConfig.fontSize} onChange={(v: number) => setTextConfig(p => ({...p, fontSize: v}))} unit="PX" min={10} max={1000} />
                  <div className="grid grid-cols-1 gap-4">
                    <Slider label="Lề ngang (X)" value={textConfig.paddingX} onChange={(v: number) => setTextConfig(p => ({ ...p, paddingX: v }))} unit="PX" min={0} max={1000} icon={<ArrowRight size={12}/>}/>
                    <Slider label="Lề dọc (Y)" value={textConfig.paddingY} onChange={(v: number) => setTextConfig(p => ({ ...p, paddingY: v }))} unit="PX" min={0} max={1000} icon={<ArrowDown size={12}/>}/>
                  </div>
                  <Slider label="Độ mờ" value={textConfig.opacity} onChange={(v: number) => setTextConfig(p => ({...p, opacity: v}))} unit="%" min={0} max={100} />
                </div>
                <div className="pt-6 border-t border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between"><label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">khung tiêu đề</label><span className="text-[8px] text-zinc-600 font-bold uppercase select-none">Bo góc: {textConfig.bgBorderRadius}px</span></div>
                  <div className="flex items-center justify-between"><label className="text-[10px] text-zinc-500 font-black uppercase">Hiển thị khung</label><Switch enabled={textConfig.bgEnabled} onChange={() => setTextConfig(p => ({...p, bgEnabled: !p.bgEnabled}))} /></div>
                  {textConfig.bgEnabled && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="bg-zinc-950/40 p-3 rounded-2xl border border-zinc-800/50 space-y-3">
                        <div className="flex items-center justify-between"><span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Kích thước & Bố cục</span><div className="flex items-center gap-2"><span className="text-[8px] font-black uppercase text-zinc-600">Full ngang</span><Switch enabled={textConfig.bgFullWidth} onChange={() => setTextConfig(p => ({...p, bgFullWidth: !p.bgFullWidth}))} size="sm" /></div></div>
                        <Slider label="Chiều cao khung" value={textConfig.bgHeightScale} onChange={(v: number) => setTextConfig(p => ({ ...p, bgHeightScale: v }))} unit="%" min={0} max={100} icon={<Maximize size={12}/>}/>
                        <Slider label="Lề trong khung" value={textConfig.bgInternalPadding} onChange={(v: number) => setTextConfig(p => ({ ...p, bgInternalPadding: v }))} unit="px" min={0} max={100} icon={<Maximize2 size={12}/>}/>
                        <Slider label="Bo góc khung" value={textConfig.bgBorderRadius} onChange={(v: number) => setTextConfig(p => ({ ...p, bgBorderRadius: v }))} unit="px" min={0} max={500} icon={<RefreshCw size={12}/>} />
                      </div>
                      <div className="bg-zinc-950/40 p-3 rounded-2xl border border-zinc-800/50 space-y-4">
                         <div className="flex items-center justify-between"><span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Màu sắc & Gradient</span><div className="flex items-center gap-2"><span className="text-[8px] font-black uppercase text-zinc-600">Dải màu</span><Switch enabled={textConfig.bgGradientEnabled} onChange={() => setTextConfig(p => ({...p, bgGradientEnabled: !p.bgGradientEnabled}))} size="sm" /></div></div>
                         {textConfig.bgGradientEnabled ? (
                           <div className="space-y-4 animate-in fade-in duration-300">
                             <div className="h-6 w-full rounded-lg border border-zinc-800 overflow-hidden relative shadow-inner" style={{ background: `linear-gradient(to right, ${hexToRgba(textConfig.bgGradientStart, textConfig.bgGradientStartOpacity)} ${textConfig.bgGradientStartPos}%, ${hexToRgba(textConfig.bgGradientEnd, textConfig.bgGradientEndOpacity)} ${textConfig.bgGradientEndPos}%)` }}><div className="absolute top-0 bottom-0 w-1 bg-white shadow-lg" style={{ left: `${textConfig.bgGradientStartPos}%` }} /><div className="absolute top-0 bottom-0 w-1 bg-white shadow-lg" style={{ left: `${textConfig.bgGradientEndPos}%` }} /></div>
                             <div className="space-y-2">
                                <label className="text-[8px] font-black text-zinc-600 block uppercase tracking-wider">Hướng dải màu</label>
                                <div className="grid grid-cols-5 gap-1 p-1 bg-black/40 rounded-lg">
                                  {GRADIENT_DIRECTIONS.map((item) => (
                                    <button key={item.dir} onClick={() => setTextConfig(p => ({ ...p, bgGradientDirection: item.dir }))} className={`flex items-center justify-center p-2 rounded border transition-all ${textConfig.bgGradientDirection === item.dir ? 'bg-amber-500 border-amber-500 text-black shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}`} title={item.dir}>{item.icon}</button>
                                  ))}
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                               <div className="p-2.5 bg-black/50 border border-zinc-800 rounded-xl space-y-3">
                                  <div className="flex items-center justify-between"><span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">Start Color</span><div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800/50 shadow-inner"><input type="color" value={textConfig.bgGradientStart} onChange={e => setTextConfig(p => ({...p, bgGradientStart: e.target.value}))} className="w-5 h-5 rounded-full cursor-pointer border border-zinc-700 p-0 overflow-hidden" /><CompactColorPicker onSelect={(c: string) => setTextConfig(p => ({...p, bgGradientStart: c}))} selectedColor={textConfig.bgGradientStart} /></div></div>
                                  <Slider label="Vị trí" value={textConfig.bgGradientStartPos} onChange={(v: number) => setTextConfig(p => ({...p, bgGradientStartPos: v}))} unit="%" min={0} max={100} />
                                  <Slider label="Độ mờ" value={textConfig.bgGradientStartOpacity} onChange={(v: number) => setTextConfig(p => ({...p, bgGradientStartOpacity: v}))} unit="%" min={0} max={100} />
                               </div>
                               <div className="p-2.5 bg-black/50 border border-zinc-800 rounded-xl space-y-3">
                                  <div className="flex items-center justify-between"><span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">End Color</span><div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800/50 shadow-inner"><input type="color" value={textConfig.bgGradientEnd} onChange={e => setTextConfig(p => ({...p, bgGradientEnd: e.target.value}))} className="w-5 h-5 rounded-full cursor-pointer border border-zinc-700 p-0 overflow-hidden" /><CompactColorPicker onSelect={(c: string) => setTextConfig(p => ({...p, bgGradientEnd: c}))} selectedColor={textConfig.bgGradientEnd} /></div></div>
                                  <Slider label="Vị trí" value={textConfig.bgGradientEndPos} onChange={(v: number) => setTextConfig(p => ({...p, bgGradientEndPos: v}))} unit="%" min={0} max={100} />
                                  <Slider label="Độ mờ" value={textConfig.bgGradientEndOpacity} onChange={(v: number) => setTextConfig(p => ({...p, bgGradientEndOpacity: v}))} unit="%" min={0} max={100} />
                               </div>
                             </div>
                           </div>
                         ) : (
                           <div className="flex items-center gap-4 p-2 bg-black/40 rounded-xl border border-zinc-800">
                              <input type="color" value={textConfig.bgColor} onChange={e => setTextConfig(p => ({...p, bgColor: e.target.value}))} className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-700 p-0 overflow-hidden shadow-lg" />
                              <div className="flex-1"><span className="text-[9px] font-mono font-black text-zinc-400 block mb-1 uppercase tracking-widest">{textConfig.bgColor}</span><CompactColorPicker selectedColor={textConfig.bgColor} onSelect={(c: string) => setTextConfig(p => ({...p, bgColor: c}))} /></div>
                           </div>
                         )}
                      </div>
                      <div className="bg-zinc-950/40 p-3 rounded-2xl border border-zinc-800/50"><Slider label="Độ mờ tổng khung" value={textConfig.bgOpacity} onChange={(v: number) => setTextConfig(p => ({...p, bgOpacity: v}))} unit="%" min={0} max={100} icon={<Layers size={12}/>} /></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </aside>

        <section className="flex-1 bg-zinc-950 overflow-hidden flex flex-col relative">
          <div className="flex items-center justify-between bg-zinc-950/80 backdrop-blur-md z-40 px-10 py-6 border-b border-zinc-900/50">
             <div className="flex items-center gap-8">
                <div className="flex flex-col"><h2 className="text-3xl font-black text-white uppercase tracking-[0.3em] italic flex items-center gap-3"><Activity className="text-cyan-400 w-8 h-8 animate-pulse" /><span className="text-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">Preview</span></h2><div className="h-1 w-full bg-gradient-to-r from-cyan-500 to-transparent rounded-full mt-1 opacity-50" /></div>
                <div className="h-10 w-px bg-zinc-800" />
                {zoomImageUrl ? <ZoomTitleInput activeImg={images.find(img => img.id === activeZoomImageId)!} placeholder={textConfig.content} onUpdateTitle={updateImageTitle} onResetTitle={resetImageTitleOnly} onResetPosition={resetImagePositionOnly} onResetLogoPosition={resetImageLogoPositionOnly} /> : <>
                    <div className="relative" ref={sizeMenuRef}>
                       <button onClick={() => setShowSizeMenu(!showSizeMenu)} className="flex items-center gap-3 px-6 py-2.5 bg-zinc-900 border border-zinc-700 rounded-full text-[10px] font-black text-zinc-400 hover:text-white hover:border-zinc-500 transition-all uppercase tracking-widest shadow-lg"><Monitor size={14} className="text-cyan-400" />Hiển thị: {previewSize === 'extra-large' ? 'Rất lớn' : previewSize === 'large' ? 'Lớn' : 'Vừa'}</button>
                       {showSizeMenu && (
                         <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-[60] overflow-hidden py-1 animate-in slide-in-from-top-2 duration-200 backdrop-blur-md">
                            <button onClick={() => { setPreviewSize('extra-large'); setShowSizeMenu(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-left transition-all ${previewSize === 'extra-large' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}><Maximize2 size={14} /> Extra large icons</button>
                            <button onClick={() => { setPreviewSize('large'); setShowSizeMenu(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-left transition-all ${previewSize === 'large' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}><MonitorDot size={14} /> Large icons</button>
                            <button onClick={() => { setPreviewSize('medium'); setShowSizeMenu(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-left transition-all ${previewSize === 'medium' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}><Grid size={14} /> Medium icons</button>
                         </div>
                       )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={toggleSelectAll} className="text-[10px] font-black text-white flex items-center gap-3 hover:bg-white hover:text-black px-6 py-2.5 rounded-full border border-zinc-700 transition-all uppercase tracking-widest shadow-lg shadow-white/5 bg-zinc-900">{isAllSelected ? <CheckSquare size={14} className="text-cyan-400" /> : <Square size={14} />}{isAllSelected ? 'Bỏ chọn hết' : 'Chọn toàn bộ'}</button>
                      <button onClick={clearAllImages} disabled={images.length === 0} className="text-[10px] font-black text-red-500 flex items-center gap-3 hover:bg-red-500 hover:text-white px-6 py-2.5 rounded-full border border-red-500/30 transition-all uppercase tracking-widest shadow-lg shadow-red-500/5 disabled:opacity-20 bg-zinc-900"><RefreshCw size={14} /> Làm mới</button>
                    </div>
                  </>}
             </div>
             <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] flex items-center gap-4"><div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800"><Zap size={10} className="text-yellow-500" /><span>Preview: {previewQuality * 100}%</span></div><div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800"><span>{selectedCount} / {images.length} Ảnh</span></div></div>
          </div>

          <div 
            className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-zinc-700"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); setIsHoveringLogoZone(false); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleDrop}
          >
            {zoomImageUrl || isZooming ? <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 rounded-[3rem] border border-zinc-900/50 shadow-inner relative overflow-hidden animate-in fade-in zoom-in-95 duration-500" onWheel={handleModalWheel} onMouseMove={handleModalMouseMove} onMouseUp={handleModalMouseUp} onMouseLeave={handleModalMouseUp}>
                {DragOverlay}
                {LogoDragOverlay}
                <button className="absolute top-8 right-8 p-4 bg-zinc-800/80 hover:bg-white hover:text-black text-white rounded-2xl transition-all shadow-2xl z-50 active:scale-95 border border-zinc-700/50" onClick={() => { setZoomImageUrl(null); setActiveZoomImageId(null); }}><X size={20} /></button>
                <div className="absolute left-8 flex flex-col gap-4 z-50"><button onClick={(e) => { e.stopPropagation(); navigateZoom('prev'); }} className="p-5 bg-zinc-900/80 hover:bg-cyan-500 hover:text-black text-white rounded-2xl transition-all border border-zinc-800 shadow-2xl active:scale-90 backdrop-blur-md"><ChevronLeft size={36} /></button></div>
                <div className="absolute right-8 flex flex-col gap-4 z-50"><button onClick={(e) => { e.stopPropagation(); navigateZoom('next'); }} className="p-5 bg-zinc-900/80 hover:bg-cyan-500 hover:text-black text-white rounded-2xl transition-all border border-zinc-800 shadow-2xl active:scale-90 backdrop-blur-md"><ChevronRight size={36} /></button></div>
                {isZooming ? <div className="flex flex-col items-center gap-6 p-16"><Loader2 className="w-12 h-12 text-cyan-400 animate-spin" /><div className="text-center space-y-2"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Đang chuẩn bị bản phóng lớn...</p></div></div> : <div ref={zoomContainerRef} className="w-full h-full flex items-center justify-center overflow-hidden cursor-default select-none" onMouseDown={handleModalMouseDown} style={{ cursor: isDraggingText || isDraggingLogo ? 'move' : (modalZoom > 1.001 ? (isPanning ? 'grabbing' : 'grab') : 'default') }}><div className="relative transition-transform duration-150 ease-out" style={{ transform: `translate(${modalOffset.x}px, ${modalOffset.y}px) scale(${modalZoom})`, willChange: 'transform' }}><img src={zoomImageUrl!} className={`max-w-[85%] max-h-[75vh] object-contain shadow-[0_40px_100px_rgba(0,0,0,0.8)] pointer-events-none rounded-2xl border border-zinc-800 transition-opacity duration-300 ${isDraggingText || isDraggingLogo ? 'opacity-40' : 'opacity-100'}`} alt="Zoom Preview" /></div></div>}
              </div> : <div className={`grid ${getGridClasses()} transition-all duration-300`}>
                {images.map((img) => (
                  <ImageCard key={img.id} img={img} previewSize={previewSize} textConfig={textConfig} onSelect={toggleSelectImage} onDelete={(id) => setImages(prev => prev.filter(i => i.id !== id))} onPreview={openFullPreview} onDownload={handleSingleDownload} onUpdateImageTitle={updateImageTitle} onResetAll={resetImageAllCustoms} />
                ))}
                {images.length === 0 && <div className="col-span-full h-[60vh] flex flex-col items-center justify-center text-zinc-800 bg-zinc-900/30 rounded-[3rem] border-4 border-dashed border-zinc-900 shadow-inner"><ImageIcon className="w-16 h-16 opacity-10 mb-8" /><p className="font-black uppercase text-sm tracking-[0.6em] opacity-20 text-center px-10 leading-loose">Kéo thả ảnh vào bảng bên trái để bắt đầu</p></div>}
              </div>}
          </div>
        </section>
      </main>
    </div>
  );
}

// Helper Components
const Slider = ({ label, value, onChange, unit = "", min = 0, max = 100, icon }: any) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2">
        {icon} {label}
      </label>
      <div className="flex items-center gap-1.5 bg-black px-2 py-1 rounded-lg border border-zinc-900 shadow-inner">
        <input 
          type="number" 
          value={value} 
          onChange={(e) => onChange(parseInt(e.target.value) || 0)} 
          className="bg-transparent text-[10px] font-mono font-black text-cyan-400 outline-none w-10 text-right appearance-none" 
        />
        <span className="text-[9px] font-mono font-black text-zinc-600 uppercase select-none">{unit}</span>
      </div>
    </div>
    <div className="relative flex items-center h-4">
      <input 
        type="range" 
        min={min} 
        max={max} 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
    </div>
  </div>
);

const Switch = ({ enabled, onChange, size = 'md' }: any) => (
  <button 
    onClick={onChange}
    className={`relative inline-flex items-center rounded-full transition-all duration-300 focus:outline-none ${enabled ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'} ${size === 'sm' ? 'h-4 w-7' : 'h-5 w-9'}`}
  >
    <span className={`inline-block transform rounded-full bg-white transition-transform duration-300 ${size === 'sm' ? (enabled ? 'translate-x-3.5 h-3 w-3' : 'translate-x-0.5 h-3 w-3') : (enabled ? 'translate-x-4.5 h-4 w-4' : 'translate-x-0.5 h-4 w-4')}`} />
  </button>
);

const CompactColorPicker = ({ selectedColor, onSelect }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: rect.top, left: rect.right + 12 });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      <button ref={buttonRef} onClick={toggle} className="flex items-center justify-center p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-cyan-500 transition-all group" title="Chọn màu nhanh">
        <Palette size={12} className="group-hover:text-cyan-400 text-zinc-500" />
      </button>
      {isOpen && (
        <div 
          ref={popoverRef} 
          className="fixed z-[1000] w-64 p-3 bg-zinc-900 border border-zinc-700 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-left-4 backdrop-blur-2xl" 
          style={{ top: Math.max(10, Math.min(window.innerHeight - 300, coords.top - 110)), left: coords.left }}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[8px] font-black uppercase text-zinc-500">Bảng màu nhanh</span>
              <X size={10} className="text-zinc-500 cursor-pointer hover:text-white" onClick={() => setIsOpen(false)} />
            </div>
            <div className="grid grid-cols-10 gap-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
              {QUICK_COLORS.map((color, i) => (
                <button 
                  key={`${color}-${i}`} 
                  onClick={() => { onSelect(color); setIsOpen(false); }} 
                  className={`aspect-square w-full rounded-sm transition-all transform active:scale-90 ${selectedColor.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-cyan-500 z-10 scale-110 shadow-lg shadow-cyan-500/20' : 'hover:scale-110 hover:z-10'}`} 
                  style={{ backgroundColor: color }} 
                  title={color} 
                />
              ))}
            </div>
          </div>
          <div className="absolute top-[118px] -left-2 w-4 h-4 bg-zinc-900 border-l border-b border-zinc-700 rotate-45 pointer-events-none" />
        </div>
      )}
    </div>
  );
};
