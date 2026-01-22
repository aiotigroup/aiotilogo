
import { LogoConfig, TextWatermarkConfig, ExportFormat, AIConfig, LogoItem, VerticalPos, HorizontalPos } from '../types';

export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

interface TextSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

/**
 * Phân tích chuỗi HTML thành danh sách các phân đoạn văn bản có style riêng biệt.
 */
function getStyledSegments(html: string): TextSegment[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || '', 'text/html');
  const body = doc.body;
  
  const segments: TextSegment[] = [];
  
  function traverse(node: Node, currentStyles: { b: boolean; i: boolean; u: boolean }) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text) {
        segments.push({
          text,
          bold: currentStyles.b,
          italic: currentStyles.i,
          underline: currentStyles.u
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      
      const newStyles = { ...currentStyles };
      if (tag === 'b' || tag === 'strong') newStyles.b = true;
      if (tag === 'i' || tag === 'em') newStyles.i = true;
      if (tag === 'u') newStyles.u = true;
      
      if (tag === 'br') {
        segments.push({ text: '\n', bold: false, italic: false, underline: false });
      } else {
        el.childNodes.forEach(child => traverse(child, newStyles));
      }
    }
  }

  body.childNodes.forEach(node => traverse(node, { b: false, i: false, u: false }));
  return segments;
}

/**
 * Chia danh sách segments thành các dòng riêng biệt.
 */
function splitSegmentsIntoLines(segments: TextSegment[]): TextSegment[][] {
  const lines: TextSegment[][] = [];
  let currentLine: TextSegment[] = [];

  segments.forEach(seg => {
    if (seg.text.includes('\n')) {
      const parts = seg.text.split('\n');
      parts.forEach((part, idx) => {
        if (part) {
          currentLine.push({ ...seg, text: part });
        }
        if (idx < parts.length - 1) {
          lines.push(currentLine);
          currentLine = [];
        }
      });
    } else {
      currentLine.push(seg);
    }
  });

  if (currentLine.length > 0) lines.push(currentLine);
  if (lines.length === 0) lines.push([{ text: '', bold: false, italic: false, underline: false }]);
  
  return lines;
}

export async function processWatermark(
  imgUrl: string, 
  logos: LogoItem[], 
  logoConfig: LogoConfig,
  textConfig: TextWatermarkConfig,
  exportSettings: { format: ExportFormat; quality: number },
  previewScale: number = 1.0,
  aiConfig?: AIConfig,
  customLogoPadding?: { x: number; y: number }
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      if (!ctx) return;
      
      canvas.width = img.width * previewScale;
      canvas.height = img.height * previewScale;
      
      let filterString = '';
      if (aiConfig) {
        if (aiConfig.denoise > 0) filterString += `blur(${(aiConfig.denoise / 100) * 0.8}px) `;
        if (aiConfig.sharpen > 0) filterString += `contrast(${1 + (aiConfig.sharpen / 150)}) saturate(${1 + aiConfig.sharpen / 400}) `;
        switch (aiConfig.filter) {
          case 'vivid': filterString += 'saturate(1.5) contrast(1.1) '; break;
          case 'cinematic': filterString += 'sepia(0.2) contrast(1.2) brightness(0.9) hue-rotate(-10deg) '; break;
          case 'bw': filterString += 'grayscale(1) contrast(1.2) '; break;
          case 'vintage': filterString += 'sepia(0.5) contrast(0.9) brightness(1.1) '; break;
          case 'warm': filterString += 'sepia(0.3) saturate(1.2) hue-rotate(-5deg) '; break;
          case 'cool': filterString += 'hue-rotate(180deg) saturate(0.8) brightness(1.1) '; break;
        }
      }

      ctx.filter = filterString.trim() || 'none';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none'; 
      
      const shorterDim = Math.min(canvas.width, canvas.height);

      // --- RENDER TEXT ---
      if (textConfig.enabled && textConfig.content.trim()) {
        ctx.save();
        const scaledFontSize = textConfig.fontSize * previewScale;
        const lineHeight = scaledFontSize * 1.3;
        
        // Phân đoạn và chia dòng
        const segments = getStyledSegments(textConfig.content);
        const lines = splitSegmentsIntoLines(segments);

        // Đo đạc kích thước
        const lineMetrics = lines.map(line => {
          let width = 0;
          line.forEach(seg => {
            const fontStyle = seg.italic ? 'italic' : (textConfig.fontStyle === 'italic' ? 'italic' : 'normal');
            const fontWeight = seg.bold ? 'bold' : (textConfig.fontWeight === 'bold' ? 'bold' : 'normal');
            ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${textConfig.fontFamily}`;
            width += ctx.measureText(seg.text).width;
          });
          return width;
        });

        const maxLineWidth = Math.max(...lineMetrics, 0);
        const totalTextHeight = lines.length * lineHeight;

        const internalPad = (textConfig.bgInternalPadding || 5) * previewScale;
        const px = (shorterDim * textConfig.paddingX) / 1000;
        const py = (shorterDim * textConfig.paddingY) / 1000;
        
        const baseBW = maxLineWidth + internalPad * 2;
        const baseBH = totalTextHeight + internalPad * 2;

        const isFullWidth = textConfig.bgEnabled && textConfig.bgFullWidth;
        let bw = isFullWidth ? canvas.width : baseBW;
        let bh = textConfig.bgEnabled ? baseBH + ((canvas.height - baseBH) * (textConfig.bgHeightScale / 100)) : baseBH;

        let bx = 0, by = 0;
        if (isFullWidth) {
          bx = 0; 
        } else {
          if (textConfig.horizontal === 'left') bx = px;
          else if (textConfig.horizontal === 'center') bx = canvas.width / 2 - bw / 2 + px;
          else bx = canvas.width - bw - px;
        }

        if (textConfig.vertical === 'top') by = py;
        else if (textConfig.vertical === 'center') by = canvas.height / 2 - bh / 2 + py;
        else by = canvas.height - bh - py;

        // RENDER BACKGROUND
        if (textConfig.bgEnabled) {
          ctx.save();
          const r = (textConfig.bgBorderRadius || 0) * previewScale;
          ctx.beginPath();
          if ((ctx as any).roundRect) (ctx as any).roundRect(bx, by, bw, bh, r); else ctx.rect(bx, by, bw, bh);
          ctx.globalAlpha = textConfig.bgOpacity / 100;

          if (textConfig.bgGradientEnabled) {
            let gradient: CanvasGradient;
            const dir = textConfig.bgGradientDirection;
            if (dir === 'radial-out' || dir === 'radial-in') {
              const cx = bx + bw / 2;
              const cy = by + bh / 2;
              const radius = Math.max(bw, bh) / 2;
              if (dir === 'radial-out') gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
              else gradient = ctx.createRadialGradient(cx, cy, radius, cx, cy, 0);
            } else {
              let x0 = bx, y0 = by, x1 = bx + bw, y1 = by + bh;
              switch (dir) {
                case 'to-right': x0 = bx; y0 = by + bh/2; x1 = bx + bw; y1 = by + bh/2; break;
                case 'to-left': x0 = bx + bw; y0 = by + bh/2; x1 = bx; y1 = by + bh/2; break;
                case 'to-bottom': x0 = bx + bw/2; y0 = by; x1 = bx + bw/2; y1 = by + bh; break;
                case 'to-top': x0 = bx + bw/2; y0 = by + bh; x1 = bx + bw/2; y1 = by; break;
                case 'to-bottom-right': x0 = bx; y0 = by; x1 = bx + bw; y1 = by + bh; break;
                case 'to-bottom-left': x0 = bx + bw; y0 = by; x1 = bx; y1 = by + bh; break;
                case 'to-top-right': x0 = bx; y0 = by + bh; x1 = bx + bw; y1 = by; break;
                case 'to-top-left': x0 = bx + bw; y0 = by + bh; x1 = bx; y1 = by; break;
              }
              gradient = ctx.createLinearGradient(x0, y0, x1, y1);
            }
            gradient.addColorStop(textConfig.bgGradientStartPos / 100, hexToRgba(textConfig.bgGradientStart, textConfig.bgGradientStartOpacity));
            gradient.addColorStop(textConfig.bgGradientEndPos / 100, hexToRgba(textConfig.bgGradientEnd, textConfig.bgGradientEndOpacity));
            ctx.fillStyle = gradient;
          } else {
            ctx.fillStyle = textConfig.bgColor;
          }
          ctx.fill();
          ctx.restore();
        }

        // RENDER TEXT CONTENT (LƯU Ý: Luôn căn giữa theo chiều dọc trong khung bh)
        ctx.globalAlpha = textConfig.opacity / 100;
        ctx.fillStyle = textConfig.color;
        
        // Tính Y bắt đầu sao cho khối text nằm chính giữa khung bh theo chiều dọc
        const startTy = by + bh / 2 - totalTextHeight / 2 + (scaledFontSize * 0.85);
        
        lines.forEach((line, index) => {
          const currentLineWidth = lineMetrics[index];
          let drawX = 0;
          if (textConfig.textAlign === 'left') drawX = bx + internalPad;
          else if (textConfig.textAlign === 'center') drawX = bx + bw / 2 - currentLineWidth / 2;
          else drawX = bx + bw - internalPad - currentLineWidth;

          if (isFullWidth) {
             if (textConfig.textAlign === 'left') drawX += px;
             else if (textConfig.textAlign === 'right') drawX -= px;
          }

          line.forEach(seg => {
            const fontStyle = seg.italic ? 'italic' : (textConfig.fontStyle === 'italic' ? 'italic' : 'normal');
            const fontWeight = seg.bold ? 'bold' : (textConfig.fontWeight === 'bold' ? 'bold' : 'normal');
            ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${textConfig.fontFamily}`;
            
            ctx.fillText(seg.text, drawX, startTy + index * lineHeight);
            
            if (seg.underline || textConfig.textDecoration === 'underline') {
              const segWidth = ctx.measureText(seg.text).width;
              ctx.save();
              ctx.strokeStyle = textConfig.color;
              ctx.lineWidth = Math.max(1, scaledFontSize / 12);
              const lineY = startTy + index * lineHeight + (scaledFontSize * 0.1);
              ctx.beginPath();
              ctx.moveTo(drawX, lineY);
              ctx.lineTo(drawX + segWidth, lineY);
              ctx.stroke();
              ctx.restore();
            }
            
            drawX += ctx.measureText(seg.text).width;
          });
        });
        
        ctx.restore();
      }

      // --- RENDER MULTIPLE LOGOS ---
      if (logos.length > 0) {
        ctx.save();
        const curPaddingX = customLogoPadding?.x ?? logoConfig.padding;
        const curPaddingY = customLogoPadding?.y ?? logoConfig.padding;
        
        const lpX = (shorterDim * curPaddingX) / 1000;
        const lpY = (shorterDim * curPaddingY) / 1000;
        const logoScale = logoConfig.scale / 100;
        const spacing = (logoConfig.logoSpacing || 10) * previewScale;

        const groups: Map<string, any[]> = new Map();
        const preparedLogos = logos.map(logoItem => {
          const lImg = logoItem.imgElement;
          const targetWidth = shorterDim * logoScale;
          const targetHeight = (targetWidth / lImg.width) * lImg.height;
          return { img: lImg, w: targetWidth, h: targetHeight, v: logoItem.vertical, h_pos: logoItem.horizontal };
        });

        preparedLogos.forEach(pl => {
          const key = `${pl.v}-${pl.h_pos}`;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(pl);
        });

        ctx.globalAlpha = logoConfig.opacity / 100;
        groups.forEach((groupLogos, posKey) => {
          const [v, h_pos] = posKey.split('-') as [VerticalPos, HorizontalPos];
          const totalGroupWidth = groupLogos.reduce((acc, l) => acc + l.w, 0) + (groupLogos.length - 1) * spacing;
          const maxGroupHeight = Math.max(...groupLogos.map(l => l.h));
          let currentX = 0;
          let startY = 0;
          if (h_pos === 'left') currentX = lpX;
          else if (h_pos === 'center') currentX = canvas.width / 2 - totalGroupWidth / 2 + lpX;
          else currentX = canvas.width - totalGroupWidth - lpX;
          if (v === 'top') startY = lpY;
          else if (v === 'center') startY = canvas.height / 2 - maxGroupHeight / 2 + lpY;
          else startY = canvas.height - maxGroupHeight - lpY;
          groupLogos.forEach(pl => {
            ctx.save();
            const offsetY = (maxGroupHeight - pl.h) / 2;
            ctx.translate(currentX + pl.w / 2, startY + offsetY + pl.h / 2);
            ctx.rotate((logoConfig.rotate * Math.PI) / 180);
            ctx.drawImage(pl.img, -pl.w / 2, -pl.h / 2, pl.w, pl.h);
            ctx.restore();
            currentX += pl.w + spacing;
          });
        });
        ctx.restore();
      }
      resolve(canvas.toDataURL(exportSettings.format, exportSettings.quality / 100));
    };
    img.src = imgUrl;
  });
}
