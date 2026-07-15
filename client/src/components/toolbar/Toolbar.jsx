import React, { useState } from 'react';
import {
  MousePointer2, Hand, PenTool, Type, Square, Circle, Triangle,
  StickyNote, Undo2, Trash2, Minus, Eraser, Sun, Moon,
  Upload, FileDown, Image, FileText, LayoutTemplate,
  FilePlus, Ruler
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useBoard, COLORS, BACKGROUNDS, TEMPLATES } from '../../context/BoardContext';

export function Toolbar() {
  const {
    activeTool, changeTool,
    activeColor, updateColor,
    strokeWidth, updateStrokeWidth,
    bgMode, changeBg,
    deleteSelected, undo,
    uploadImage, uploadPDF, exportPDF,
    applyTemplate, activeTemplate,
    addPage, toggleMargin, showMargin
  } = useBoard();

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const closeAll = () => {
    setShowColorPicker(false);
    setShowBgPicker(false);
    setShowUploadMenu(false);
    setShowTemplateMenu(false);
  };

  const tools = [
    { icon: <MousePointer2 size={18} />, id: 'select', label: 'Select' },
    { icon: <Hand size={18} />, id: 'pan', label: 'Pan (Alt+Drag)' },
    { icon: <PenTool size={18} />, id: 'draw', label: 'Draw' },
    { icon: <Eraser size={18} />, id: 'eraser', label: 'Eraser' },
    { icon: <Type size={18} />, id: 'text', label: 'Text' },
    { icon: <Square size={18} />, id: 'rect', label: 'Rectangle' },
    { icon: <Circle size={18} />, id: 'circle', label: 'Circle' },
    { icon: <Triangle size={18} />, id: 'triangle', label: 'Triangle' },
    { icon: <Minus size={18} />, id: 'line', label: 'Line' },
    { icon: <StickyNote size={18} />, id: 'sticky', label: 'Sticky Note' },
  ];

  return (
    <>
      {/* Click-away overlay */}
      {(showColorPicker || showBgPicker || showUploadMenu || showTemplateMenu) && (
        <div className="fixed inset-0 z-40" onClick={closeAll} />
      )}

      <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 flex items-center gap-2">
        {/* Drawing Tools */}
        <div className="bg-surface/90 backdrop-blur-xl border border-borderColor rounded-2xl p-1.5 shadow-2xl flex items-center gap-0.5">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => { changeTool(tool.id); closeAll(); }}
              title={tool.label}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 text-textSecondary hover:text-white relative group",
                activeTool === tool.id && "bg-primary text-white hover:bg-primary shadow-lg shadow-primary/30"
              )}
            >
              {tool.icon}
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-borderColor">
                {tool.label}
              </span>
            </button>
          ))}
        </div>

        <div className="w-px h-10 bg-borderColor" />

        {/* Color Picker */}
        <div className="relative">
          <button
            onClick={() => { closeAll(); setShowColorPicker(!showColorPicker); }}
            className="bg-surface/90 backdrop-blur-xl border border-borderColor rounded-2xl p-2.5 shadow-2xl flex items-center gap-2 hover:border-primary transition-colors"
          >
            <div className="w-5 h-5 rounded-full border-2 border-white/30" style={{ backgroundColor: activeColor }} />
          </button>
          {showColorPicker && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-surface/95 backdrop-blur-xl border border-borderColor rounded-2xl p-4 shadow-2xl w-56 z-50">
              <p className="text-xs text-textSecondary mb-3 font-medium">Stroke Color</p>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-lg border-2 transition-all hover:scale-110",
                      activeColor === color ? "border-primary scale-110 shadow-lg" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="text-xs text-textSecondary mb-2 font-medium">Custom Color</p>
              <input type="color" value={activeColor} onChange={(e) => updateColor(e.target.value)}
                className="w-full h-8 rounded-lg cursor-pointer bg-transparent border border-borderColor" />
              <p className="text-xs text-textSecondary mt-4 mb-2 font-medium">Stroke Width: {strokeWidth}px</p>
              <input type="range" min="1" max="20" value={strokeWidth}
                onChange={(e) => updateStrokeWidth(Number(e.target.value))} className="w-full accent-primary" />
            </div>
          )}
        </div>

        {/* Templates */}
        <div className="relative">
          <button
            onClick={() => { closeAll(); setShowTemplateMenu(!showTemplateMenu); }}
            title="Templates"
            className="bg-surface/90 backdrop-blur-xl border border-borderColor rounded-2xl p-2.5 shadow-2xl hover:border-primary transition-colors text-textSecondary hover:text-white"
          >
            <LayoutTemplate size={18} />
          </button>
          {showTemplateMenu && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-surface/95 backdrop-blur-xl border border-borderColor rounded-2xl p-3 shadow-2xl w-52 z-50">
              <p className="text-xs text-textSecondary mb-2 font-medium">Page Templates</p>
              {Object.entries(TEMPLATES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => { applyTemplate(key); setShowTemplateMenu(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors",
                    activeTemplate === key ? "bg-primary text-white" : "text-textSecondary hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span>{val.icon}</span>
                  {val.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upload Menu */}
        <div className="relative">
          <button
            onClick={() => { closeAll(); setShowUploadMenu(!showUploadMenu); }}
            title="Upload"
            className="bg-surface/90 backdrop-blur-xl border border-borderColor rounded-2xl p-2.5 shadow-2xl hover:border-primary transition-colors text-textSecondary hover:text-white"
          >
            <Upload size={18} />
          </button>
          {showUploadMenu && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-surface/95 backdrop-blur-xl border border-borderColor rounded-2xl p-3 shadow-2xl w-48 z-50">
              <p className="text-xs text-textSecondary mb-2 font-medium">Upload</p>
              <button
                onClick={() => { uploadImage(); setShowUploadMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-textSecondary hover:bg-white/5 hover:text-white transition-colors"
              >
                <Image size={16} /> Upload Image
              </button>
              <button
                onClick={() => { uploadPDF(); setShowUploadMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-textSecondary hover:bg-white/5 hover:text-white transition-colors"
              >
                <FileText size={16} /> Upload PDF
              </button>
            </div>
          )}
        </div>

        {/* Background Toggle */}
        <div className="relative">
          <button
            onClick={() => { closeAll(); setShowBgPicker(!showBgPicker); }}
            title="Background"
            className="bg-surface/90 backdrop-blur-xl border border-borderColor rounded-2xl p-2.5 shadow-2xl hover:border-primary transition-colors text-textSecondary hover:text-white"
          >
            {bgMode === 'whiteboard' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {showBgPicker && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-surface/95 backdrop-blur-xl border border-borderColor rounded-2xl p-3 shadow-2xl w-44 z-50">
              <p className="text-xs text-textSecondary mb-2 font-medium">Background</p>
              {Object.entries(BACKGROUNDS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => { changeBg(key); setShowBgPicker(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors capitalize",
                    bgMode === key ? "bg-primary text-white" : "text-textSecondary hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="w-5 h-5 rounded border border-borderColor" style={{ backgroundColor: val }} /> {key}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-10 bg-borderColor" />

        {/* Export & Actions */}
        <div className="bg-surface/90 backdrop-blur-xl border border-borderColor rounded-2xl p-1.5 shadow-2xl flex items-center gap-0.5">
          <button onClick={addPage} title="Add New Page" className="p-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 text-textSecondary hover:text-white">
            <FilePlus size={18} />
          </button>
          <button onClick={toggleMargin} title="Toggle Margin Line" className={cn("p-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 text-textSecondary hover:text-white", showMargin && "text-primary bg-primary/10")}>
            <Ruler size={18} />
          </button>
          <div className="w-px h-6 bg-borderColor mx-1" />
          <button onClick={exportPDF} title="Export as PDF" className="p-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 text-textSecondary hover:text-white">
            <FileDown size={18} />
          </button>
          <button onClick={undo} title="Undo (Ctrl+Z)" className="p-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 text-textSecondary hover:text-white">
            <Undo2 size={18} />
          </button>
          <button onClick={deleteSelected} title="Delete (Del)" className="p-2.5 rounded-xl transition-all duration-200 hover:bg-red-500/20 text-textSecondary hover:text-red-400">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
