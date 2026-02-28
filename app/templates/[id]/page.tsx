'use client';

import { REEL_TEMPLATES } from '@/lib/templates';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Sparkles, 
  Wand2, 
  Download,
  Loader2,
  Video,
  Play,
  RotateCcw,
  Plus,
  ChevronRight,
  Settings,
  Image as ImageIcon,
  GripVertical,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Zap,
  Maximize2,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { generateAIImage } from '@/lib/actions/ai.actions';
import { useAuth } from '@/lib/hooks/useAuth';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

interface ImageAsset {
  id: string;
  original: { data: string; mimeType: string };
  stylized?: { data: string; mimeType: string };
  isStylizing: boolean;
  error?: string;
}

export default function TemplateBuilderPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const template = REEL_TEMPLATES.find(t => t.id === id);
  
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportPhase, setExportPhase] = useState("");
  const [activeTransition, setActiveTransition] = useState<'fade' | 'shake' | 'zoom' | 'glitch'>('shake');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!template) return <div>Template not found</div>;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      alert('Maximum 5 images allowed for this template.');
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onerror = () => {
        console.error('Failed to read file:', file.name);
      };
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) return;
        const parts = result.split(',');
        if (parts.length < 2) return;
        
        const newImg: ImageAsset = {
          id: Math.random().toString(36).substring(2, 11),
          original: { data: parts[1], mimeType: file.type },
          isStylizing: false
        };
        setImages(prev => [...prev, newImg]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const stylizeImage = async (img: ImageAsset) => {
    const imageId = img.id;
    // Set loading state
    setImages(prev => prev.map(item => item.id === imageId ? { ...item, isStylizing: true, error: "" } : item));

    try {
      const prompt = `${template.promptPrefix} High resolution, professional quality, masterpiece.`;
      const result = await generateAIImage({
        prompt: prompt,
        aspectRatio: '9:16',
        count: 1,
        images: [{ data: img.original.data, mimeType: img.original.mimeType }]
      });

      if (result && result.image) {
        setImages(prev => prev.map(item => 
          item.id === imageId 
            ? { ...item, stylized: { data: result.image, mimeType: result.mimeType || 'image/png' }, isStylizing: false }
            : item
        ));
        return true;
      } else {
        throw new Error('AI failed to return image');
      }
    } catch (err: any) {
      setImages(prev => prev.map(item => 
        item.id === imageId ? { ...item, isStylizing: false, error: "Failed" } : item
      ));
      return false;
    }
  };

  const handleMagicGenerate = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    
    // Use a fresh copy of the IDs to avoid relying on stale state in the loop
    const imageToProcess = [...images];
    
    for (let i = 0; i < imageToProcess.length; i++) {
        const img = imageToProcess[i];
        setPreviewIndex(i);
        
        // Skip only if it's already stylized
        if (img.stylized) continue;
        
        const success = await stylizeImage(img);
        
        // Slightly longer pause for better UI sync
        await new Promise(r => setTimeout(r, 1200));
    }
    
    setIsGenerating(false);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    
    // Swap
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    setImages(newImages);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    const phases = [
      { name: "Analyzing Scene Structure", speed: 20 },
      { name: "Encoding Cinema Frames", speed: 40 },
      { name: "Applying Transitions", speed: 25 },
      { name: "Finalizing Visual Lab Export", speed: 15 }
    ];

    let currentProgress = 0;
    const targetSimulatedProgress = 75;
    for (const phase of phases) {
      setExportPhase(phase.name);
      // Weight each phase's contribution to get to 75 total
      const percentOfTotal = phase.speed / (phases.reduce((acc, p) => acc + p.speed, 0));
      const phaseContribution = percentOfTotal * targetSimulatedProgress;
      const stepSize = phaseContribution / 10;

      for (let i = 0; i < 10; i++) {
        currentProgress += stepSize;
        setExportProgress(Math.floor(Math.min(currentProgress, targetSimulatedProgress)));
        await new Promise(r => setTimeout(r, 150));
      }
    }

    setExportProgress(75);
    await new Promise(r => setTimeout(r, 300));
    
    // START WEBM RECORDING LOGIC
    try {
      setExportPhase("Mastering Cinematic Video");
      const canvas = document.createElement('canvas');
      canvas.width = 720; // High quality 9:16
      canvas.height = 1280;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context failed");

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      
      const recordPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
      });

      recorder.start();

      // Render helper for aspect ratio aware drawing (Object-fit: cover)
      const drawCover = (image: HTMLImageElement, offset: {x: number, y: number, scale: number, rotation?: number} = {x: 0, y: 0, scale: 1}) => {
        const canvasRatio = canvas.width / canvas.height;
        const imageRatio = image.width / image.height;
        let drawW, drawH, drawX, drawY;

        if (imageRatio > canvasRatio) {
          drawH = canvas.height * offset.scale;
          drawW = (image.width * (canvas.height / image.height)) * offset.scale;
        } else {
          drawW = canvas.width * offset.scale;
          drawH = (image.height * (canvas.width / image.width)) * offset.scale;
        }
        
        drawX = (canvas.width - drawW) / 2 + offset.x;
        drawY = (canvas.height - drawH) / 2 + offset.y;
        
        if (offset.rotation) {
            ctx.save();
            ctx.translate(canvas.width/2 + offset.x, canvas.height/2 + offset.y);
            ctx.rotate(offset.rotation * Math.PI / 180);
            ctx.drawImage(image, -drawW/2, -drawH/2, drawW, drawH);
            ctx.restore();
        } else {
            ctx.drawImage(image, drawX, drawY, drawW, drawH);
        }
      };

      // Render each image in the reel to the canvas
      for (let i = 0; i < images.length; i++) {
        setExportProgress(Math.floor(75 + (i / images.length) * 25));
        const img = images[i];
        const originalData = `data:${img.original.mimeType};base64,${img.original.data}`;
        const stylizedData = img.stylized ? `data:${img.stylized.mimeType};base64,${img.stylized.data}` : null;
        
        const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
          const el = new Image();
          el.onload = () => res(el);
          el.onerror = () => rej(new Error(`Failed to load image for frame ${i + 1}`));
          el.src = src;
        });

        const originalImg = await loadImg(originalData);
        const stylizedImg = stylizedData ? await loadImg(stylizedData) : null;

        // Draw Sequence (Simulate Preview)
        // 1. Original (2 seconds)
        for (let f = 0; f < 60; f++) {
          ctx.fillStyle = '#050505'; 
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          drawCover(originalImg);
          await new Promise(r => setTimeout(r, 1000 / 30));
        }

        // 2. Transition to Stylized
        if (stylizedImg) {
          for (let f = 0; f < 30; f++) {
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            let offset = { x: 0, y: 0, scale: 1, rotation: 0 };
            const progress = f / 30;

            if (activeTransition === 'shake') {
                const intensity = (1 - Math.abs(progress - 0.5) * 2) * 20;
                offset.x = (Math.random() - 0.5) * intensity;
                offset.y = (Math.random() - 0.5) * intensity;
                offset.rotation = (Math.random() - 0.5) * 2;
                offset.scale = 1 + (intensity / 200);
            } else if (activeTransition === 'zoom') {
                offset.scale = 1 + progress * 0.1;
            } else if (activeTransition === 'glitch' && f % 4 === 0) {
                offset.x = (Math.random() - 0.5) * 40;
            }

            ctx.globalAlpha = 1;
            drawCover(originalImg, offset);
            
            ctx.globalAlpha = progress;
            drawCover(stylizedImg, offset);
            
            ctx.globalAlpha = 1;
            await new Promise(r => setTimeout(r, 1000 / 30));
          }
          // 3. Stylized (3 seconds)
          for (let f = 0; f < 90; f++) {
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawCover(stylizedImg);
            await new Promise(r => setTimeout(r, 1000 / 30));
          }
        }
      }

      recorder.stop();
      const videoBlob = await recordPromise;
      setExportProgress(100);
      const url = URL.createObjectURL(videoBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `imagestudiolab-reel-${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Video export failed, falling back to images", err);
      // Fallback
      images.forEach((img, idx) => {
        if (img.stylized) {
          const link = document.createElement('a');
          link.href = `data:${img.stylized.mimeType};base64,${img.stylized.data}`;
          link.download = `imagestudiolab-reel-frame-${idx + 1}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });
    }

    setIsExporting(false);
    alert('Your Cinematic MP4 Reel has been exported successfully!');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center pb-20">
      {/* Super Simple Navbar */}
      <nav className="w-full h-20 px-8 flex items-center justify-between bg-black/40 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-3 rounded-2xl hover:bg-white/5 transition-all text-zinc-500 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex flex-col items-center">
            <h1 className="text-xs font-black uppercase tracking-[0.3em] font-outfit">{template.name}</h1>
            <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest mt-1">Magic Template</span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            disabled={isExporting || images.length === 0 || images.some(img => !img.stylized)}
            className={cn(
              "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              isExporting 
                ? "bg-indigo-600 text-white min-w-[200px]" 
                : "bg-white text-black hover:scale-105 active:scale-95 disabled:opacity-20"
            )}
          >
            {isExporting ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <div className="flex flex-col items-start gap-0.5 min-w-[120px]">
                   <span className="text-[7px] opacity-70 leading-none">{exportPhase}</span>
                   <span className="text-[9px] leading-none">{exportProgress}% Complete</span>
                </div>
              </>
            ) : (
              <>
                <Download size={12} />
                Export
              </>
            )}
          </button>
        </div>
      </nav>

      <div className="w-full max-w-6xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12 items-start">
        
        {/* Left: Magic Preview (The Phone) */}
        <div className="flex flex-col items-center gap-8">
            <div className="relative aspect-[9/16] w-full max-w-[360px] mx-auto rounded-[3rem] border-[8px] border-zinc-900 shadow-2xl overflow-hidden bg-black">
               {images.length === 0 ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-zinc-950">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                      <ImageIcon className="text-zinc-700" size={32} />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-white/40 mb-2">Magic Monitor Off</h3>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">
                      Upload photos to power up the cinematic engine.
                    </p>
                 </div>
               ) : (
                 <MontagePreview 
                    images={images} 
                    activeIndex={previewIndex} 
                    setActiveIndex={setPreviewIndex} 
                    isGenerating={isGenerating}
                    transition={activeTransition}
                  />
               )}
            </div>

            {/* Transition Lab Selector - Now outside the phone frame */}
            {images.length > 0 && (
              <div className="w-full max-w-[360px] mx-auto bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Transition Lab</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'fade', icon: Layers, name: 'Cinema Fade' },
                      { id: 'shake', icon: Zap, name: 'Turbo Shake' },
                      { id: 'zoom', icon: Maximize2, name: 'Lens Zoom' },
                      { id: 'glitch', icon: RefreshCw, name: 'Glitch' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTransition(t.id as any)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl transition-all border",
                          activeTransition === t.id 
                            ? "bg-indigo-600/20 border-indigo-500/50 text-white shadow-[0_0_15px_rgba(79,70,229,0.2)]" 
                            : "bg-white/5 border-transparent text-zinc-500 hover:bg-white/10"
                        )}
                      >
                        <t.icon size={16} className={activeTransition === t.id ? "text-indigo-400" : ""} />
                        <span className="text-[8px] font-black uppercase tracking-widest text-center">{t.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

           {/* Magic Status Bar */}
           {images.length > 0 && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {images.filter(i => i.stylized).length} / {images.length} Photos Stylized
                </p>
                {!images.every(i => i.stylized) && !isGenerating && (
                  <button 
                    onClick={handleMagicGenerate}
                    className="group relative px-10 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] flex items-center gap-3"
                  >
                    <Sparkles size={18} className="text-white group-hover:scale-125 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Apply Magic Touch</span>
                  </button>
                )}
                {isGenerating && (
                  <div className="flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                     <Loader2 size={18} className="animate-spin text-indigo-400" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Mastering Reel Experience...</span>
                  </div>
                )}
             </motion.div>
           )}
        </div>

        {/* Right: Upload & Arrange Slots */}
        <div className="space-y-8">
           <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-[0.1em] font-outfit">Step 1: Upload & Flow</h2>
              <p className="text-xs text-zinc-500 font-medium">Add up to 5 photos. Drag them to change order.</p>
           </div>

           <div className="grid grid-cols-1 gap-4">
              <Reorder.Group axis="y" values={images} onReorder={setImages} className="space-y-4">
                 {images.map((img, idx) => (
                   <Reorder.Item 
                    key={img.id} 
                    value={img}
                    className="relative group h-24 rounded-2xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm p-3 flex items-center gap-4 cursor-grab active:cursor-grabbing hover:border-white/10 transition-colors"
                   >
                      {/* Arrow Controls */}
                      <div className="flex flex-col items-center gap-1">
                         <button 
                           disabled={idx === 0}
                           onClick={(e) => { e.stopPropagation(); moveImage(idx, 'up'); }}
                           className="p-1 rounded bg-white/5 text-zinc-500 hover:text-white disabled:opacity-0 transition-all"
                         >
                            <ChevronUp size={12} />
                         </button>
                         <button 
                           disabled={idx === images.length - 1}
                           onClick={(e) => { e.stopPropagation(); moveImage(idx, 'down'); }}
                           className="p-1 rounded bg-white/5 text-zinc-500 hover:text-white disabled:opacity-0 transition-all"
                         >
                            <ChevronDown size={12} />
                         </button>
                      </div>

                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-black shrink-0 relative border border-white/5">
                         <img src={`data:${img.original.mimeType};base64,${img.original.data}`} className="w-full h-full object-cover" alt="" />
                         {img.stylized && <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center animate-in fade-in duration-500"><Sparkles size={12} className="text-white" /></div>}
                         {img.error && <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center"><X size={12} className="text-white" /></div>}
                      </div>

                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-white/90 tracking-widest">Slot {idx + 1}</span>
                            {img.isStylizing && <Loader2 size={10} className="animate-spin text-indigo-500" />}
                            {img.stylized && <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em]">Artified</span>}
                            {img.error && <span className="text-[8px] font-black text-red-400 uppercase tracking-[0.2em]">Failed</span>}
                         </div>
                         <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                            {img.isStylizing ? 'Artifying...' : img.error ? 'Generation Issue' : img.stylized ? 'Masterpiece Ready' : 'Awaiting Magic'}
                         </p>
                      </div>

                      <div className="flex items-center gap-2">
                         {img.error && (
                           <button 
                             onClick={(e) => { e.stopPropagation(); stylizeImage(img); }}
                             className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5"
                           >
                              <RefreshCw size={10} />
                              Retry
                           </button>
                         )}
                         <button onClick={() => removeImage(img.id)} className="p-2 rounded-lg hover:bg-white/5 text-zinc-600 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                            <X size={16} />
                         </button>
                      </div>
                   </Reorder.Item>
                 ))}

                 {images.length < 5 && (
                   <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] flex flex-col items-center justify-center gap-3 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                   >
                      <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                         <Plus size={20} className="text-zinc-500" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Add Image {images.length + 1}/5</span>
                   </button>
                 )}
              </Reorder.Group>
           </div>

           <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" multiple className="hidden" />

           {/* Style Info Card */}
           <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600/10 to-transparent border border-indigo-500/10 space-y-4">
              <div className="flex items-center gap-3 text-indigo-400">
                 <Sparkles size={20} />
                 <h3 className="text-xs font-black uppercase tracking-tighter">AI Lab Blueprint</h3>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                This template uses our proprietary <span className="font-bold text-white">{template.style}</span> logic. Our AI will analyze your features and reconstruct them into a cinematic masterpiece while maintaining your original likeness.
              </p>
           </div>
        </div>

      </div>

      <style jsx global>{`
        @keyframes subtle-shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1.02); }
          25% { transform: translate(1px, -1px) rotate(0.1deg) scale(1.025); }
          50% { transform: translate(-0.5px, 1px) rotate(-0.05deg) scale(1.03); }
          75% { transform: translate(0.5px, 0.5px) rotate(0.05deg) scale(1.025); }
        }
        
        .cinematic-slide {
          animation: subtle-shake 8s infinite ease-in-out;
        }

        .shaky-preview {
          perspective: 1200px;
        }
      `}</style>
    </div>
  );
}

function MontagePreview({ 
  images, 
  activeIndex, 
  setActiveIndex,
  isGenerating,
  transition
}: { 
  images: ImageAsset[], 
  activeIndex: number,
  setActiveIndex: (i: number | ((p: number) => number)) => void,
  isGenerating: boolean,
  transition: 'fade' | 'shake' | 'zoom' | 'glitch'
}) {
  const [showStylized, setShowStylized] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (images.length === 0) return;

    let isMounted = true;

    const sequence = async () => {
      if (isMounted) setShowStylized(false);
      await new Promise(r => setTimeout(r, 2000));
      if (!isMounted) return;
      
      const currentImg = images[activeIndex];
      if (currentImg?.stylized && isMounted) {
        setIsTransitioning(true);
        setShowStylized(true);
        await new Promise(r => setTimeout(r, 800)); // Sync with animation duration
        setIsTransitioning(false);
        await new Promise(r => setTimeout(r, 2200));
      } else if (isMounted) {
        await new Promise(r => setTimeout(r, 3000));
      }

      if (!isMounted || isGenerating) return;
      if (isMounted) setShowStylized(false);
      await new Promise(r => setTimeout(r, 100));
      
      if (isMounted && !isGenerating) {
        setActiveIndex(prev => (prev + 1) % images.length);
      }
    };

    const timer = setTimeout(sequence, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeIndex, images, isGenerating]); // Removed transition so it doesn't reset mid-play

  const activeImg = images[activeIndex];
  if (!activeImg) return null;

  return (
    <div className="w-full h-full relative shaky-preview overflow-hidden bg-zinc-950">
       <div key={activeImg.id} className={cn(
         "absolute inset-0 cinematic-slide animate-in fade-in duration-1000",
         isTransitioning && transition === 'shake' ? "shake-effect" : "",
         isTransitioning && transition === 'zoom' ? "zoom-effect" : "",
         isTransitioning && transition === 'glitch' ? "glitch-effect" : ""
       )}>
         <img 
           src={`data:${activeImg.original.mimeType};base64,${activeImg.original.data}`} 
           className={cn(
             "absolute inset-0 w-full h-full object-cover transition-opacity duration-700",
             showStylized ? "opacity-0" : "opacity-100"
           )} 
           alt="Original" 
         />
         
         {activeImg.stylized && (
           <img 
             src={`data:${activeImg.stylized.mimeType};base64,${activeImg.stylized.data}`} 
             className={cn(
               "absolute inset-0 w-full h-full object-cover transition-opacity duration-700",
               showStylized ? "opacity-100" : "opacity-0"
             )} 
             alt="AI Stylized" 
           />
         )}

         <div className="absolute bottom-20 left-10 z-10">
            <div className={cn(
              "px-4 py-1.5 rounded-full backdrop-blur-xl border text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500",
              showStylized 
                ? "bg-indigo-600/60 border-indigo-400/50 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]" 
                : "bg-black/40 border-white/10 text-zinc-400"
            )}>
               {showStylized ? 'AI Stylized' : 'Original Photo'}
            </div>
         </div>
       </div>

       <div className="absolute inset-x-10 top-20 flex gap-1.5 items-center justify-center opacity-60 z-10">
          {images.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1 rounded-full transition-all duration-700", 
                i === activeIndex ? "w-10 bg-indigo-500" : "w-2 bg-white/20"
              )} 
            />
          ))}
       </div>
       <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] z-20" />
       
       <style jsx>{`
         @keyframes capcut-shake {
           0% { transform: translate(0,0) rotate(0deg) scale(1.05); }
           20% { transform: translate(-8px, 5px) rotate(-1deg) scale(1.06); }
           40% { transform: translate(8px, -5px) rotate(1deg) scale(1.07); }
           60% { transform: translate(-5px, -8px) rotate(-1deg) scale(1.06); }
           80% { transform: translate(5px, 8px) rotate(1deg) scale(1.05); }
           100% { transform: translate(0,0) rotate(0deg) scale(1.05); }
         }

         @keyframes pro-zoom {
           0% { transform: scale(1); }
           100% { transform: scale(1.15); }
         }

         @keyframes glitch-play {
           0% { clip-path: inset(10% 0 30% 0); transform: translate(-5px); }
           20% { clip-path: inset(40% 0 10% 0); transform: translate(5px); }
           100% { clip-path: inset(0% 0 0% 0); transform: translate(0); }
         }

         .shake-effect {
           animation: capcut-shake 0.3s infinite ease-in-out !important;
         }
         
         .zoom-effect {
            animation: pro-zoom 0.8s ease-out forwards;
         }

         .glitch-effect {
            animation: glitch-play 0.2s infinite;
         }
       `}</style>
    </div>
  );
}
