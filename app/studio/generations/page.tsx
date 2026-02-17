import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ImageIcon, Calendar } from 'lucide-react';
import { RetryButton } from '@/components/studio/RetryButton';
import { CanvasCard } from '@/components/studio/CanvasCard';

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

  // Fetch canvases for the current user, including first screen for preview
  const { data: rawCanvases, error } = await supabase
    .from('canvases')
    .select(`
      *,
      images:canvas_images(image_url),
      screens:canvas_screens(code, order)
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

  // Sort screens locally to ensure preview is the first screen
  const canvases = (rawCanvases || []).map(canvas => ({
    ...canvas,
    screens: (canvas.screens || []).sort((a: any, b: any) => a.order - b.order)
  }));

  return (
    <div className="flex-1 h-full bg-[#050505] overflow-y-auto scrollbar-none p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
           <h1 className="text-4xl font-bold tracking-tight mb-2">My Vault</h1>
           <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Your curated gallery of AI-powered creations.</p>
        </div>

        {(!canvases || canvases.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-40 border border-white/5 rounded-[40px] bg-[#0A0A0F]/50">
             <div className="w-20 h-20 rounded-3xl bg-zinc-900 flex items-center justify-center mb-6 text-zinc-700">
                <ImageIcon size={32} />
             </div>
             <h2 className="text-zinc-400 font-bold mb-2">Storage is empty</h2>
             <p className="text-zinc-600 text-xs text-center max-w-xs px-6">Save your designs or visuals from the studio to see them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {canvases.map((canvas) => (
              <CanvasCard 
                key={canvas.id} 
                canvas={canvas} 
                isOwner={user.id === canvas.user_id} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
