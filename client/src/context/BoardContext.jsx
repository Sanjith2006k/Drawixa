import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Rect, Circle, IText, PencilBrush, Shadow, Triangle, Line, FabricImage } from 'fabric';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const BoardContext = createContext();
export const useBoard = () => useContext(BoardContext);

const COLORS = [
  '#FFFFFF', '#FF3B30', '#FF9500', '#FFCC00', '#34C759',
  '#00C7BE', '#30B0C7', '#1B4EF5', '#5856D6', '#AF52DE',
  '#FF2D55', '#A2845E', '#8E8E93', '#F4CEFF', '#000000'
];

const BACKGROUNDS = {
  blackboard: '#050816',
  whiteboard: '#F5F5F5',
  grid: '#F0F0F0',
};

const TEMPLATES = {
  blank: { label: 'Blank Canvas', icon: '📄' },
  ruled: { label: 'Ruled Notebook', icon: '📓' },
  grid: { label: 'Grid Paper', icon: '📏' },
  dotted: { label: 'Dotted Paper', icon: '⬡' },
  cornell: { label: 'Cornell Notes', icon: '📝' },
};

export { COLORS, BACKGROUNDS, TEMPLATES };

export const BoardProvider = ({ children }) => {
  const [canvas, setCanvas] = useState(null);
  const [activeTool, setActiveTool] = useState('select');
  const [activeColor, setActiveColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [bgMode, setBgMode] = useState('whiteboard');
  const [activeTemplate, setActiveTemplate] = useState('blank');
  const [templatePageCount, setTemplatePageCount] = useState(10);
  const [showMargin, setShowMargin] = useState(false);
  const canvasRef = useRef(null);

  const initCanvas = useCallback((canvasInstance) => {
    setCanvas(canvasInstance);
    canvasRef.current = canvasInstance;
  }, []);

  const getTextColor = () => bgMode === 'blackboard' ? '#FFFFFF' : '#000000';

  const changeBg = (mode) => {
    setBgMode(mode);
    if (!canvasRef.current) return;
    canvasRef.current.backgroundColor = BACKGROUNDS[mode];
    
    const isBlack = mode === 'blackboard';
    canvasRef.current.selectionColor = isBlack ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
    canvasRef.current.selectionBorderColor = isBlack ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
    
    canvasRef.current.renderAll();
  };

  // Helper: draw a line using a thin Rect
  const makeLine = (x, y, w, h, color, strokeW) => {
    const rect = new Rect({
      left: x, top: y, width: w, height: h,
      fill: color, strokeWidth: strokeW || 0,
      originX: 'left', originY: 'top',
      selectable: false, evented: false,
      name: 'templateLine'
    });
    rect._isTemplateLine = true;
    return rect;
  };

  // ---- TEMPLATES ----
  const applyTemplate = (templateId, pageCount = templatePageCount, margin = showMargin) => {
    const c = canvasRef.current;
    if (!c) return;
    setActiveTemplate(templateId);
    
    // Store directly on the canvas instance to prevent race conditions during synchronous event firing
    c.templateConfig = { id: templateId, count: pageCount, margin };

    // Suspend rendering to prevent massive stuttering and blinking during bulk operations
    c.renderOnAddRemove = false;

    // Identify existing user objects so we can preserve their z-index
    const userObjects = c.getObjects().filter(o => !o._isTemplateLine && o.selectable !== false);

    // Remove old template objects (both via flag and fallback for old saves)
    const toRemove = c.getObjects().filter(o => o._isTemplateLine || o.selectable === false);
    toRemove.forEach(o => c.remove(o));

    if (templateId === 'blank') { c.renderAll(); return; }

    const W = 768;
    const H = 1024;
    
    // Fix the page to an absolute virtual coordinate (0) so it doesn't shift across different devices.
    // The camera/viewport will handle centering the page later.
    const offsetX = 0;
    let startOffsetY = 60;
    const pageGap = 40;
    
    const isBlack = bgMode === 'blackboard';
    const ruledColor = isBlack ? 'rgba(100,149,237,0.2)' : 'rgba(100,149,237,0.35)';
    const lineColor = isBlack ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';

    // Render pages
    for (let page = 0; page < pageCount; page++) {
      const offsetY = startOffsetY + (page * (H + pageGap));

      // Page background
      const pageBg = new Rect({
        left: offsetX, top: offsetY, width: W, height: H,
        fill: isBlack ? '#0E1328' : '#FFFFFF',
        stroke: isBlack ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)',
        strokeWidth: 1, rx: 2, ry: 2,
        originX: 'left', originY: 'top',
        selectable: false, evented: false,
        name: 'templateLine'
      });
      pageBg._isTemplateLine = true;
      c.add(pageBg);
      c.sendObjectToBack(pageBg);

      if (templateId === 'ruled') {
        if (margin) {
          c.add(makeLine(offsetX + 80, offsetY, 1, H, isBlack ? 'rgba(255,100,100,0.3)' : 'rgba(255,100,100,0.5)', 0));
        }

        // Exactly 30 horizontal ruled lines
        const numLines = 30;
        const topMargin = 40;
        const bottomMargin = 40;
        const availableHeight = H - topMargin - bottomMargin;
        const lineSpacing = availableHeight / (numLines - 1);
        
        const lineX = offsetX + 40;
        const lineWidth = W - 80;

        for (let i = 0; i < numLines; i++) {
          const y = offsetY + topMargin + (i * lineSpacing);
          // If margin is present, make lines start from the margin (or edge to edge)
          // The user's image shows the blue lines crossing the red margin. So we keep edge to edge.
          c.add(makeLine(lineX, y, lineWidth, 1, ruledColor, 0));
        }
      } else if (templateId === 'grid') {
        const spacing = 25;
        for (let x = offsetX + spacing; x < offsetX + W; x += spacing) {
          c.add(makeLine(x, offsetY, 0.5, H, lineColor, 0));
        }
        for (let y = offsetY + spacing; y < offsetY + H; y += spacing) {
          c.add(makeLine(offsetX, y, W, 0.5, lineColor, 0));
        }
      } else if (templateId === 'dotted') {
        const spacing = 25;
        for (let x = offsetX + spacing; x < offsetX + W; x += spacing) {
          for (let y = offsetY + spacing; y < offsetY + H; y += spacing) {
            c.add(new Circle({
              left: x - 1, top: y - 1, radius: 1,
              fill: isBlack ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)',
              selectable: false, evented: false, _isTemplateLine: true,
            }));
          }
        }
      } else if (templateId === 'cornell') {
        c.add(makeLine(offsetX, offsetY + 100, W, 1.5, ruledColor, 0));
        c.add(makeLine(offsetX + 200, offsetY + 100, 1.5, H - 260, ruledColor, 0));
        c.add(makeLine(offsetX, offsetY + H - 160, W, 1.5, ruledColor, 0));
        for (let y = offsetY + 130; y < offsetY + H - 180; y += 30) {
          c.add(makeLine(offsetX + 210, y, W - 230, 0.5, lineColor, 0));
        }
        c.add(new IText('TITLE', {
          left: offsetX + 20, top: offsetY + 35,
          fontSize: 24, fill: isBlack ? '#444' : '#CCC',
          fontFamily: 'Inter, sans-serif', selectable: false, evented: false, _isTemplateLine: true,
        }));
        c.add(new IText('Cues', {
          left: offsetX + 50, top: offsetY + 140,
          fontSize: 14, fill: isBlack ? '#333' : '#CCC',
          fontFamily: 'Inter, sans-serif', selectable: false, evented: false, _isTemplateLine: true,
        }));
        c.add(new IText('Summary', {
          left: offsetX + 20, top: offsetY + H - 140,
          fontSize: 14, fill: isBlack ? '#333' : '#CCC',
          fontFamily: 'Inter, sans-serif', selectable: false, evented: false, _isTemplateLine: true,
        }));
      }
    }

    // Bring all user objects to the front to ensure they perfectly overlay the newly drawn template
    userObjects.forEach(obj => {
      c.bringToFront(obj);
    });

    // Restore rendering and perform a single batched render
    c.renderOnAddRemove = true;
    c.renderAll();
  };

  // ---- TOOLS ----
  const changeTool = (tool) => {
    const c = canvasRef.current;
    if (!c) return;

    c.isDrawingMode = false;
    c.selection = true;
    c.defaultCursor = 'default';
    c.forEachObject((obj) => {
      if (!obj._isTemplateLine) { obj.selectable = true; obj.evented = true; }
    });

    setActiveTool(tool);

    switch (tool) {
      case 'draw': {
        c.isDrawingMode = true;
        const brush = new PencilBrush(c);
        brush.color = activeColor;
        brush.width = strokeWidth;
        c.freeDrawingBrush = brush;
        break;
      }
      case 'pan': {
        c.selection = false;
        c.defaultCursor = 'grab';
        c.forEachObject((obj) => { obj.selectable = false; obj.evented = false; });
        break;
      }
      case 'eraser': {
        c.isDrawingMode = true;
        const eraserBrush = new PencilBrush(c);
        eraserBrush.color = c.backgroundColor || '#F5F5F5';
        eraserBrush.width = 20;
        c.freeDrawingBrush = eraserBrush;
        break;
      }
      case 'rect': {
        // Get center of current viewport
        const vpt = c.viewportTransform;
        const cx = (-vpt[4] + c.width / 2) / c.getZoom();
        const cy = (-vpt[5] + c.height / 2) / c.getZoom();
        c.add(new Rect({
          left: cx - 75, top: cy - 50,
          fill: 'transparent', stroke: activeColor, strokeWidth, width: 150, height: 100, rx: 8, ry: 8,
        }));
        c.renderAll(); setActiveTool('select');
        break;
      }
      case 'circle': {
        const vpt = c.viewportTransform;
        const cx = (-vpt[4] + c.width / 2) / c.getZoom();
        const cy = (-vpt[5] + c.height / 2) / c.getZoom();
        c.add(new Circle({
          left: cx - 50, top: cy - 50,
          fill: 'transparent', stroke: activeColor, strokeWidth, radius: 50,
        }));
        c.renderAll(); setActiveTool('select');
        break;
      }
      case 'triangle': {
        const vpt = c.viewportTransform;
        const cx = (-vpt[4] + c.width / 2) / c.getZoom();
        const cy = (-vpt[5] + c.height / 2) / c.getZoom();
        c.add(new Triangle({
          left: cx - 50, top: cy - 50,
          fill: 'transparent', stroke: activeColor, strokeWidth, width: 100, height: 100,
        }));
        c.renderAll(); setActiveTool('select');
        break;
      }
      case 'line': {
        const vpt = c.viewportTransform;
        const cx = (-vpt[4] + c.width / 2) / c.getZoom();
        const cy = (-vpt[5] + c.height / 2) / c.getZoom();
        c.add(new Line([cx - 100, cy, cx + 100, cy], {
          stroke: activeColor, strokeWidth,
        }));
        c.renderAll(); setActiveTool('select');
        break;
      }
      case 'text': {
        const vpt = c.viewportTransform;
        const cx = (-vpt[4] + c.width / 2) / c.getZoom();
        const cy = (-vpt[5] + c.height / 2) / c.getZoom();
        const text = new IText('Type here...', {
          left: cx - 60, top: cy - 15,
          fill: getTextColor(), fontFamily: 'Inter, sans-serif', fontSize: 24,
        });
        c.add(text); c.setActiveObject(text); text.enterEditing(); text.selectAll(); c.renderAll();
        setActiveTool('select');
        break;
      }
      case 'sticky': {
        const vpt = c.viewportTransform;
        const cx = (-vpt[4] + c.width / 2) / c.getZoom();
        const cy = (-vpt[5] + c.height / 2) / c.getZoom();
        c.add(new Rect({
          left: cx - 100, top: cy - 100,
          fill: '#F4CEFF', width: 200, height: 200, rx: 8, ry: 8,
          shadow: new Shadow({ color: 'rgba(0,0,0,0.3)', blur: 15, offsetX: 3, offsetY: 3 }),
        }));
        const stickyText = new IText('Note...', {
          left: cx - 80, top: cy - 80,
          fill: '#050816', fontFamily: 'Inter, sans-serif', fontSize: 18, width: 160,
        });
        c.add(stickyText); c.setActiveObject(stickyText); c.renderAll();
        setActiveTool('select');
        break;
      }
      default: break;
    }
  };

  // ---- COLOR & STROKE ----
  const updateColor = (color) => {
    setActiveColor(color);
    const c = canvasRef.current;
    if (!c) return;
    const activeObj = c.getActiveObject();
    if (activeObj) {
      if (activeObj.type === 'i-text' || activeObj.type === 'text') {
        activeObj.set('fill', color);
      } else if (activeObj.stroke) {
        activeObj.set('stroke', color);
      } else {
        activeObj.set('fill', color);
      }
      c.renderAll();
    }
    if (c.isDrawingMode && c.freeDrawingBrush) c.freeDrawingBrush.color = color;
  };

  const updateStrokeWidth = (width) => {
    setStrokeWidth(width);
    const c = canvasRef.current;
    if (!c) return;
    if (c.isDrawingMode && c.freeDrawingBrush) c.freeDrawingBrush.width = width;
    const activeObj = c.getActiveObject();
    if (activeObj && activeObj.stroke) { activeObj.set('strokeWidth', width); c.renderAll(); }
  };

  const deleteSelected = () => {
    const c = canvasRef.current;
    if (!c) return;
    const objs = c.getActiveObjects();
    objs.forEach(obj => { if (!obj._isTemplateLine) c.remove(obj); });
    c.discardActiveObject(); c.renderAll();
  };

  const undo = () => {
    const c = canvasRef.current;
    if (!c) return;
    const objects = c.getObjects().filter(o => !o._isTemplateLine);
    if (objects.length > 0) { c.remove(objects[objects.length - 1]); c.renderAll(); }
  };

  // ---- UPLOAD IMAGE ----
  const uploadImage = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const c = canvasRef.current;
        if (!c) return;
        const img = await FabricImage.fromURL(ev.target.result);
        const maxW = c.width * 0.6;
        const maxH = c.height * 0.6;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        img.scale(scale);
        const vpt = c.viewportTransform;
        const cx = (-vpt[4] + c.width / 2) / c.getZoom();
        const cy = (-vpt[5] + c.height / 2) / c.getZoom();
        img.set({ left: cx - (img.width * scale) / 2, top: cy - (img.height * scale) / 2 });
        c.add(img); c.setActiveObject(img); c.renderAll();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // ---- UPLOAD PDF ----
  const uploadPDF = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.pdf';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const c = canvasRef.current;
      if (!c) return;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let currentY = 60;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        const ctx = tempCanvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        const dataUrl = tempCanvas.toDataURL('image/png');
        const img = await FabricImage.fromURL(dataUrl);
        const offsetX = Math.max((c.width - img.width) / 2, 20);
        img.set({
          left: offsetX, top: currentY, selectable: true,
          shadow: new Shadow({ color: 'rgba(0,0,0,0.12)', blur: 15, offsetX: 3, offsetY: 3 }),
        });
        c.add(img);
        currentY += img.height + 40;
      }
      c.renderAll();
    };
    input.click();
  };

  // ---- EXPORT PDF ----
  const exportPDF = () => {
    const c = canvasRef.current;
    if (!c) return;
    const objects = c.getObjects();
    if (objects.length === 0) return;

    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pdfW = 210;
    const pdfH = 297;
    const W = 768;
    const H = 1024;
    
    // Use the exact absolute coordinates we set for the pages
    const offsetX = 0;
    
    const startOffsetY = 60;
    const pageGap = 40;

    // Find the lowest user-drawn object to determine how many pages to export
    const userObjects = objects.filter(o => {
      if (o._isTemplateLine || o.name === 'templateLine') return false;
      // Ignore ghost page backgrounds
      if (o.type === 'rect' && o.width === 768 && o.height === 1024) return false;
      // Ignore ghost horizontal ruled lines
      if (o.type === 'rect' && o.height <= 2 && o.width > 500) return false;
      // Ignore ghost vertical lines
      if (o.type === 'rect' && o.width <= 2 && o.height > 900) return false;
      return true;
    });
    let maxUserY = 0;
    if (userObjects.length > 0) {
      maxUserY = Math.max(...userObjects.map(o => o.getBoundingRect().top + o.getBoundingRect().height));
    }
    
    let numPagesToExport = 1;
    if (maxUserY > 0) {
       numPagesToExport = Math.max(1, Math.ceil((maxUserY - startOffsetY) / (H + pageGap)));
    }
    // Limit to 10 pages maximum
    numPagesToExport = Math.min(numPagesToExport, 10);

    // Save current viewport transform and reset it to identity
    const originalVpt = c.viewportTransform.slice();
    c.setViewportTransform([1, 0, 0, 1, 0, 0]);

    for (let page = 0; page < numPagesToExport; page++) {
      if (page > 0) doc.addPage();
      
      const offsetY = startOffsetY + (page * (H + pageGap));
      
      const dataURL = c.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2,
        left: offsetX,
        top: offsetY,
        width: W,
        height: H
      });
      
      doc.addImage(dataURL, 'PNG', 0, 0, pdfW, pdfH);
    }

    // Restore viewport transform
    c.setViewportTransform(originalVpt);

    doc.save('drawixa-export.pdf');
  };

  const addPage = () => {
    setTemplatePageCount(prev => {
      const next = prev + 1;
      setTimeout(() => applyTemplate(activeTemplate, next, showMargin), 0);
      return next;
    });
  };

  const toggleMargin = () => {
    setShowMargin(prev => {
      const next = !prev;
      setTimeout(() => applyTemplate(activeTemplate, templatePageCount, next), 0);
      return next;
    });
  };

  const setTemplateConfig = (id, count, margin) => {
    setActiveTemplate(id || 'blank');
    setTemplatePageCount(count || 10);
    setShowMargin(margin || false);
    setTimeout(() => applyTemplate(id || 'blank', count || 10, margin || false), 0);
  };

  return (
    <BoardContext.Provider value={{
      canvas, initCanvas, activeTool, changeTool,
      activeColor, updateColor, COLORS,
      strokeWidth, updateStrokeWidth,
      bgMode, changeBg,
      deleteSelected, undo,
      uploadImage, uploadPDF, exportPDF,
      applyTemplate, activeTemplate, TEMPLATES,
      addPage, toggleMargin, showMargin, templatePageCount,
      setTemplateConfig
    }}>
      {children}
    </BoardContext.Provider>
  );
};
