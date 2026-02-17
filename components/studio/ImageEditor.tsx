'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Sparkles,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// We'll import types only
import type { Canvas, IText, FabricImage } from 'fabric';

interface ImageEditorProps {
  initialImage: string; // base64
  mimeType: string;
  onClose: () => void;
  onSave?: (dataUrl: string) => void;
}

export function ImageEditor({ initialImage, mimeType, onClose, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<{
    Canvas: typeof Canvas;
    IText: typeof IText;
    FabricImage: typeof FabricImage;
  } | null>(null);
  const fabricCanvas = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'shapes' | 'editorial'>('editorial');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const initFabric = async () => {
      // Dynamic import to avoid SSR issues with 'window'
      const fabric = await import('fabric');
      fabricRef.current = {
        Canvas: fabric.Canvas,
        IText: fabric.IText,
        FabricImage: fabric.FabricImage
      };

      // Initialize Canvas
      const canvas = new fabric.Canvas(canvasRef.current!, {
        width: (containerRef.current?.clientWidth || 800) - 40,
        height: (containerRef.current?.clientHeight || 600) - 100,
        backgroundColor: '#000000',
      });

      fabricCanvas.current = canvas;

      try {
        const img = await fabric.FabricImage.fromURL(`data:${mimeType};base64,${initialImage}`);
        
        const canvasWidth = canvas.width || 800;
        const canvasHeight = canvas.height || 600;
        
        const scaleX = canvasWidth / (img.width || 1);
        const scaleY = canvasHeight / (img.height || 1);
        const scale = Math.min(scaleX, scaleY);

        img.set({
          scaleX: scale,
          scaleY: scale,
          left: (canvasWidth - (img.width || 0) * scale) / 2,
          top: (canvasHeight - (img.height || 0) * scale) / 2,
          selectable: false,
          evented: false,
        });

        canvas.add(img);
        canvas.sendObjectToBack(img);
        canvas.renderAll();
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load image:', err);
      }
    };

    initFabric();

    const handleResize = () => {
      if (containerRef.current && fabricCanvas.current) {
        fabricCanvas.current.setDimensions({
          width: containerRef.current.clientWidth - 40,
          height: containerRef.current.clientHeight - 100,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      fabricCanvas.current?.dispose();
    };
  }, [initialImage, mimeType]);

  const addText = (text: string, options: any = {}) => {
    if (!fabricCanvas.current || !fabricRef.current) return;
    const itext = new fabricRef.current.IText(text, {
      left: 100,
      top: 100,
      fontFamily: 'Inter, sans-serif',
      fontSize: 40,
      fill: '#ffffff',
      fontWeight: 'bold',
      ...options
    });
    fabricCanvas.current.add(itext);
    fabricCanvas.current.setActiveObject(itext);
    fabricCanvas.current.renderAll();
  };

  const addEditorialHeader = (type: 'vogue' | 'minimal' | 'bold' | 'parisian' | 'luxury') => {
    if (!fabricCanvas.current || !fabricRef.current) return;
    const { IText: FabricIText } = fabricRef.current;
    
    fabricCanvas.current.getObjects().forEach(obj => {
      if ((obj as any).data?.isEditorial) fabricCanvas.current?.remove(obj);
    });

    const canvasWidth = fabricCanvas.current.width || 800;
    const canvasHeight = fabricCanvas.current.height || 600;

    if (type === 'vogue') {
      const vogue = new FabricIText('VOGUE', {
        left: canvasWidth / 2,
        top: 80,
        originX: 'center',
        fontFamily: 'serif',
        fontSize: 120,
        fill: '#ffffff',
        fontWeight: 'bold',
        charSpacing: 200,
        data: { isEditorial: true }
      } as any);
      fabricCanvas.current.add(vogue);
    } else if (type === 'minimal') {
       const title = new FabricIText('AUTUMN / WINTER 24', {
        left: canvasWidth / 2,
        top: 50,
        originX: 'center',
        fontFamily: 'sans-serif',
        fontSize: 12,
        fill: '#ffffff',
        fontWeight: 'bold',
        charSpacing: 500,
        data: { isEditorial: true }
      } as any);
      fabricCanvas.current.add(title);
    } else if (type === 'bold') {
      const brand = new FabricIText('PRO\nSTUDIO', {
        left: 40,
        top: 40,
        fontFamily: 'sans-serif',
        fontSize: 80,
        fill: '#ffffff',
        fontWeight: 'bold',
        lineHeight: 0.8,
        data: { isEditorial: true }
      } as any);
      fabricCanvas.current.add(brand);
    } else if (type === 'parisian') {
      const text = new FabricIText('Saint Laurent', {
        left: canvasWidth / 2,
        top: canvasHeight - 100,
        originX: 'center',
        fontFamily: 'serif',
        fontSize: 40,
        fill: '#ffffff',
        fontStyle: 'italic',
        data: { isEditorial: true }
      } as any);
      fabricCanvas.current.add(text);
    } else if (type === 'luxury') {
       const group = new FabricIText('ÉDITION LIMITÉE', {
        left: canvasWidth / 2,
        top: 40,
        originX: 'center',
        fontFamily: 'sans-serif',
        fontSize: 10,
        fill: '#ffffff',
        fontWeight: '300',
        charSpacing: 800,
        data: { isEditorial: true }
      } as any);
      fabricCanvas.current.add(group);
    }

    fabricCanvas.current.renderAll();
  };

  const deleteSelected = () => {
    const active = fabricCanvas.current?.getActiveObject();
    if (active) fabricCanvas.current?.remove(active);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-[#050505] flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-300">
      {/* Sidebar Toolset */}
      <div className="w-full md:w-80 h-auto md:h-full bg-[#0A0A0F] border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <Sparkles size={18} />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Creative Studio</h2>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setActiveTab('editorial')}
              className={cn(
                "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'editorial' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Editorial
            </button>
            <button 
              onClick={() => setActiveTab('text')}
              className={cn(
                "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'text' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Typography
            </button>
            <button 
              onClick={() => setActiveTab('shapes')}
              className={cn(
                "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'shapes' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Shapes
            </button>
          </div>

          {activeTab === 'editorial' && (
            <div className="space-y-4">
               <label className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Master Layouts</label>
               <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => addEditorialHeader('vogue')}
                    className="p-4 rounded-2xl bg-zinc-900 border border-white/5 hover:border-indigo-500/50 transition-all text-left text-white group"
                  >
                    <p className="text-xl font-serif font-black tracking-[0.2em] mb-1 opacity-50 group-hover:opacity-100">VOGUE</p>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest">High-Fashion Identity</p>
                  </button>
                  <button 
                    onClick={() => addEditorialHeader('minimal')}
                    className="p-4 rounded-2xl bg-zinc-900 border border-white/5 hover:border-indigo-500/50 transition-all text-left text-white group"
                  >
                    <p className="text-xs font-black tracking-[0.5em] mb-2 opacity-50 group-hover:opacity-100 uppercase">Minimalist Studio</p>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Modern & Clean Look</p>
                  </button>
                  <button 
                    onClick={() => addEditorialHeader('parisian')}
                    className="p-4 rounded-2xl bg-zinc-900 border border-white/5 hover:border-indigo-500/50 transition-all text-left text-white group"
                  >
                    <p className="text-xl font-serif italic mb-1 opacity-50 group-hover:opacity-100">Parisian Shop</p>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest">European High-Street</p>
                  </button>
                  <button 
                    onClick={() => addEditorialHeader('luxury')}
                    className="p-4 rounded-2xl bg-zinc-900 border border-white/5 hover:border-indigo-500/50 transition-all text-left text-white group"
                  >
                    <p className="text-[10px] font-light tracking-[0.8em] mb-1 opacity-50 group-hover:opacity-100 uppercase">Quiet Luxury</p>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Ultra-Clean Aesthetic</p>
                  </button>
               </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
               <label className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Text Presets</label>
               <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => addText('HEADLINE')} className="p-3 bg-zinc-900 rounded-xl text-left hover:bg-zinc-800 transition-colors">
                    <span className="text-lg font-black text-white uppercase tracking-tighter">Big Headline</span>
                  </button>
                  <button onClick={() => addText('The subheader text details...', { fontSize: 20, fontWeight: '400' })} className="p-3 bg-zinc-900 rounded-xl text-left hover:bg-zinc-800 transition-colors">
                    <span className="text-sm text-zinc-400">Smaller Subheader</span>
                  </button>
               </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 space-y-3">
           <button onClick={deleteSelected} className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
              <Trash2 size={14} /> Clear Selected
           </button>
           <button 
            onClick={() => {
              const dataUrl = fabricCanvas.current?.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
              if (dataUrl && onSave) onSave(dataUrl);
              onClose();
            }}
             className="w-full py-4 rounded-xl bg-white text-black text-[11px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5"
           >
              Export & Save
           </button>
        </div>
      </div>

      {/* Editor Main Canvas */}
      <div ref={containerRef} className="flex-1 bg-[#050505] relative flex items-center justify-center p-10">
         {!isLoaded && (
           <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#050505] z-10">
              <div className="w-12 h-12 rounded-2xl border-2 border-indigo-600 border-t-transparent animate-spin" />
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Preparing Content</p>
           </div>
         )}
         <canvas ref={canvasRef} className="shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] rounded-xl" />
      </div>
    </div>
  );
}
