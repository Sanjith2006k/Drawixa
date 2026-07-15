import React, { useEffect, useRef } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { io } from 'socket.io-client';
import { useBoard, BACKGROUNDS } from '../../context/BoardContext';
import { useAuth } from '../../context/AuthContext';

export function Canvas({ boardId, initialData, onParticipantsUpdate, templateParam }) {
  const canvasRef = useRef(null);
  const { initCanvas, activeTool, bgMode, applyTemplate, templatePageCount, activeTemplate, showMargin, setTemplateConfig } = useBoard();
  const { user } = useAuth();
  const fabricRef = useRef(null);
  const socketRef = useRef(null);
  const isLoadingRef = useRef(false);
  const templateApplied = useRef(false);
  const pageCountRef = useRef(10);
  const templateConfigRef = useRef({ id: 'blank', count: 10, margin: false });

  useEffect(() => {
    pageCountRef.current = templatePageCount || 10;
    templateConfigRef.current = { id: activeTemplate, count: templatePageCount, margin: showMargin };
  }, [activeTemplate, templatePageCount, showMargin]);

  useEffect(() => {
    // 1. Socket.io
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    socketRef.current.emit('join-board', { boardId, userName: user.name });

    socketRef.current.on('participants-update', (participants) => {
      if (onParticipantsUpdate) onParticipantsUpdate(participants);
    });

    const isBlack = bgMode === 'blackboard';
    const fc = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: BACKGROUNDS[bgMode] || '#F5F5F5',
      selection: true,
      selectionColor: isBlack ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      selectionBorderColor: isBlack ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
      preserveObjectStacking: true,
    });

    fabricRef.current = fc;

    // Automatically zoom and pan to center the 768px wide page on load
    const pageW = 768;
    const padding = 20;
    if (window.innerWidth < pageW + padding * 2) {
      const initialZoom = (window.innerWidth - padding * 2) / pageW;
      fc.setZoom(initialZoom);
      const vpt = fc.viewportTransform;
      vpt[4] = padding;
      fc.setViewportTransform(vpt);
    } else {
      const vpt = fc.viewportTransform;
      vpt[4] = (window.innerWidth - pageW) / 2;
      fc.setViewportTransform(vpt);
    }

    initCanvas(fc);

    // Load saved data
    const hasData = initialData && typeof initialData === 'object' && Object.keys(initialData).length > 0;
    if (hasData) {
      isLoadingRef.current = true;
      fc.loadFromJSON(initialData).then(() => {
        // Aggressive cleanup for saved template lines (catches old corrupted saves that lost their flags)
        const toRemove = fc.getObjects().filter(o => {
          if (o._isTemplateLine || o.name === 'templateLine' || o.selectable === false) return true;
          // Catch old page backgrounds
          if (o.type === 'rect' && o.width === 794 && o.height === 1123) return true;
          // Catch old horizontal ruled lines (height <= 2, width > 500)
          if (o.type === 'rect' && o.height <= 2 && o.width > 500) return true;
          // Catch old vertical lines from cornell/grid (width <= 2, height > 1000)
          if (o.type === 'rect' && o.width <= 2 && o.height > 1000) return true;
          return false;
        });
        toRemove.forEach(o => fc.remove(o));
        fc.renderAll();
        
        // Re-apply the requested template dynamically
        const savedTemplateId = initialData.templateId;
        const savedCount = initialData.templatePageCount || 10;
        const savedMargin = initialData.showMargin || false;
        
        const templateToApply = templateParam || savedTemplateId;
        if (templateToApply) {
          setTemplateConfig(templateToApply, savedCount, savedMargin);
        }
        
        isLoadingRef.current = false;
      });
    } else if (templateParam && !templateApplied.current) {
      // New board, apply template immediately
      templateApplied.current = true;
      setTimeout(() => applyTemplate(templateParam), 150);
    }

    // 3. Autosave & Sync (debounced to prevent stuttering during drag operations)
    let saveTimeout;
    let syncTimeout;
    const emitCanvasState = () => {
      if (isLoadingRef.current) return;
      
      // Debounce the socket sync — only fire 300ms after the last change
      // This prevents toJSON() from running on every single drag frame
      clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        const json = fc.toJSON(['_isTemplateLine', 'name']);
        
        // Embed custom template state into the root of the JSON save data
        const config = fc.templateConfig || templateConfigRef.current;
        json.templateId = config.id;
        json.templatePageCount = config.count;
        json.showMargin = config.margin;

        socketRef.current.emit('canvas-update', { boardId, canvasState: json });
        
        // Autosave to server (further debounced)
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
          try {
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/boards/${boardId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${user.token}`
              },
              body: JSON.stringify({ canvasData: json })
            });
          } catch (err) {
            console.error('Autosave failed:', err);
          }
        }, 2000);
      }, 300);
    };

    fc.on('object:added', emitCanvasState);
    fc.on('object:modified', emitCanvasState);
    fc.on('object:removed', emitCanvasState);
    fc.on('path:created', emitCanvasState);

    // Receive real-time updates
    socketRef.current.on('canvas-update', (canvasState) => {
      isLoadingRef.current = true;
      fc.loadFromJSON(canvasState).then(() => {
        // Sync the template configuration in multiplayer
        if (canvasState.templateId) {
          setTemplateConfig(canvasState.templateId, canvasState.templatePageCount || 10, canvasState.showMargin || false);
          
          // Wait for the setTimeout in setTemplateConfig to finish applying the template
          // before we lift the loading lock, preventing an infinite broadcast echo ping-pong loop!
          setTimeout(() => {
            fc.renderAll();
            isLoadingRef.current = false;
          }, 50);
        } else {
          fc.renderAll();
          isLoadingRef.current = false;
        }
      });
    });

    // 4. Mouse wheel: scroll to pan, Ctrl+wheel to zoom
    fc.on('mouse:wheel', function (opt) {
      const e = opt.e;
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        // Zoom
        let zoom = fc.getZoom();
        zoom *= 0.995 ** e.deltaY;
        zoom = Math.max(0.1, Math.min(10, zoom));
        fc.zoomToPoint({ x: e.offsetX, y: e.offsetY }, zoom);
      } else {
        // Pan (scroll)
        const vpt = fc.viewportTransform.slice();
        let dx = e.deltaX;
        let dy = e.deltaY;
        if (e.deltaMode === 1) { // Lines
          dx *= 33;
          dy *= 33;
        } else if (e.deltaMode === 2) { // Pages
          dx *= window.innerWidth;
          dy *= window.innerHeight;
        }
        vpt[4] -= dx; // horizontal scroll
        vpt[5] -= dy; // vertical scroll
        
        // Prevent infinite scrolling upwards and downwards
        // 200 allows a small buffer above the first page
        vpt[5] = Math.min(vpt[5], 200); 
        // dynamically limit downward scroll based on actual page count
        const maxScrollY = pageCountRef.current * 1064 * fc.getZoom();
        vpt[5] = Math.max(vpt[5], -maxScrollY);
        
        // Prevent infinite scrolling left/right
        const maxScrollX = 3000 * fc.getZoom();
        vpt[4] = Math.max(Math.min(vpt[4], maxScrollX), -maxScrollX);

        fc.setViewportTransform(vpt);
      }
    });

    // 5. Pan (Hand tool or Alt+drag)
    let isDragging = false;
    let lastPosX, lastPosY;

    fc.on('mouse:down', function (opt) {
      const evt = opt.e;
      if (fabricRef.current._activeTool === 'pan' || evt.altKey) {
        isDragging = true;
        fc.selection = false;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        fc.defaultCursor = 'grabbing';
      }
    });

    fc.on('mouse:move', function (opt) {
      if (isDragging) {
        const e = opt.e;
        const vpt = fc.viewportTransform;
        vpt[4] += e.clientX - lastPosX;
        vpt[5] += e.clientY - lastPosY;

        // Prevent infinite scrolling upwards and downwards
        vpt[5] = Math.min(vpt[5], 200); 
        const maxScrollY = pageCountRef.current * 1064 * fc.getZoom();
        vpt[5] = Math.max(vpt[5], -maxScrollY);
        
        // Prevent infinite scrolling left/right
        const maxScrollX = 3000 * fc.getZoom();
        vpt[4] = Math.max(Math.min(vpt[4], maxScrollX), -maxScrollX);

        fc.setViewportTransform(vpt);
        lastPosX = e.clientX;
        lastPosY = e.clientY;
      }
    });

    fc.on('mouse:up', function () {
      isDragging = false;
      if (fabricRef.current._activeTool !== 'pan') {
        fc.selection = true;
        fc.defaultCursor = 'default';
      } else {
        fc.defaultCursor = 'grab';
      }
    });

    // 6. Keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObj = fc.getActiveObject();
        if (activeObj && activeObj.isEditing) return;
        const objs = fc.getActiveObjects();
        objs.forEach(obj => { if (!obj._isTemplateLine) fc.remove(obj); });
        fc.discardActiveObject();
        fc.renderAll();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        const objects = fc.getObjects().filter(o => !o._isTemplateLine);
        if (objects.length > 0) { fc.remove(objects[objects.length - 1]); fc.renderAll(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // 7. Resize
    const handleResize = () => {
      fc.setDimensions({ width: window.innerWidth, height: window.innerHeight });
      fc.renderAll();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
      socketRef.current.disconnect();
      fc.dispose();
      clearTimeout(saveTimeout);
    };
  }, [boardId, initCanvas, user.token, user.name]);

  useEffect(() => {
    if (fabricRef.current) fabricRef.current._activeTool = activeTool;
  }, [activeTool]);

  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.backgroundColor = BACKGROUNDS[bgMode] || '#F5F5F5';
      fabricRef.current.renderAll();
    }
  }, [bgMode]);

  return (
    <div className="absolute inset-0 z-0">
      <canvas ref={canvasRef} id="drawixa-canvas" />
    </div>
  );
}
