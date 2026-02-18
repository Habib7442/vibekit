import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ChevronLeft, Cloud, Smartphone, Globe, Copy, Code2, Download, Tablet } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ReadOnlyPreview } from '@/components/studio/ReadOnlyPreview';
import { CopyCodeButton } from '@/components/studio/CopyCodeButton';
import { DownloadCodeButton } from '@/components/studio/DownloadCodeButton';
import { DeleteActions } from '@/components/studio/DeleteActions';

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
          <div className="shrink-0 min-h-[4rem] border-b border-white/[0.04] bg-[#0A0A0F]/50 flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-3 md:py-0 gap-3">
             <div className="flex items-center gap-3 overflow-hidden">
                <Link href="/studio/generations" className="shrink-0 p-2 rounded-full hover:bg-white/5 transition-colors text-zinc-500 hover:text-white">
                   <ChevronLeft size={18} />
                </Link>
                <div className="flex flex-col md:flex-row md:items-center gap-2 overflow-hidden">
                  <h1 className="text-xs md:text-sm font-bold uppercase tracking-widest truncate max-w-[200px] md:max-w-md">{canvas.name}</h1>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-tighter whitespace-nowrap">Visual Art</span>
                    {isOwner && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border whitespace-nowrap",
                        canvas.is_public ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                      )}>
                        {canvas.is_public ? 'Public' : 'Private'}
                      </span>
                    )}
                  </div>
                </div>
             </div>
             
              <div className="flex items-center gap-2 ml-12 md:ml-0">
                 {isOwner && (
                   <DeleteActions type="canvas" id={id} className="mr-2" redirectAfterDelete={true} />
                 )}
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 rounded-lg border border-zinc-800/30">
                    <Cloud size={12} className="text-emerald-500" />
                    <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Saved</span>
                 </div>
              </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-12 scrollbar-none pb-20">
             {!images || images.length === 0 ? (
                <div className="flex items-center justify-center h-full text-zinc-600 uppercase text-xs font-black tracking-widest">No images found</div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
                   {images.map((img) => (
                     <div key={img.id} className="group relative bg-[#0C0C11] rounded-[24px] md:rounded-[32px] overflow-hidden border border-white/[0.05] shadow-2xl transition-all hover:border-white/10">
                        <img 
                          src={img.image_url} 
                          alt={img.prompt} 
                          className="w-full h-auto object-contain opacity-95 group-hover:opacity-100 transition-opacity"
                        />
                        
                        {/* Download button - Mobile (Persistent) */}
                        <div className="absolute top-4 right-4 md:hidden">
                           <a href={img.image_url} download target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-xl">
                              <Download size={16} />
                           </a>
                        </div>
                        
                        {img.prompt && (
                          <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 bg-gradient-to-t from-black duration-300 md:opacity-0 md:group-hover:opacity-100 transition-all">
                             <p className="text-[10px] text-zinc-400 line-clamp-2 md:line-clamp-3 leading-relaxed font-medium italic">"{img.prompt}"</p>
                             <div className="mt-4 hidden md:flex gap-2">
                                 <a href={img.image_url} download target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all">
                                    <Download size={14} />
                                 </a>
                                 {isOwner && (
                                   <DeleteActions type="image" id={img.id} canvasId={id} />
                                 )}
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
        <div className="shrink-0 min-h-[4rem] border-b border-white/[0.04] bg-[#0A0A0F]/50 flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-3 md:py-0 gap-3">
           <div className="flex items-center gap-3 overflow-hidden">
              <Link href="/studio/generations" className="shrink-0 p-2 rounded-full hover:bg-white/5 transition-colors text-zinc-500 hover:text-white">
                 <ChevronLeft size={18} />
              </Link>
              <div className="flex flex-col md:flex-row md:items-center gap-2 overflow-hidden">
                <h1 className="text-xs md:text-sm font-bold uppercase tracking-widest truncate max-w-[200px] md:max-w-md">{canvas.name}</h1>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border whitespace-nowrap",
                    canvas.type === 'app' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : 
                    canvas.type === 'component' ? "bg-violet-500/10 border-violet-500/20 text-violet-400" :
                    "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  )}>
                    {canvas.type === 'app' ? 'App UI' : canvas.type === 'component' ? 'Component' : 'Landing Page'}
                  </span>
                  {isOwner && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border whitespace-nowrap",
                      canvas.is_public ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                    )}>
                      {canvas.is_public ? 'Public' : 'Private'}
                    </span>
                  )}
                </div>
              </div>
           </div>
          
           <div className="flex items-center gap-2 ml-12 md:ml-0">
              {isOwner && (
                <DeleteActions type="canvas" id={id} className="mr-2" redirectAfterDelete={true} />
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 rounded-lg border border-zinc-800/30">
                 <Cloud size={12} className="text-emerald-500" />
                 <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Saved</span>
              </div>
           </div>
        </div>

        {!screens || screens.length === 0 ? (
           <div className="flex-1 flex items-center justify-center text-zinc-600 uppercase text-xs font-black tracking-widest italic">This canvas has no screens.</div>
        ) : (
           <div className="flex-1 overflow-y-auto px-4 py-8 md:p-12 scrollbar-none pb-20 bg-[#050505]">
              <div className="flex flex-col gap-12 md:gap-20 max-w-7xl mx-auto w-full">
                 {screens.map((screen) => (
                    <div key={screen.id} className="flex flex-col gap-6 w-full">
                      <div className="flex items-center justify-between bg-zinc-900/40 p-4 rounded-2xl border border-white/[0.04] backdrop-blur-sm">
                         <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
                               {canvas.type === 'app' ? <Smartphone size={16} className="text-cyan-400" /> : canvas.type === 'web' ? <Globe size={16} className="text-amber-400" /> : <Tablet size={16} className="text-violet-400" />}
                            </div>
                            <h2 className="text-[11px] md:text-sm font-bold uppercase tracking-widest text-zinc-100">{screen.name}</h2>
                         </div>
                          <div className="flex items-center gap-3">
                            <DownloadCodeButton code={screen.code} fileName={screen.name} mode={canvas.type as any} />
                            <CopyCodeButton code={screen.code} />
                         </div>
                      </div>
                      <div className={cn(
                         "relative flex justify-center w-full transition-all duration-500",
                         canvas.type === 'app' ? "bg-[#080810] py-12 rounded-[2.5rem] md:rounded-[4rem] border border-white/[0.05] shadow-2xl" : 
                         canvas.type === 'web' ? "bg-[#080810] py-12 md:py-24 lg:py-32 rounded-[2.5rem] md:rounded-[4rem] border border-white/[0.05] shadow-2xl" :
                         "bg-[#080810] py-12 md:py-20 lg:py-24 rounded-[2.5rem] md:rounded-[4rem] border border-white/[0.05] shadow-2xl"
                      )}>
                         {canvas.type === 'app' ? (
                           <div className="relative w-full max-w-[390px] rounded-[3.2rem] border-[4px] border-zinc-800 bg-black overflow-hidden shadow-[0_0_80px_-10px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.05)] scale-95 md:scale-100 origin-center transition-all">
                             {/* Phone Notch */}
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-[120px] h-[30px] bg-black rounded-b-2xl flex items-center justify-center">
                               <div className="w-[60px] h-[5px] bg-zinc-800/80 rounded-full" />
                             </div>
                             
                             <div className="h-[844px] overflow-y-auto scrollbar-none">
                               <ReadOnlyPreview code={screen.code} type={canvas.type as any} />
                             </div>
                             
                             {/* Home Indicator */}
                             <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 w-[130px] h-[5px] bg-white/20 rounded-full" />
                           </div>
                         ) : canvas.type === 'component' ? (
                           <div className="w-full max-w-4xl px-4 md:px-0 transition-all">
                              {/* iPad Mockup */}
                              <div className="relative mx-auto w-full max-w-[820px] rounded-[3rem] border-[12px] border-zinc-900 bg-black overflow-hidden shadow-2xl overflow-hidden aspect-[4/3]">
                                 <div className="absolute top-1/2 -right-1 w-1 h-12 bg-zinc-800 rounded-l-md" />
                                 <div className="w-full h-full overflow-y-auto scrollbar-none bg-[#050505]">
                                    <ReadOnlyPreview code={screen.code} type="component" />
                                 </div>
                              </div>
                           </div>
                         ) : (
                           <div className="w-full max-w-6xl px-4 md:px-0 transition-all">
                              {/* Laptop Mockup */}
                              <div className="relative group/laptop">
                                 {/* Screen Top/Frame */}
                                 <div className="relative w-full aspect-[16/10] bg-black rounded-t-2xl border-[8px] md:border-[12px] border-zinc-800 overflow-hidden shadow-2xl">
                                    {/* Browser Bar */}
                                    <div className="h-8 bg-zinc-900 border-b border-white/5 flex items-center px-4 gap-2 shrink-0">
                                       <div className="flex gap-1.5">
                                          <div className="w-2 h-2 rounded-full bg-red-500/40" />
                                          <div className="w-2 h-2 rounded-full bg-amber-500/40" />
                                          <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
                                       </div>
                                       <div className="h-4 flex-1 bg-black/40 rounded-full border border-white/5 flex items-center px-3">
                                          <div className="w-full h-1 bg-zinc-800 rounded-full" />
                                       </div>
                                    </div>
                                    <div className="relative w-full h-[calc(100%-2rem)] overflow-y-auto scrollbar-none bg-[#050505]">
                                       <div className="scale-[1] origin-top w-full">
                                          <ReadOnlyPreview code={screen.code} type={canvas.type as any} />
                                       </div>
                                    </div>
                                 </div>
                                 {/* Laptop Base */}
                                 <div className="relative h-3 md:h-5 bg-zinc-800 w-[105%] -left-[2.5%] rounded-b-xl border-t border-zinc-700/50 shadow-2xl mx-auto flex justify-center">
                                    <div className="w-16 h-1 bg-zinc-900/50 rounded-full mt-1" />
                                 </div>
                              </div>
                           </div>
                         )}
                         
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}
     </div>
   );
}
