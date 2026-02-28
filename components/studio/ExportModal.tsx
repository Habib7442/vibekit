'use client';

import { useState } from 'react';
import { X, Download, Check, Loader2, Package, ShoppingBag, Instagram, Facebook, Image, Mail, Monitor, Smartphone, Globe, Linkedin, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportPlatform {
  key: string;
  label: string;
  size: string;
  icon: React.ReactNode;
  category: 'ecommerce' | 'social' | 'web' | 'print';
}

const PLATFORMS: ExportPlatform[] = [
  // E-Commerce
  { key: 'shopify',         label: 'Shopify Product',     size: '2048×2048', icon: <ShoppingBag size={14} />,  category: 'ecommerce' },
  { key: 'amazon',          label: 'Amazon Main Image',   size: '2000×2000', icon: <Package size={14} />,      category: 'ecommerce' },
  // Social Media
  { key: 'instagram_post',  label: 'Instagram Post',      size: '1080×1080', icon: <Instagram size={14} />,    category: 'social' },
  { key: 'instagram_story', label: 'Instagram Story',     size: '1080×1920', icon: <Smartphone size={14} />,   category: 'social' },
  { key: 'facebook_ad',     label: 'Facebook Ad',         size: '1200×628',  icon: <Facebook size={14} />,     category: 'social' },
  { key: 'facebook_cover',  label: 'Facebook Cover',      size: '1640×624',  icon: <Facebook size={14} />,     category: 'social' },
  { key: 'pinterest',       label: 'Pinterest Pin',       size: '1000×1500', icon: <Image size={14} />,        category: 'social' },
  { key: 'twitter_post',    label: 'Twitter/X Post',      size: '1600×900',  icon: <Globe size={14} />,        category: 'social' },
  { key: 'youtube_thumb',   label: 'YouTube Thumbnail',   size: '1280×720',  icon: <Monitor size={14} />,      category: 'social' },
  { key: 'linkedin_post',   label: 'LinkedIn Post',       size: '1200×627',  icon: <Linkedin size={14} />,     category: 'social' },
  { key: 'whatsapp_dp',     label: 'WhatsApp DP',         size: '500×500',   icon: <Smartphone size={14} />,   category: 'social' },
  // Web
  { key: 'email_header',    label: 'Email Header',        size: '600×200',   icon: <Mail size={14} />,         category: 'web' },
  { key: 'web_banner',      label: 'Website Banner',      size: '1920×600',  icon: <Monitor size={14} />,      category: 'web' },
  { key: 'logo_square',     label: 'Square Logo/Icon',    size: '500×500',   icon: <Image size={14} />,        category: 'web' },
  // Print
  { key: 'print_4k',        label: 'Print 4K',            size: '3840×2160', icon: <Image size={14} />,        category: 'print' },
];

const CATEGORIES = [
  { key: 'ecommerce', label: 'E-Commerce', color: 'emerald' },
  { key: 'social',    label: 'Social Media', color: 'pink' },
  { key: 'web',       label: 'Web & Email', color: 'blue' },
  { key: 'print',     label: 'Print', color: 'amber' },
];

interface ExportModalProps {
  image: string;      // base64
  mimeType: string;
  prompt: string;
  onClose: () => void;
}

export function ExportModal({ image, mimeType, prompt, onClose }: ExportModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [useAI, setUseAI] = useState(true);

  const togglePlatform = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectCategory = (category: string) => {
    const categoryPlatforms = PLATFORMS.filter(p => p.category === category).map(p => p.key);
    const allSelected = categoryPlatforms.every(k => selected.has(k));
    
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) {
        categoryPlatforms.forEach(k => next.delete(k));
      } else {
        categoryPlatforms.forEach(k => next.add(k));
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === PLATFORMS.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(PLATFORMS.map(p => p.key)));
    }
  };

  const handleExport = async () => {
    if (selected.size === 0) return;
    setIsExporting(true);
    setProgress(useAI ? `AI expanding to ${selected.size} formats — this may take a minute...` : `Resizing to ${selected.size} formats...`);

    try {
      const filename = prompt.slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_') || 'export';

      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          mimeType,
          platforms: Array.from(selected),
          filename,
          useAI,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Export failed');
      }

      setProgress('Downloading ZIP...');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setProgress('Done!');
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      console.error('[Export] Error:', err);
      setProgress(`Error: ${err.message}`);
      setTimeout(() => setProgress(''), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0A0A0F] border border-zinc-800/60 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800/50 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-white font-black text-lg tracking-tight flex items-center gap-2">
              <Download size={20} className="text-indigo-400" />
              Export for Platforms
            </h2>
            <p className="text-zinc-500 text-xs mt-1">Select platforms → Download as organized ZIP</p>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close export modal"
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview + Platforms */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Image Preview Thumbnail */}
          <div className="flex items-center gap-4 bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/30">
            <img 
              src={image.startsWith('http') ? image : `data:${mimeType};base64,${image}`}
              alt="Export preview"
              className="w-20 h-20 rounded-xl object-cover border border-zinc-700/30"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{prompt}</p>
              <p className="text-zinc-500 text-xs mt-1">{selected.size} format{selected.size !== 1 ? 's' : ''} selected</p>
            </div>
            <button 
              onClick={selectAll}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border",
                selected.size === PLATFORMS.length
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
              )}
            >
              {selected.size === PLATFORMS.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* AI Fill Toggle */}
          <button 
            type="button"
            onClick={() => setUseAI(!useAI)}
            role="switch"
            aria-checked={useAI}
            aria-label="AI Smart Fill"
            className={cn(
              "flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
              useAI 
                ? "bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border-violet-500/30" 
                : "bg-zinc-900/30 border-zinc-800/30 hover:border-zinc-700"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
              useAI ? "bg-violet-600 shadow-lg shadow-violet-600/30" : "bg-zinc-800"
            )}>
              <Wand2 size={18} className={useAI ? "text-white" : "text-zinc-500"} />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <p className={cn("text-sm font-bold", useAI ? "text-white" : "text-zinc-400")}>AI Smart Fill</p>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-violet-600/20 text-violet-400 uppercase tracking-wider">Pro</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">AI extends the background naturally to fit every size — no black bars, no cropping</p>
            </div>
            <div className={cn(
              "w-10 h-6 rounded-full p-0.5 transition-all relative",
              useAI ? "bg-violet-600" : "bg-zinc-700"
            )}>
              <div className={cn(
                "w-5 h-5 rounded-full bg-white shadow transition-transform",
                useAI ? "translate-x-4" : "translate-x-0"
              )} />
            </div>
          </button>

          {/* Platform Categories */}
          {CATEGORIES.map(cat => {
            const catPlatforms = PLATFORMS.filter(p => p.category === cat.key);
            const catSelectedCount = catPlatforms.filter(p => selected.has(p.key)).length;
            const allCatSelected = catSelectedCount === catPlatforms.length;
            
            return (
              <div key={cat.key}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{cat.label}</h3>
                  <button 
                    onClick={() => selectCategory(cat.key)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                  >
                    {allCatSelected ? 'Deselect' : 'Select'} All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {catPlatforms.map(platform => {
                    const isSelected = selected.has(platform.key);
                    return (
                      <button
                        key={platform.key}
                        onClick={() => togglePlatform(platform.key)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group",
                          isSelected 
                            ? "bg-indigo-600/10 border-indigo-500/40 text-white" 
                            : "bg-zinc-900/40 border-zinc-800/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                          isSelected 
                            ? "bg-indigo-600 border-indigo-500" 
                            : "border-zinc-600 group-hover:border-zinc-400"
                        )}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <span className={cn("opacity-60 shrink-0", isSelected && "opacity-100 text-indigo-300")}>
                          {platform.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{platform.label}</p>
                          <p className="text-[10px] text-zinc-600 font-mono">{platform.size}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800/50 bg-[#070710] flex items-center justify-between shrink-0">
          <div className="text-xs text-zinc-500">
            {progress || (
              selected.size > 0 
                ? (useAI 
                    ? `✨ AI will expand to ${selected.size} format${selected.size !== 1 ? 's' : ''}`
                    : `${selected.size} format${selected.size !== 1 ? 's' : ''} → smart crop`)
                : 'Select at least one platform'
            )}
          </div>
          <button
            onClick={handleExport}
            disabled={selected.size === 0 || isExporting}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              selected.size > 0 && !isExporting
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            )}
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export ZIP
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
