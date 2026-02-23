'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Info } from 'lucide-react';
import { useImageChatStore, GeneratedImage } from '@/lib/store/useImageChatStore';
import { cn } from '@/lib/utils';

export function CampaignPanel() {
  const { 
    selectedIdentity, addMessage, updateMessage, addGalleryImages, 
    imageCount, aspectRatio 
  } = useImageChatStore();
  
  const [goal, setGoal] = useState('Product Launch');
  const [message, setMessage] = useState('');
  const [offer, setOffer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!selectedIdentity || selectedIdentity.type !== 'brand') return null;

  const handleGenerate = async () => {
    // Message is now optional, but we need either a message or a goal or brand name
    if (isGenerating) return;
    
    setIsGenerating(true);
    const assistantMsgId = `msg_asst_camp_${Date.now()}`;
    const displayMessage = message || `High-impact ${goal} creatives`;
    
    addMessage({
      id: `msg_user_camp_${Date.now()}`,
      role: 'user',
      content: `Generate ${imageCount} Brand Ad${imageCount > 1 ? 's' : ''} for ${goal}: "${displayMessage}"`,
      timestamp: Date.now()
    });

    addMessage({
      id: assistantMsgId,
      role: 'assistant',
      content: `Crafting ${imageCount} premium ${goal} Hero Ads for ${selectedIdentity.name}...`,
      isLoading: true,
      timestamp: Date.now()
    });

    try {
      const { generateAdCampaignAction } = await import('@/lib/actions/ai.actions');
      const data = await generateAdCampaignAction({
        brandDNA: selectedIdentity,
        goal: goal,
        message: message, // Can be empty
        offer: offer,
        count: imageCount,
        aspectRatio: aspectRatio
      });
      const results = data.ads;

      const generatedImages: GeneratedImage[] = results.map((res: any, i: number) => ({
        id: `img_camp_${Date.now()}_${i}`,
        image: res.image,
        mimeType: res.mimeType,
        prompt: res.prompt,
        aspectRatio: aspectRatio,
        timestamp: Date.now(),
      }));

      updateMessage(assistantMsgId, {
        content: `Your ${imageCount} high-impact Hero Ads are ready! Each visual is tailored to the ${selectedIdentity.name} brand DNA with a professional promotional layout.`,
        images: generatedImages,
        isLoading: false,
      });

      addGalleryImages(generatedImages);
    } catch (err: any) {
      updateMessage(assistantMsgId, { content: `Campaign generation failed: ${err.message}`, isLoading: false });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-[320px] h-full flex flex-col bg-[#050505] border-l border-white/5 animate-in slide-in-from-right duration-500">
      <div className="p-6 border-b border-white/5">
        <h2 className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-400" />
          Campaign Studio
        </h2>
        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-tight">
          Crafting for {selectedIdentity.name}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] text-indigo-400 font-black uppercase tracking-widest px-1">Campaign Goal</label>
            <select 
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[11px] text-white focus:outline-none focus:border-indigo-500/30 transition-all font-bold"
            >
              <option>Product Launch</option>
              <option>Brand Awareness</option>
              <option>Seasonal Offer</option>
              <option>Flash Sale</option>
              <option>New Arrival</option>
              <option>Brand Re-style</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest px-1">Main Message (Optional)</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Introducing our new eco-friendly collection..."
              rows={3}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[11px] text-white focus:outline-none focus:border-indigo-500/30 transition-all resize-none font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest px-1">Offer / CTA (Optional)</label>
            <input 
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              placeholder="e.g. 50% OFF / Shop Now"
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[11px] text-white focus:outline-none focus:border-indigo-500/30 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-zinc-900/50 border border-white/5">
          <Info size={14} className="text-zinc-500 mt-0.5" />
          <p className="text-[9px] text-zinc-500 leading-relaxed font-medium">
            Generating {imageCount} premium Hero Ad unit{imageCount > 1 ? 's' : ''} in {aspectRatio} format.
          </p>
        </div>
      </div>

      <div className="p-6 border-t border-white/5 bg-black/20">
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-4 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
        >
          {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {isGenerating ? "Generating..." : `Generate ${imageCount} Creator Ads`}
        </button>
      </div>
    </div>
  );
}
