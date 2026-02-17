import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Smartphone, ImageIcon, Globe, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PrivacyToggle } from '@/components/studio/PrivacyToggle';
import { RetryButton } from '@/components/studio/RetryButton';
import { DeleteActions } from '@/components/studio/DeleteActions';
import Image from 'next/image';

export default async function GenerationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-[#050505] text-white p-6">
        <h1 className="text-2xl font-bold mb-4">Please sign in to view your vault</h1>
        <p className="text-zinc-500 mb-8">Access all your saved AI generations in one place.</p>
        <Link href="/studio" className="px-8 py-3 bg-indigo-600 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-indigo-500 transition-all">Go to Studio</Link>
      </div>
    );
  }

  // Fetch canvases for the current user
  const { data: rawCanvases, error } = await supabase
    .from('canvases')
    .select(`
      *,
      images:canvas_images(image_url)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Generations] Error fetching canvases:', error);
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-[#050505] text-white p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-500">
          <Calendar size={32} />
        </div>
        <h1 className="text-xl font-bold mb-2 uppercase tracking-tight">Vault Access Failed</h1>
        <p className="text-zinc-500 mb-8 max-w-xs text-sm font-medium">We couldn't retrieve your saved designs. This might be a temporary connection issue.</p>
        <RetryButton />
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-[#050505] overflow-y-auto scrollbar-none p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
           <h1 className="text-4xl font-bold tracking-tight mb-2">My Vault</h1>
           <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Your curated gallery of AI-powered creations.</p>
        </div>

        {(!rawCanvases || rawCanvases.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-40 border border-white/5 rounded-[40px] bg-[#0A0A0F]/50">
             <div className="w-20 h-20 rounded-3xl bg-zinc-900 flex items-center justify-center mb-6 text-zinc-700">
                <ImageIcon size={32} />
             </div>
             <h2 className="text-zinc-400 font-bold mb-2">Storage is empty</h2>
             <p className="text-zinc-600 text-xs text-center max-w-xs px-6">Save your designs or visuals from the studio to see them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rawCanvases.map((canvas) => (
              <Link 
                key={canvas.id}
                href={`/studio/generations/${canvas.id}`}
                className="group relative flex flex-col bg-[#0A0A0F]/80 border border-white/[0.04] rounded-[32px] overflow-hidden hover:border-white/10 transition-all hover:bg-[#0C0C14] hover:shadow-2xl hover:shadow-black/60"
              >
                {/* Preview Placeholder / Image */}
                <div className="aspect-[16/10] bg-[#111118] relative overflow-hidden flex items-center justify-center">
                    {canvas.type === 'visual' && (canvas.images?.[0] as any)?.image_url ? (
                      <img 
                        src={(canvas.images?.[0] as any).image_url} 
                        alt={canvas.name}
                        className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-20 grayscale scale-110">
                         {canvas.type === 'app' ? <Smartphone size={60} /> : canvas.type === 'visual' ? <ImageIcon size={60} /> : <Globe size={60} />}
                      </div>
                    )}
                   
                   <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] to-transparent opacity-80" />
                   
                   <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                      <DeleteActions type="canvas" id={canvas.id} className="bg-black/60 border-white/10" />
                      <PrivacyToggle canvasId={canvas.id} initialIsPublic={canvas.is_public} />
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-black/60",
                        canvas.type === 'visual' ? "border-indigo-500/30 text-indigo-400" :
                        canvas.type === 'app' ? "border-cyan-500/30 text-cyan-400" :
                        "border-amber-500/30 text-amber-400"
                      )}>
                        {canvas.type}
                      </div>
                   </div>
                </div>

                <div className="p-6">
                   <h3 className="text-sm font-bold text-white mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{canvas.name}</h3>
                   <div className="flex items-center gap-4 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                         <Calendar size={10} />
                         {new Date(canvas.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                         <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                         Open Canvas
                      </div>
                   </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
