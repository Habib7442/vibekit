'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Check, Download, Zap, Instagram, Facebook, Globe, Monitor, Mail, Smartphone, Image, Linkedin, ChevronRight, Sparkles, Share2, Upload, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useImageChatStore, GeneratedImage } from '@/lib/store/useImageChatStore';
import { ExportModal } from './ExportModal';

interface FormatOption {
  key: string;
  label: string;
  size: string;
  icon: React.ReactNode;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { key: 'ig_post',    label: 'Instagram Post',    size: '1:1',   icon: <Instagram size={14} /> },
  { key: 'ig_story',   label: 'Instagram Story',   size: '9:16',  icon: <Smartphone size={14} /> },
  { key: 'fb_ad',      label: 'Facebook Ad',       size: '4:5',   icon: <Facebook size={14} /> },
  { key: 'fb_cover',   label: 'Facebook Cover',    size: '16:9',  icon: <Facebook size={14} /> },
  { key: 'twitter',    label: 'Twitter/X Post',    size: '16:9',  icon: <Globe size={14} /> },
  { key: 'pinterest',  label: 'Pinterest Pin',     size: '9:16',  icon: <Image size={14} /> },
  { key: 'youtube',    label: 'YouTube Thumbnail', size: '16:9',  icon: <Monitor size={14} /> },
  { key: 'linkedin',   label: 'LinkedIn Post',     size: '4:3',   icon: <Linkedin size={14} /> },
  { key: 'email',      label: 'Email Header',      size: '16:9',  icon: <Mail size={14} /> },
  { key: 'web_banner', label: 'Website Banner',    size: '16:9',  icon: <Monitor size={14} /> },
];

type Step = 'brief' | 'formats' | 'generating' | 'results';

interface CampaignBatchModalProps {
  onClose: () => void;
}

export function CampaignBatchModal({ onClose }: CampaignBatchModalProps) {
  const { selectedIdentity, addGalleryImages } = useImageChatStore();
  
  const [step, setStep] = useState<Step>('brief');
  const [brief, setBrief] = useState('');
  const [offer, setOffer] = useState('');
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set(['ig_post', 'ig_story', 'fb_ad']));
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentLabel: '' });
  const [results, setResults] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [campaignPlan, setCampaignPlan] = useState<any>(null);
  const [exportAsset, setExportAsset] = useState<any>(null);

  const [productImage, setProductImage] = useState<string | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [productMimeType, setProductMimeType] = useState<string | null>(null);

  // Auto-sync the product image whenever the selected identity changes
  useEffect(() => {
    const syncImage = async () => {
      const refImage = selectedIdentity?.reference_images?.[0];
      if (!refImage) {
        if (!selectedIdentity) {
          setProductImage(null);
          setProductMimeType(null);
        }
        return;
      }

      // Check if it's already base64 (old records)
      const base64Match = refImage.match(/^data:([^;]+);base64,(.+)$/);
      if (base64Match) {
        setProductMimeType(base64Match[1]);
        setProductImage(base64Match[2]);
        console.log('[Campaign] Synced base64 image from DB');
        return;
      }

      // If it's a URL (new records), USE URL DIRECTLY
      if (refImage.startsWith('http')) {
         setProductImageUrl(refImage);
         // Infer MIME type from URL extension, default to jpeg
         const ext = refImage.split('.').pop()?.toLowerCase().split('?')[0];
         const mimeMap: Record<string, string> = { png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
         setProductMimeType(mimeMap[ext || ''] || 'image/jpeg');
         setProductImage(null);
         console.log('[Campaign] Using image URL directly for AI optimization');
      }
    };

    syncImage();
  }, [selectedIdentity]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const [header, data] = base64.split(',');
      setProductImage(data);
      setProductImageUrl(null);
      setProductMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const toggleFormat = (key: string) => {
    setSelectedFormats(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedFormats.size === FORMAT_OPTIONS.length) {
      setSelectedFormats(new Set());
    } else {
      setSelectedFormats(new Set(FORMAT_OPTIONS.map(f => f.key)));
    }
  };

  const handleGenerate = async () => {
    if (selectedFormats.size === 0 || !brief.trim()) return;

    setStep('generating');
    setIsGenerating(true);
    setProgress({ current: 0, total: selectedFormats.size, currentLabel: 'Planning campaign...' });

    try {
      const { generateCampaignBatchAction } = await import('@/lib/actions/ai.actions');
      
      // We'll use a polling approach - call the action and wait for results
      setProgress({ current: 0, total: selectedFormats.size, currentLabel: 'AI is planning your campaign...' });
      
      const data = await generateCampaignBatchAction({
        brief: brief.trim(),
        formats: Array.from(selectedFormats),
        brandDNA: selectedIdentity || undefined,
        offer: offer.trim() || undefined,
        productImages: (productImage || productImageUrl) ? [{ 
          data: productImage || undefined, 
          url: productImageUrl || undefined,
          mimeType: productMimeType || 'image/png' 
        }] : [],
      });

      setCampaignPlan(data.plan);
      setResults(data.assets);
      setErrors(data.errors);

      // Add all generated images to the gallery
      if (data.assets.length > 0) {
        const galleryImages: GeneratedImage[] = data.assets.map((asset: any, i: number) => ({
          id: `img_campaign_${Date.now()}_${i}`,
          image: asset.image,
          mimeType: asset.mimeType,
          prompt: `[${asset.label}] ${brief}`,
          aspectRatio: asset.aspectRatio,
          timestamp: Date.now(),
        }));
        addGalleryImages(galleryImages);
      }

      setStep('results');
    } catch (err: any) {
      console.error('[Campaign] Generation failed:', err);
      setErrors([{ error: err.message }]);
      setStep('results');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const folder = zip.folder('campaign')!;

      for (const [i, asset] of results.entries()) {
        try {
          const ext = asset.mimeType?.includes('png') ? 'png' : 'jpg';
          const safeName = asset.label.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_') || `asset_${i + 1}`;
          
          let bytes: Uint8Array;
          if (asset.image.startsWith('http')) {
            const res = await fetch(asset.image);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const arrayBuffer = await blob.arrayBuffer();
            bytes = new Uint8Array(arrayBuffer);
          } else {
            // Convert base64 to binary
            const binary = atob(asset.image);
            bytes = new Uint8Array(binary.length);
            for (let j = 0; j < binary.length; j++) {
              bytes[j] = binary.charCodeAt(j);
            }
          }
          folder.file(`${safeName}.${ext}`, bytes);
        } catch (err) {
          console.error(`[Campaign] Failed to process asset ${asset.label}:`, err);
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign_${brief.slice(0, 20).replace(/\s+/g, '_')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Campaign] ZIP download failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0A0A0F] border border-zinc-800/60 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800/50 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-white font-black text-lg tracking-tight flex items-center gap-2">
              <Zap size={20} className="text-amber-400" />
              Campaign Generator
            </h2>
            <p className="text-zinc-500 text-xs mt-1">
              {step === 'brief' && 'Describe your campaign — AI handles the rest'}
              {step === 'formats' && 'Select platforms to generate for'}
              {step === 'generating' && 'AI is creating your campaign assets...'}
              {step === 'results' && `${results.length} assets ready`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Step: Brief */}
        {step === 'brief' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Brand badge */}
            {selectedIdentity && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 w-fit">
                <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black uppercase">
                  {selectedIdentity.name.charAt(0)}
                </div>
                <span className="text-indigo-300 text-xs font-bold">{selectedIdentity.name}</span>
                <span className="text-indigo-500 text-[10px]">{selectedIdentity.type} applied</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Campaign Brief</label>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="e.g. Valentine's Day sale — 30% off all candles, warm romantic mood, target: couples 25-40"
                rows={4}
                autoFocus
                className="w-full bg-zinc-900/60 border border-zinc-800/60 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-indigo-500/40 transition-all resize-none placeholder:text-zinc-600"
              />
            </div>

            {/* Product/Subject Image Upload */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                Subject Photo <span className="text-zinc-600">(highly recommended)</span>
              </label>
              
              {!productImage ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-800 hover:border-indigo-500/40 hover:bg-indigo-500/5 rounded-2xl cursor-pointer transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload size={24} className="text-zinc-600 group-hover:text-indigo-400 mb-2 transition-colors" />
                    <p className="text-xs text-zinc-500 group-hover:text-zinc-400 font-medium">Click to upload subject photo</p>
                    <p className="text-[10px] text-zinc-600 mt-1">PNG, JPG or WebP</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              ) : (
                <div className="relative group rounded-2xl overflow-hidden border border-indigo-500/30 w-fit">
                  <img 
                    src={`data:${productMimeType};base64,${productImage}`} 
                    alt="Subject" 
                    className="w-32 h-32 object-contain bg-zinc-900"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => { setProductImage(null); setProductMimeType(null); }}
                      className="p-2 rounded-full bg-red-500 text-white hover:bg-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Offer / CTA <span className="text-zinc-600">(optional)</span></label>
              <input
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                placeholder="e.g. 30% OFF — Shop Now"
                className="w-full bg-zinc-900/60 border border-zinc-800/60 rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/40 transition-all placeholder:text-zinc-600"
              />
            </div>

            {/* Quick brief suggestions */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Quick ideas</label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Summer Sale — Fresh vibrant energy',
                  'Product Launch — Premium and bold',
                  'Holiday Season — Warm festive mood',
                  'Back to School — Fun and energetic',
                  'Flash Sale — Urgent and exciting',
                ].map(idea => (
                  <button
                    key={idea}
                    onClick={() => setBrief(idea)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800/40 text-zinc-400 text-[11px] hover:text-white hover:border-zinc-600 transition-all"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: Format Selection */}
        {step === 'formats' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-zinc-400 text-xs">
                <span className="text-white font-bold">{selectedFormats.size}</span> formats selected — one image per format
              </p>
              <button 
                onClick={selectAll}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
              >
                {selectedFormats.size === FORMAT_OPTIONS.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {FORMAT_OPTIONS.map(format => {
                const isSelected = selectedFormats.has(format.key);
                return (
                  <button
                    key={format.key}
                    onClick={() => toggleFormat(format.key)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left group",
                      isSelected 
                        ? "bg-amber-600/10 border-amber-500/30 text-white" 
                        : "bg-zinc-900/40 border-zinc-800/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                      isSelected 
                        ? "bg-amber-500 border-amber-400" 
                        : "border-zinc-600 group-hover:border-zinc-400"
                    )}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <span className={cn("opacity-60 shrink-0", isSelected && "opacity-100 text-amber-300")}>
                      {format.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">{format.label}</p>
                      <p className="text-[10px] text-zinc-600 font-mono">{format.size}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Brief summary */}
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/30">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Your Brief</p>
              <p className="text-white text-sm">{brief}</p>
              {offer && <p className="text-amber-400 text-xs mt-1 font-bold">{offer}</p>}
            </div>
          </div>
        )}

        {/* Step: Generating */}
        {step === 'generating' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/20 flex items-center justify-center">
                <Loader2 size={40} className="text-amber-400 animate-spin" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-black text-[10px] font-black animate-pulse">
                {selectedFormats.size}
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-white font-bold text-lg">Creating Your Campaign</h3>
              <p className="text-zinc-500 text-sm">{progress.currentLabel}</p>
              <p className="text-zinc-600 text-xs">
                Generating {selectedFormats.size} assets — this takes about {selectedFormats.size * 20}-{selectedFormats.size * 40} seconds
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-xs">
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                <div className="h-full w-1/3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>
        )}

        {/* Step: Results */}
        {step === 'results' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Plan summary */}
            {campaignPlan && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-600/5 to-orange-600/5 border border-amber-500/15">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Campaign Concept</span>
                </div>
                <p className="text-white text-sm font-medium">{campaignPlan.concept}</p>
                <p className="text-zinc-500 text-xs mt-1">Style: {campaignPlan.visualStyle} · Colors: {campaignPlan.colorMood}</p>
              </div>
            )}

            {/* Results grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {results.map((asset: any, i: number) => (
                <div key={i} className="group relative rounded-2xl overflow-hidden border border-zinc-800/40 bg-zinc-900/30">
                  <div className="aspect-square relative">
                    <img
                      src={asset.image.startsWith('http') ? asset.image : `data:${asset.mimeType};base64,${asset.image}`}
                      alt={asset.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-3">
                      <button
                        onClick={() => setExportAsset(asset)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 transition-all"
                      >
                        <Share2 size={12} /> Export
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-white text-xs font-bold">{asset.label}</p>
                    <p className="text-zinc-600 text-[10px] font-mono">{asset.aspectRatio}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                <p className="text-red-400 text-xs font-bold">{errors.length} format{errors.length !== 1 ? 's' : ''} failed to generate</p>
                {errors.map((err: any, i: number) => (
                  <p key={i} className="text-red-500/50 text-[10px] mt-1">{err.label}: {err.error}</p>
                ))}
              </div>
            )}

            {/* Success message */}
            {results.length > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <Check size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-emerald-300 text-sm font-bold">{results.length} campaign assets generated!</p>
                  <p className="text-zinc-500 text-xs">Added to your gallery • Download as ZIP below</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800/50 bg-[#070710] flex items-center justify-between shrink-0">
          {step === 'brief' && (
            <>
              <div className="text-xs text-zinc-500">Enter your campaign idea</div>
              <button
                onClick={() => brief.trim() && setStep('formats')}
                disabled={!brief.trim()}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                  brief.trim()
                    ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                )}
              >
                Next <ChevronRight size={16} />
              </button>
            </>
          )}
          {step === 'formats' && (
            <>
              <button
                onClick={() => setStep('brief')}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={selectedFormats.size === 0}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                  selectedFormats.size > 0
                    ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                )}
              >
                <Zap size={16} />
                Generate {selectedFormats.size} Assets
              </button>
            </>
          )}
          {step === 'generating' && (
            <div className="flex items-center gap-2 text-zinc-500 text-xs w-full justify-center">
              <Loader2 size={14} className="animate-spin" />
              Please don't close this window...
            </div>
          )}
          {step === 'results' && (
            <>
              <button
                onClick={onClose}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadAll}
                  disabled={results.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Download size={16} />
                  Download ZIP ({results.length})
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Export Modal for individual assets */}
      {exportAsset && (
        <ExportModal
          image={exportAsset.image}
          mimeType={exportAsset.mimeType}
          prompt={`Campaign: ${brief}`}
          onClose={() => setExportAsset(null)}
        />
      )}
    </div>
  );
}
