import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ChevronLeft, Cloud, Smartphone, Globe, Copy, Code2, Download } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ReadOnlyPreview } from '@/components/studio/ReadOnlyPreview';
import { CopyCodeButton } from '@/components/studio/CopyCodeButton';
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
           <div className="flex-1 overflow-y-auto p-4 md:p-12 scrollbar-none pb-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-7xl mx-auto">
                 {screens.map((screen) => (
                    <div key={screen.id} className="flex flex-col gap-4 md:gap-6">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                               {canvas.type === 'app' ? <Smartphone size={14} className="text-cyan-400" /> : <Globe size={14} className="text-amber-400" />}
                            </div>
                            <h2 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-400 truncate">{screen.name}</h2>
                         </div>
                          <div className="flex items-center gap-2">
                            <button 
                               onClick={() => {
                                 const blob = new Blob([screen.code], { type: 'text/html' });
                                 const url = URL.createObjectURL(blob);
                                 const a = document.createElement('a');
                                 a.href = url;
                                 a.download = `${screen.name.toLowerCase().replace(/\s+/g, '-')}.html`;
                                 a.click();
                                 URL.revokeObjectURL(url);
                               }}
                               className="p-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                               title="Download HTML"
                            >
                               <Download size={12} />
                            </button>
                            <CopyCodeButton code={screen.code} />
                         </div>
                      </div>
                      <div className={cn(
                         "relative flex justify-center w-full",
                         canvas.type === 'app' ? "bg-[#080810] py-6 rounded-[24px] md:rounded-[40px] border border-white/[0.05]" : "w-full aspect-video rounded-2xl overflow-hidden border border-white/[0.05]"
                      )}>
                         {canvas.type === 'app' ? (
                           <div className="relative w-full max-w-[320px] md:max-w-[390px] rounded-[2.5rem] md:rounded-[3rem] border-[3px] border-zinc-700/60 bg-black overflow-hidden shadow-[0_0_60px_-15px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.05)] my-4 md:my-8 scale-90 sm:scale-100 origin-center transition-transform">
                             {/* Phone Notch */}
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-[100px] md:w-[120px] h-[24px] md:h-[28px] bg-black rounded-b-2xl flex items-center justify-center">
                               <div className="w-[40px] md:w-[60px] h-[4px] bg-zinc-800 rounded-full" />
                             </div>
                             
                             <div className="h-[600px] md:h-[844px]">
                               <ReadOnlyPreview code={screen.code} type={canvas.type as any} />
                             </div>
                             
                             {/* Home Indicator */}
                             <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 w-[100px] md:w-[130px] h-[4px] md:h-[5px] bg-white/20 rounded-full" />
                           </div>
                         ) : (
                           <ReadOnlyPreview code={screen.code} type={canvas.type as any} />
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
