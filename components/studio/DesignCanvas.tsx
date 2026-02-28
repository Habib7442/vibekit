'use client';

import { useEffect, useRef, useState } from 'react';
import { useImageChatStore, GeneratedImage } from '@/lib/store/useImageChatStore';
import { 
  Download, 
  Trash2, 
  Maximize2, 
  X, 
  Loader2, 
  Cloud, 
  Check, 
  Palette,
  MousePointer2,
  Hand,
  ZoomIn,
  ZoomOut,
  Type,
  LayoutTemplate
} from 'lucide-react';
import { saveCanvasAction, uploadImageToStudio } from '@/lib/actions/studio.actions';
import { cn } from '@/lib/utils';
import type { Canvas, FabricImage, IText } from 'fabric';

export function DesignCanvas() {
  const { 
    galleryImages, 
    updateGalleryImage, 
    removeGalleryImage, 
    savedCanvasId, 
    setSavedCanvasId 
  } = useImageChatStore();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvas = useRef<Canvas | null>(null);
  const fabricRef = useRef<any>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [mode, setMode] = useState<'select' | 'pan'>('select');
  const [zoom, setZoom] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const initFabric = async () => {
      const fabric = await import('fabric');
      fabricRef.current = fabric;

      const canvas = new fabric.Canvas(canvasRef.current!, {
        width: containerRef.current?.clientWidth || 800,
        height: containerRef.current?.clientHeight || 600,
        backgroundColor: '#050505',
        preserveObjectStacking: true,
      });

      fabricCanvas.current = canvas;

      // Enable Panning
      let isDragging = false;
      let lastPosX = 0;
      let lastPosY = 0;

      canvas.on('mouse:down', function(opt) {
        const evt = opt.e as MouseEvent;
        if (getMode() === 'pan' || evt.altKey) {
          isDragging = true;
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
          canvas.selection = false;
        }
      });

      canvas.on('mouse:move', function(opt) {
        if (isDragging) {
          const e = opt.e as MouseEvent;
          const vpt = canvas.viewportTransform!;
          vpt[4] += e.clientX - lastPosX;
          vpt[5] += e.clientY - lastPosY;
          canvas.requestRenderAll();
          lastPosX = e.clientX;
          lastPosY = e.clientY;
        }
      });

      canvas.on('mouse:up', function() {
        canvas.setViewportTransform(canvas.viewportTransform!);
        isDragging = false;
        canvas.selection = getMode() === 'select';
      });

      // Enable Zooming
      canvas.on('mouse:wheel', function(opt) {
        const delta = opt.e.deltaY;
        let zoomVal = canvas.getZoom();
        zoomVal *= 0.999 ** delta;
        if (zoomVal > 20) zoomVal = 20;
        if (zoomVal < 0.01) zoomVal = 0.01;
        
        // Fabric v7 Point handling
        const point = new (fabricRef.current as any).Point(opt.e.offsetX, opt.e.offsetY);
        canvas.zoomToPoint(point, zoomVal);
        
        setZoom(zoomVal);
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });

      setIsLoaded(true);
    };

    initFabric();

    const handleResize = () => {
      if (containerRef.current && fabricCanvas.current) {
        fabricCanvas.current.setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Delete selected objects with Delete or Backspace key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fabricCanvas.current) return;
      // Don't delete if user is typing inside a text element
      const activeObj = fabricCanvas.current.getActiveObject();
      if (activeObj && (activeObj as any).isEditing) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selected = fabricCanvas.current.getActiveObjects();
        if (selected.length > 0) {
          selected.forEach(obj => {
            const id = (obj as any).data?.id;
            if (id) renderedImageIds.current.delete(id);
            fabricCanvas.current!.remove(obj);
          });
          fabricCanvas.current.discardActiveObject();
          fabricCanvas.current.requestRenderAll();
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      fabricCanvas.current?.dispose();
    };
  }, []);

  const getMode = () => {
    // Helper to get latest mode inside fabric handlers
    return (window as any)._canvasMode || 'select';
  };

  useEffect(() => {
    (window as any)._canvasMode = mode;
    if (fabricCanvas.current) {
        fabricCanvas.current.defaultCursor = mode === 'pan' ? 'grab' : 'default';
        fabricCanvas.current.selection = mode === 'select';
        fabricCanvas.current.forEachObject(obj => {
            obj.selectable = mode === 'select';
        });
        fabricCanvas.current.requestRenderAll();
    }
  }, [mode]);

  // Sync gallery images to canvas
  const renderedImageIds = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (!isLoaded || !fabricCanvas.current || !fabricRef.current) return;

    const syncImages = async () => {
        const canvas = fabricCanvas.current!;
        const fabric = fabricRef.current!;

        // Collect new images to add
        const newImages: typeof galleryImages = [];
        for (const img of galleryImages) {
            if (!renderedImageIds.current.has(img.id)) {
                newImages.push(img);
            }
        }

        if (newImages.length > 0) {
            // Load all new images first
            const loadedImages: { fImg: any; id: string }[] = [];
            for (const img of newImages) {
                try {
                    const imgSrc = img.image.startsWith('http') || img.image.startsWith('data:') 
                        ? img.image 
                        : `data:${img.mimeType || 'image/png'};base64,${img.image}`;
                    const fImg = await fabric.FabricImage.fromURL(imgSrc);
                    loadedImages.push({ fImg, id: img.id });
                } catch (err) {
                    console.error('Failed to load image:', err);
                }
            }

            if (loadedImages.length > 0) {
                const scale = 0.5;
                const gap = 20; // px gap between images

                // Calculate total width of all images side by side
                const totalWidth = loadedImages.reduce((sum, { fImg }) => sum + (fImg.width! * scale), 0) + (gap * (loadedImages.length - 1));
                const maxHeight = Math.max(...loadedImages.map(({ fImg }) => fImg.height! * scale));

                // Get the center of the visible viewport
                const vpt = canvas.viewportTransform!;
                const zoom = canvas.getZoom();
                const centerX = (canvas.width! / 2 - vpt[4]) / zoom;
                const centerY = (canvas.height! / 2 - vpt[5]) / zoom;

                // Start position: left edge of the row, centered
                let currentX = centerX - (totalWidth / 2);
                const topY = centerY - (maxHeight / 2);

                for (const { fImg, id } of loadedImages) {
                    const imgWidth = fImg.width! * scale;

                    fImg.set({
                        left: currentX,
                        top: topY,
                        scaleX: scale,
                        scaleY: scale,
                        data: { id },
                        selectable: mode === 'select',
                        cornerColor: '#6366f1',
                        cornerStrokeColor: '#6366f1',
                        transparentCorners: false,
                        cornerSize: 8,
                    });

                    canvas.add(fImg);
                    renderedImageIds.current.add(id);
                    currentX += imgWidth + gap;
                }

                // Select the last added image
                canvas.setActiveObject(loadedImages[loadedImages.length - 1].fImg);
            }
        }

        // Remove deleted images
        const currentIds = new Set(galleryImages.map(i => i.id));
        canvas.getObjects().forEach(obj => {
            const id = (obj as any).data?.id;
            if (id && !currentIds.has(id)) {
                canvas.remove(obj);
                renderedImageIds.current.delete(id);
            }
        });

        canvas.requestRenderAll();
    };

    syncImages();
  }, [galleryImages, isLoaded, mode]);

  const handleSave = async () => {
    if (galleryImages.length === 0 || isSaving) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Upload each gallery image to storage and collect URLs
      const imageEntries: Record<string, { imageUrl: string; prompt?: string; aspectRatio?: string; order?: number }> = {};
      const failedUploads: string[] = [];

      for (let i = 0; i < galleryImages.length; i++) {
        const img = galleryImages[i];
        try {
          const publicUrl = await uploadImageToStudio(img.image, `canvas_${img.id}.png`);
          imageEntries[img.id] = {
            imageUrl: publicUrl,
            prompt: img.prompt,
            aspectRatio: img.aspectRatio,
            order: i,
          };
        } catch (uploadErr) {
          console.error(`[DesignCanvas] Failed to upload image ${img.id}:`, uploadErr);
          failedUploads.push(img.id);
        }
      }

      if (failedUploads.length > 0 && Object.keys(imageEntries).length === 0) {
        throw new Error('All image uploads failed');
      }

      // Save canvas with images
      const result = await saveCanvasAction({
        canvasId: savedCanvasId || undefined,
        name: galleryImages[0]?.prompt || 'Visual Canvas',
        type: 'visual',
        images: imageEntries,
      });

      if (result.canvasId) {
        setSavedCanvasId(result.canvasId);
      }

      setSaveSuccess(true);
      if (failedUploads.length > 0) {
        console.warn(`[DesignCanvas] Saved with ${failedUploads.length} failed uploads`);
        alert(`Canvas saved, but ${failedUploads.length} image(s) failed to upload. Please try saving again or check your connections.`);
      }
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      console.error('[DesignCanvas] Save failed:', err);
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const resetZoom = () => {
    if (fabricCanvas.current) {
      fabricCanvas.current.setZoom(1);
      fabricCanvas.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
      setZoom(1);
    }
  };

  return (
    <div className="w-full h-full relative group bg-[#050505] overflow-hidden">
      {/* Canvas Controls Top Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1.5 bg-[#0A0A0F]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl transition-opacity animate-in fade-in slide-in-from-top-2 duration-300">
        <button 
          onClick={() => setMode('select')}
          className={cn(
            "p-2.5 rounded-xl transition-all",
            mode === 'select' ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
          )}
          title="Select Tool (V)"
        >
          <MousePointer2 size={18} />
        </button>
        <button 
          onClick={() => setMode('pan')}
          className={cn(
            "p-2.5 rounded-xl transition-all",
            mode === 'pan' ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
          )}
          title="Pan Tool (H)"
        >
          <Hand size={18} />
        </button>
        <div className="w-px h-6 bg-white/5 mx-1" />
        <button 
          onClick={() => {
            if (fabricCanvas.current) {
                const text = new fabricRef.current.IText('Double click to edit', {
                    left: 100,
                    top: 100,
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 24,
                    fill: '#ffffff',
                });
                fabricCanvas.current.add(text);
                fabricCanvas.current.setActiveObject(text);
            }
          }}
          className="p-2.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all"
          title="Add Text"
        >
          <Type size={18} />
        </button>
        <div className="w-px h-6 bg-white/5 mx-1" />
        <div className="flex items-center gap-1 px-2">
            <button onClick={() => {
                 if (fabricCanvas.current) {
                    const newZoom = Math.min(fabricCanvas.current.getZoom() * 1.1, 20);
                    fabricCanvas.current.setZoom(newZoom);
                    setZoom(newZoom);
                 }
            }} className="p-1 text-zinc-500 hover:text-white"><ZoomIn size={14} /></button>
            <span className="text-[10px] font-black text-zinc-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => {
                 if (fabricCanvas.current) {
                    const newZoom = Math.max(fabricCanvas.current.getZoom() / 1.1, 0.01);
                    fabricCanvas.current.setZoom(newZoom);
                    setZoom(newZoom);
                 }
            }} className="p-1 text-zinc-500 hover:text-white"><ZoomOut size={14} /></button>
        </div>
      </div>

      {/* Right Sidebar Actions */}
      <div className="absolute top-20 right-4 z-50 flex flex-col gap-2">
         <button 
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-2xl border border-white/5",
                saveSuccess ? "bg-emerald-500 text-white" : "bg-[#0A0A0F]/80 backdrop-blur-xl text-zinc-400 hover:text-white"
            )}
            title="Save to Vault"
         >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : saveSuccess ? <Check size={18} /> : <Cloud size={18} />}
         </button>
         <button 
            onClick={() => {
                if (confirm('Are you sure you want to clear the canvas?')) {
                    fabricCanvas.current?.clear();
                    fabricCanvas.current?.set({ backgroundColor: '#050505' });
                    fabricCanvas.current?.renderAll();
                    renderedImageIds.current.clear();
                }
            }}
            className="w-12 h-12 rounded-2xl bg-[#0A0A0F]/80 backdrop-blur-xl border border-white/5 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-all shadow-2xl"
            title="Clear Canvas"
         >
            <Trash2 size={18} />
         </button>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair">
        <canvas ref={canvasRef} />
      </div>

      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 z-[60] bg-[#050505] flex flex-col items-center justify-center gap-4">
           <div className="w-12 h-12 rounded-2xl border-2 border-indigo-600 border-t-transparent animate-spin" />
           <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Initializing Creative Space</p>
        </div>
      )}

      {/* Footer Info */}
      <div className="absolute bottom-4 left-6 z-50 pointer-events-none">
         <div className="flex items-center gap-3 opacity-40">
            <Palette size={14} className="text-indigo-400" />
            <span className="text-[10px] text-white font-black uppercase tracking-widest">Infinite Design Engine v1.0</span>
         </div>
      </div>
    </div>
  );
}
