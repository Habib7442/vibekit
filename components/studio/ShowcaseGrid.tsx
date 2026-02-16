'use client';

import { useEffect, useState } from 'react';
import { getPublicCanvasesAction } from '@/lib/actions/studio.actions';
import { Smartphone, Globe, ImageIcon, User } from 'lucide-react';
import { ReadOnlyPreview } from './ReadOnlyPreview';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function ShowcaseGrid() {
  const [canvases, setCanvases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchShowcase() {
      try {
        const data = await getPublicCanvasesAction(12);
        setCanvases(data || []);
      } catch (err) {
        console.error('Showcase fetch failed:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchShowcase();
  }, []);

  if (isLoading) {
    return (
      <div className="py-24 px-6 bg-[#050505]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-[32px] bg-white/[0.03] animate-pulse border border-white/[0.05]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="py-24 px-6 bg-[#050505] border-y border-white/[0.02]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
           <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Community Showcase</h2>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Latest generations from our top creators</p>
           </div>
           <Link href="/studio/generations" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">View All Vaults →</Link>
        </div>

        {canvases.length === 0 ? (
          <div className="aspect-[21/9] rounded-[48px] bg-[#0A0A0F] border border-white/[0.03] flex flex-col items-center justify-center p-12 text-center">
             <div className="w-20 h-20 rounded-3xl bg-zinc-900 flex items-center justify-center mb-6 text-zinc-800">
                <Globe size={40} />
             </div>
             <h3 className="text-zinc-500 mb-2 font-black uppercase tracking-widest text-xs">Nothing Shared Yet</h3>             <p className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest max-w-[240px]">Go to your vault and toggle a project to "Public" to see it featured here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {canvases.map((canvas) => {
              const firstScreen = canvas.screens?.[0];
              const firstImage = canvas.images?.[0];
              
              return (
                <div key={canvas.id} className="group cursor-pointer">
                  {/* Dribbble Style Card */}
                  <Link href={`/studio/generations/${canvas.id}`} className="block">
                    <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden bg-[#0C0C12] border border-white/[0.05] group-hover:border-white/10 transition-all shadow-xl hover:shadow-2xl hover:shadow-black/60">
                       
                       {/* Preview Container with Scaling */}
                       <div className="absolute inset-0 flex items-center justify-center p-6 bg-[#08080C]">
                          {canvas.type === 'visual' && firstImage ? (
                            <img 
                              src={firstImage.image_url} 
                              alt={canvas.name}
                              className="w-full h-full object-cover object-top rounded-xl grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
                            />
                          ) : canvas.type === 'app' && firstScreen ? (
                            <div className="w-full h-full relative origin-center" style={{ transform: 'scale(0.35)' }}>
                               {/* Mini Phone Frame */}
                               <div className="relative w-[390px] h-[844px] rounded-[3rem] border-[4px] border-zinc-700/60 bg-black overflow-hidden shadow-2xl">
                                 <ReadOnlyPreview code={firstScreen.code} type="app" />
                               </div>
                            </div>
                          ) : (canvas.type === 'web' || canvas.type === 'component') && firstScreen ? (
                            <div className="w-full h-full relative origin-center" style={{ transform: 'scale(0.4)' }}>
                               <div className="w-[1000px] h-full rounded-2xl border-[2px] border-zinc-800 bg-[#050505] overflow-hidden shadow-2xl">
                                 <ReadOnlyPreview code={firstScreen.code} type={canvas.type as any} />
                               </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-4 text-zinc-800">
                               <ImageIcon size={40} />
                               <span className="text-[10px] font-black uppercase tracking-widest">No Preview</span>
                            </div>
                          )}
                       </div>

                       {/* Type Badge */}
                       <div className="absolute top-4 left-4 z-10">
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border backdrop-blur-md",
                            canvas.type === 'visual' ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" :
                            canvas.type === 'app' ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" :
                            "bg-amber-500/10 border-amber-500/30 text-amber-500"
                          )}>
                            {canvas.type}
                          </div>
                       </div>

                       {/* Hover Info Overlay */}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-end p-8">
                          <div className="px-6 py-2 rounded-full bg-white text-black text-[9px] font-black uppercase tracking-widest translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-xl">
                            View Project
                          </div>
                       </div>
                    </div>
                  </Link>

                  {/* Artifact Info / Dribbble Metadata */}
                  <div className="mt-5 flex items-center justify-between px-2">
                     <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center">
                           <User size={10} className="text-zinc-500" />
                        </div>
                        <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-tight line-clamp-1">{canvas.name}</h3>
                     </div>
                     <div className="flex items-center gap-3 text-zinc-600">
                        <div className="flex items-center gap-1">
                           <div className="w-1 h-1 rounded-full bg-zinc-700" />
                           <span className="text-[9px] font-black tracking-tighter uppercase opacity-50">Studio</span>
                        </div>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
