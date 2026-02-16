import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ChevronLeft, Cloud, Smartphone, Globe, Copy, Code2, Download } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ReadOnlyPreview } from '@/components/studio/ReadOnlyPreview';
import { CopyCodeButton } from '@/components/studio/CopyCodeButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CanvasDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  // 1. Fetch User and Canvas
  const [
    { data: { user } },
    { data: canvas, error: canvasError }
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('canvases').select('*').eq('id', id).single()
  ]);

  // NOTE: Supabase RLS Policy "Canvases are viewable by owner or if public" 
  // automatically prevents unauthorized access (IDOR). If RLS fails, canvas will be null.
  if (canvasError || !canvas) {
    notFound();
  }

  const isOwner = user?.id === canvas.user_id;

  // 2. Fetch Assets based on type
  if (canvas.type === 'visual') {
     const { data: images } = await supabase
       .from('canvas_images')
       .select('*')
       .eq('canvas_id', id)
       .order('created_at', { ascending: true });

     return (
       <div className="flex-1 h-screen bg-[#050505] flex flex-col overflow-hidden">
          <div className="shrink-0 h-16 border-b border-white/[0.04] bg-[#0A0A0F]/50 flex items-center justify-between px-6">
             <div className="flex items-center gap-4">
                <Link href="/studio/generations" className="p-2 rounded-full hover:bg-white/5 transition-colors text-zinc-500 hover:text-white">
                   <ChevronLeft size={18} />
                </Link>
                <h1 className="text-sm font-bold uppercase tracking-widest">{canvas.name}</h1>
                 <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-tighter">Visual Art</span>
                 {isOwner && (
                   <span className={cn(
                     "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border",
                     canvas.is_public ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                   )}>
                     {canvas.is_public ? 'Public' : 'Private'}
                   </span>
                 )}
              </div>
           </div>
          
          <div className="flex-1 overflow-y-auto p-6 md:p-12 scrollbar-none">
             {!images || images.length === 0 ? (
               <div className="flex items-center justify-center h-full text-zinc-600 uppercase text-xs font-black tracking-widest">No images found</div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                  {images.map((img) => (
                    <div key={img.id} className="group relative bg-[#0C0C11] rounded-[32px] overflow-hidden border border-white/[0.05] shadow-2xl transition-all hover:border-white/10">
                       <img 
                         src={img.image_url} 
                         alt={img.prompt} 
                         className="w-full aspect-square object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                       />
                       {img.prompt && (
                         <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            <p className="text-[10px] text-zinc-400 line-clamp-3 leading-relaxed font-medium italic">"{img.prompt}"</p>
                            <div className="mt-4 flex gap-2">
                               <a href={img.image_url} download target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all">
                                  <Download size={14} />
                               </a>
                            </div>
                         </div>
                       )}
                    </div>
                  ))}
               </div>
             )}
          </div>
       </div>
     );
  }

  // APP / WEB / COMPONENT Mode
  const { data: screens } = await supabase
    .from('canvas_screens')
    .select('*')
    .eq('canvas_id', id)
    .order('order', { ascending: true });

  return (
    <div className="flex-1 h-screen bg-[#050505] flex flex-col overflow-hidden">
       {/* Details Header */}
       <div className="shrink-0 h-16 border-b border-white/[0.04] bg-[#0A0A0F]/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
             <Link href="/studio/generations" className="p-2 rounded-full hover:bg-white/5 transition-colors text-zinc-500 hover:text-white">
                <ChevronLeft size={18} />
             </Link>
             <h1 className="text-sm font-bold uppercase tracking-widest">{canvas.name}</h1>
             <span className={cn(
               "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border",
               canvas.type === 'app' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : 
               canvas.type === 'component' ? "bg-violet-500/10 border-violet-500/20 text-violet-400" :
               "bg-amber-500/10 border-amber-500/20 text-amber-400"
             )}>
                 {canvas.type === 'app' ? 'App UI' : canvas.type === 'component' ? 'Component' : 'Landing Page'}
              </span>
              {isOwner && (
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border",
                  canvas.is_public ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                )}>
                  {canvas.is_public ? 'Public' : 'Private'}
                </span>
              )}
           </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 rounded-lg border border-zinc-800/30">
                <Cloud size={12} className="text-emerald-500" />
                <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Cloud Saved</span>
             </div>
          </div>
       </div>

       {!screens || screens.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-zinc-600 uppercase text-xs font-black tracking-widest italic">This canvas has no screens.</div>
       ) : (
          <div className="flex-1 overflow-y-auto p-6 md:p-12 scrollbar-none">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-7xl mx-auto">
                {screens.map((screen) => (
                   <div key={screen.id} className="flex flex-col gap-6 group">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                              {canvas.type === 'app' ? <Smartphone size={14} className="text-cyan-400" /> : <Globe size={14} className="text-amber-400" />}
                           </div>
                           <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">{screen.name}</h2>
                        </div>
                        <CopyCodeButton code={screen.code} />
                     </div>

                     <div className={cn(
                        "relative flex justify-center",
                        canvas.type === 'app' ? "bg-[#080810] py-6 rounded-[40px] border border-white/[0.05]" : "w-full aspect-video"
                     )}>
                        {canvas.type === 'app' ? (
                          <div className="relative w-[390px] rounded-[3rem] border-[3px] border-zinc-700/60 bg-black overflow-hidden shadow-[0_0_60px_-15px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.05)] my-8">
                            {/* Phone Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-[120px] h-[28px] bg-black rounded-b-2xl flex items-center justify-center">
                              <div className="w-[60px] h-[4px] bg-zinc-800 rounded-full" />
                            </div>
                            
                            <ReadOnlyPreview code={screen.code} type={canvas.type as any} />
                            
                            {/* Home Indicator */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 w-[130px] h-[5px] bg-white/20 rounded-full" />
                          </div>
                        ) : (
                          <ReadOnlyPreview code={screen.code} type={canvas.type as any} />
                        )}
                        
                        {/* Hover Overlay Actions */}
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-4 pointer-events-none rounded-[40px]">
                           <div className="px-6 py-2.5 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest">Live Preview</div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
       )}
    </div>
  );
}
