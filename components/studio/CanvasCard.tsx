'use client';

import { ReadOnlyPreview } from './ReadOnlyPreview';
import { Smartphone, Globe, ImageIcon, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { DeleteActions } from './DeleteActions';
import { PrivacyToggle } from './PrivacyToggle';

interface CanvasCardProps {
  canvas: any;
  isOwner: boolean;
}

export function CanvasCard({ canvas, isOwner }: CanvasCardProps) {
  const firstScreenCode = canvas.screens?.[0]?.code;
  
  return (
    <Link 
      href={`/studio/generations/${canvas.id}`}
      className="group relative flex flex-col bg-[#0A0A0F]/80 border border-white/[0.04] rounded-[40px] overflow-hidden hover:border-white/10 transition-all hover:bg-[#0C0C14] hover:shadow-2xl hover:shadow-black/60"
    >
      {/* Dynamic Preview Area */}
      <div className="relative aspect-[3/4] bg-[#050505] overflow-hidden flex items-center justify-center p-6">
          {canvas.type === 'visual' && canvas.images?.[0]?.image_url ? (
             <img 
               src={canvas.images[0].image_url} 
               alt={canvas.name}
               className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
             />
          ) : canvas.type === 'app' && firstScreenCode ? (
            <div className="relative w-full h-full scale-[0.6] origin-top md:scale-[0.55] lg:scale-[0.6] transition-transform duration-500 group-hover:scale-[0.62]">
               {/* Mobile Frame Style */}
               <div className="relative w-[390px] h-[844px] mx-auto rounded-[3.5rem] border-[8px] border-zinc-800 bg-black overflow-hidden shadow-2xl">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-[120px] h-7 bg-black rounded-b-2xl flex items-center justify-center">
                     <div className="w-10 h-1 bg-zinc-800 rounded-full" />
                  </div>
                  <div className="w-full h-full"><ReadOnlyPreview code={firstScreenCode} type="app" /></div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 w-32 h-1.5 bg-white/20 rounded-full" />
               </div>
            </div>
          ) : canvas.type === 'component' && firstScreenCode ? (
            <div className="relative w-full h-full scale-[0.6] md:scale-[0.55] origin-top transition-transform duration-500 group-hover:scale-[0.62]">
               {/* iPad / Tablet Frame */}
               <div className="relative w-[768px] h-[1024px] mx-auto rounded-[3.5rem] border-[10px] border-zinc-800 bg-black overflow-hidden shadow-3xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-3 h-3 bg-zinc-700/50 rounded-full mt-4" />
                  <div className="w-full h-full"><ReadOnlyPreview code={firstScreenCode} type="component" /></div>
                  <div className="absolute top-1/2 -right-1 w-1 h-12 bg-zinc-800 rounded-l-md" />
               </div>
            </div>
          ) : canvas.type === 'web' && firstScreenCode ? (
             <div className="w-full h-full scale-[0.45] md:scale-[0.4] origin-top mt-12 transition-transform duration-500 group-hover:scale-[0.47]">
                {/* Desktop / Laptop Frame */}
                <div className="w-[1280px] h-[800px] border-[14px] border-zinc-800 bg-black rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                   {/* Browser Title Bar */}
                   <div className="absolute top-0 inset-x-0 h-10 bg-zinc-900 border-b border-white/5 flex items-center px-6 gap-2 z-30">
                      <div className="flex gap-1.5">
                         <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                         <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                         <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                      </div>
                      <div className="ml-4 h-6 flex-1 bg-black/40 rounded-md border border-white/5" />
                   </div>
                   <div className="pt-10 w-full h-full">
                      <ReadOnlyPreview code={firstScreenCode} type="web" />
                   </div>
                </div>
             </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-20 grayscale scale-110">
               {canvas.type === 'app' ? <Smartphone size={60} /> : canvas.type === 'visual' ? <ImageIcon size={60} /> : <Globe size={60} />}
            </div>
          )}
         
         <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-transparent opacity-60" />
         
         {/* Top Actions */}
         <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
            {isOwner && (
               <>
                  <DeleteActions type="canvas" id={canvas.id} className="bg-black/40 backdrop-blur-md border-white/10" />
                  <PrivacyToggle canvasId={canvas.id} initialIsPublic={canvas.is_public} />
               </>
            )}
            <div className={cn(
               "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md",
               canvas.type === 'visual' ? "border-indigo-500/30 text-indigo-400 bg-indigo-500/10" :
               canvas.type === 'app' ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10" :
               canvas.type === 'component' ? "border-violet-500/30 text-violet-400 bg-violet-500/10" :
               "border-amber-500/30 text-amber-400 bg-amber-500/10"
            )}>
               {canvas.type}
            </div>
         </div>
      </div>

      {/* Info Area */}
      <div className="p-8">
         <h3 className="text-sm font-bold text-white mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{canvas.name}</h3>
         <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
               <div className="flex items-center gap-1.5">
                  <Calendar size={10} />
                  {new Date(canvas.created_at).toLocaleDateString()}
               </div>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400 text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
               Open Canvas <ArrowRight size={10} />
            </div>
         </div>
      </div>
    </Link>
  );
}
