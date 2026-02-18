'use client';

import { useEffect, useState } from 'react';
import { getPublicCanvasesAction } from '@/lib/actions/studio.actions';
import { Globe } from 'lucide-react';
import Link from 'next/link';
import { CanvasCard } from './CanvasCard';

export function ShowcaseGrid() {
  const [canvases, setCanvases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchShowcase() {
      try {
        const data = await getPublicCanvasesAction(12);
        
        // Ensure screens are sorted correctly for the preview
        const formattedData = (data || []).map(canvas => ({
          ...canvas,
          screens: (canvas.screens || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        }));

        setCanvases(formattedData);
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
            <div key={i} className="aspect-[3/4] rounded-[40px] bg-white/[0.03] animate-pulse border border-white/[0.05]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="py-24 px-6 bg-[#050505] border-y border-white/[0.02]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-8">
           <div className="space-y-4">
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">Community <br className="hidden md:block" /> Showcase</h2>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] max-w-md leading-relaxed">Latest generations from our top creators</p>
              <Link href="/studio/generations" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#f5e1c8] hover:text-white transition-all group">
                View All Vaults 
                <div className="w-4 h-px bg-[#f5e1c8] group-hover:w-6 transition-all" />
              </Link>
           </div>
        </div>

        {canvases.length === 0 ? (
          <div className="aspect-[21/9] rounded-[48px] bg-[#0A0A0F] border border-white/[0.03] flex flex-col items-center justify-center p-12 text-center">
             <div className="w-20 h-20 rounded-3xl bg-zinc-900 flex items-center justify-center mb-6 text-zinc-800">
                <Globe size={40} />
             </div>
             <h3 className="text-zinc-500 mb-2 font-black uppercase tracking-widest text-xs">Nothing Shared Yet</h3>
             <p className="text-zinc-700 text-xs font-bold uppercase tracking-widest max-w-[240px]">Go to your vault and toggle a project to "Public" to see it featured here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {canvases.map((canvas) => (
              <CanvasCard 
                key={canvas.id} 
                canvas={canvas} 
                isOwner={false} 
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
