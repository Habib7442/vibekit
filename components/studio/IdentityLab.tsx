'use client';

import { useState, useEffect } from 'react';
import { User, Package, Fingerprint, Plus, Trash2, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { getMyIdentities, createIdentityAction, deleteIdentityAction, StudioModel } from '@/lib/actions/identity.actions';
import { cn } from '@/lib/utils';

interface IdentityLabProps {
  onSelect: (model: StudioModel) => void;
  selectedId?: string;
}

export function IdentityLab({ onSelect, selectedId }: IdentityLabProps) {
  const [identities, setIdentities] = useState<StudioModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [brandUrl, setBrandUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [dnaPreview, setDnaPreview] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'person' | 'product' | 'brand'>('person');
  const [newDesc, setNewDesc] = useState('');

  const fetchIdentities = async () => {
    setLoading(true);
    try {
      const data = await getMyIdentities();
      setIdentities(data);
    } catch (err) {
      console.error('Failed to fetch identities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdentities();
  }, []);

  const handleScrape = async () => {
    if (!brandUrl) return;
    setIsScraping(true);
    setDnaPreview(null);
    try {
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: brandUrl })
      });
      
      if (!scrapeRes.ok) throw new Error('Scraping failed');
      const scrapedData = await scrapeRes.json();
      
      const { analyzeBrandDNAAction } = await import('@/lib/actions/identity.actions');
      const dna = await analyzeBrandDNAAction(brandUrl, scrapedData);
      
      setDnaPreview(dna);
      setNewName(dna.name);
      setNewDesc(dna.description);
      setNewType('brand');
    } catch (err) {
      console.error(err);
      alert('Failed to analyze brand. Please try manual entry.');
    } finally {
      setIsScraping(false);
    }
  };

  const handleCreate = async () => {
    if (!newName || !newDesc) return;
    setIsCreating(true);
    try {
      await createIdentityAction({
        name: newName,
        type: newType,
        description: newDesc,
        // Optional: save expanded DNA fields if needed in schema future
      });
      setNewName('');
      setNewDesc('');
      setDnaPreview(null);
      setBrandUrl('');
      setIsCreating(false);
      fetchIdentities();
    } catch (err) {
      console.error(err);
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteIdentityAction(id);
      fetchIdentities();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black flex items-center gap-2">
          <Fingerprint size={12} className="text-indigo-400" /> Identity Lab
        </label>
        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase border border-indigo-500/20 tracking-widest">Premium</span>
      </div>

      {/* Brand Intake Section */}
      <div className="p-4 rounded-2xl bg-indigo-500/[0.05] border border-indigo-500/20 space-y-3">
        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Brand Intake (Auto-Analysis)</p>
        <div className="flex gap-2">
           <input 
            value={brandUrl}
            onChange={(e) => setBrandUrl(e.target.value)}
            placeholder="Instagram or Website URL"
            className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-[10px] text-white focus:outline-none focus:border-indigo-500/30 transition-all"
          />
          <button 
            onClick={handleScrape}
            disabled={!brandUrl || isScraping}
            className="px-4 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-50"
          >
            {isScraping ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          </button>
        </div>
        {dnaPreview && (
          <div className="pt-2 space-y-2">
            <div className="flex flex-wrap gap-1">
              {dnaPreview.colors?.map((c: string, i: number) => (
                <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: c }} />
              ))}
              <span className="text-[8px] text-zinc-500 uppercase font-bold ml-2">{dnaPreview.tone} • {dnaPreview.category}</span>
            </div>
            <p className="text-[9px] text-zinc-400 italic line-clamp-2">"{dnaPreview.description}"</p>
          </div>
        )}
      </div>

      {/* Identity List */}
      <div className="grid grid-cols-1 gap-2">
        {loading ? (
             <div className="py-10 flex flex-col items-center justify-center gap-3 bg-zinc-900/30 rounded-2xl border border-white/5">
                <Loader2 size={16} className="text-indigo-500 animate-spin" />
                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Loading DNA...</p>
             </div>
        ) : identities.length === 0 ? (
          <div className="py-8 px-6 text-center bg-zinc-900/30 rounded-3xl border border-white/5">
             <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">No Identities Saved.<br/>Create one to ensure consistency.</p>
          </div>
        ) : (
          identities.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(item);
                }
              }}
              className={cn(
                "p-4 rounded-2xl border flex items-center justify-between transition-all group cursor-pointer outline-none",
                selectedId === item.id 
                  ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20" 
                  : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/10 focus:border-indigo-500/50"
              )}
            >
              <div className="flex items-center gap-3 text-left">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  selectedId === item.id ? "bg-white/10" : "bg-black/40 group-hover:bg-black/60"
                )}>
                  {item.type === 'person' ? <User size={18} /> : item.type === 'product' ? <Package size={18} /> : <ShieldCheck size={18} />}
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-tight">{item.name}</p>
                  <p className={cn("text-[9px] font-medium line-clamp-1", selectedId === item.id ? "text-indigo-200" : "text-zinc-600")}>
                    {item.description}
                  </p>
                </div>
              </div>
              <button 
                onClick={(e) => handleDelete(e, item.id)}
                className="p-2 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                title="Delete Identity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Create New Form */}
      <div className="p-5 rounded-[2rem] bg-indigo-500/[0.03] border border-indigo-500/10 space-y-4">
        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest flex items-center gap-2">
          <Plus size={12} /> {dnaPreview ? "Approve DNA & Save" : "Create New Subject Ref"}
        </p>
        
        <div className="space-y-3">
          <input 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Identity Name (e.g. Sarah, Luxury Watch)"
            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[11px] text-white focus:outline-none focus:border-indigo-500/30 transition-all"
          />

          <div className="flex gap-2">
            {(['person', 'product', 'brand'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setNewType(t)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border",
                  newType === t ? "bg-white text-black border-white" : "bg-zinc-900 border-zinc-800 text-zinc-600"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <textarea 
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Detailed DNA description for consistency..."
            rows={3}
            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[11px] text-white focus:outline-none focus:border-indigo-500/30 transition-all resize-none"
          />

          <button 
            onClick={handleCreate}
            disabled={!newName || !newDesc || isCreating}
            className="w-full py-4 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all disabled:opacity-50"
          >
            {isCreating ? <Loader2 size={14} className="animate-spin" /> : dnaPreview ? "Save & Lock Brand DNA" : "Verify & Save Identity"}
          </button>
        </div>
      </div>
    </div>
  );
}
