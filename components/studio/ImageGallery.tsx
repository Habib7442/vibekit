'use client';

import { useState, useRef, useEffect } from 'react';
import { useImageChatStore, GeneratedImage } from '@/lib/store/useImageChatStore';
import { Download, Edit3, Trash2, Maximize2, X, Loader2, Cloud, Check, Share2, Zap } from 'lucide-react';
import { saveCanvasAction, uploadImageToStudio } from '@/lib/actions/studio.actions';
import { cn } from '@/lib/utils';
import { generateAIImage } from '@/lib/actions/ai.actions';
import { deductCredit } from '@/lib/credits-actions';
import { ExportModal } from './ExportModal';
import { CampaignBatchModal } from './CampaignBatchModal';

function getImageSrc(image: string, mimeType: string) {
  if (image.startsWith('http') || image.startsWith('data:') || image.startsWith('/')) return image;
  return `data:${mimeType};base64,${image}`;
}

async function downloadImage(image: string, mimeType: string, filename: string) {
  const src = getImageSrc(image, mimeType);
  
  if (src.startsWith('http')) {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback to opening in new tab if fetch fails
      window.open(src, '_blank');
    }
  } else {
    const a = document.createElement('a');
    a.href = src;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export function ImageGallery() {
  const { 
    galleryImages, 
    updateGalleryImage, 
    removeGalleryImage, 
    savedCanvasId, 
    setSavedCanvasId,
    isGenerating,
    generationProgress
  } = useImageChatStore();
  const [lightboxImage, setLightboxImage] = useState<GeneratedImage | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; image: GeneratedImage } | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [exportImage, setExportImage] = useState<GeneratedImage | null>(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  const saveSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveSuccessTimeoutRef.current) clearTimeout(saveSuccessTimeoutRef.current);
    };
  }, []);

  // Auto-focus latest image when new ones are added
  const prevCountRef = useRef(galleryImages.length);
  useEffect(() => {
    if (galleryImages.length > prevCountRef.current && galleryImages.length > 0) {
      // New image was added — focus it
      setActiveImageId(galleryImages[galleryImages.length - 1].id);
    } else if (galleryImages.length > 0 && !galleryImages.find(i => i.id === activeImageId)) {
      // Current active was deleted — fall back to first
      setActiveImageId(galleryImages[0].id);
    } else if (galleryImages.length > 0 && !activeImageId) {
      // No active set yet
      setActiveImageId(galleryImages[0].id);
    }
    prevCountRef.current = galleryImages.length;
  }, [galleryImages]);

  const handleContextMenu = (e: React.MouseEvent, image: GeneratedImage) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, image });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleEdit = async (image: GeneratedImage) => {
    if (!editPrompt.trim() || isEditing) return;
    setIsEditing(true);

    try {
      // DEDUCT CREDITS (2 per edit)
      await deductCredit(2);

      const result = await generateAIImage({
        prompt: editPrompt,
        images: [{ data: image.image, mimeType: image.mimeType }]
      });

      updateGalleryImage(image.id, { image: result.image, prompt: editPrompt });
      setEditingImage(null);
      setEditPrompt('');
    } catch (err: any) {
      console.error('[Edit] Failed:', err);
      alert('Edit failed: ' + err.message);
    } finally {
      setIsEditing(false);
    }
  };

  const handleSaveAll = async () => {
    if (galleryImages.length === 0 || isSaving) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Upload all images to storage and get URLs
      const imageUploads = await Promise.all(
        galleryImages.map(async (img) => {
          const publicUrl = await uploadImageToStudio(img.image, `gallery_${img.id}.png`);
          return { id: img.id, url: publicUrl, prompt: img.prompt, aspectRatio: img.aspectRatio };
        })
      );

      // 2. Save canvas entry
      const imageEntries: Record<string, { imageUrl: string; prompt?: string; aspectRatio?: string }> = {};
      imageUploads.forEach(upload => {
        imageEntries[upload.id] = { imageUrl: upload.url, prompt: upload.prompt, aspectRatio: upload.aspectRatio };
      });

      const result = await saveCanvasAction({
        canvasId: savedCanvasId || undefined,
        name: galleryImages[0]?.prompt || 'Studio Creative',
        type: 'visual',
        images: imageEntries,
      });

      if (result.canvasId) {
        setSavedCanvasId(result.canvasId);
      }

      setSaveSuccess(true);
      if (saveSuccessTimeoutRef.current) clearTimeout(saveSuccessTimeoutRef.current);
      saveSuccessTimeoutRef.current = setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('[Save All Images] Error:', err);
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const progress = generationProgress.total > 0 
    ? Math.round((generationProgress.completed / generationProgress.total) * 100) 
    : 0;

  return (
    <div className="w-full h-full bg-[#050505] relative overflow-hidden" onClick={closeContextMenu}>
      
      {/* Generation Progress Overlay */}
      {isGenerating && (
        <div className="absolute inset-0 z-50 bg-[#050505]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="w-full max-w-md space-y-10">
            <div className="relative flex justify-center">
               <div className="w-32 h-32 rounded-[2.5rem] border-4 border-indigo-600/20 border-t-indigo-500 animate-spin" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <span className="text-white font-black text-3xl tracking-tighter">{progress}%</span>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Generating</span>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Drafting Masterpieces</h3>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-[0.2em]">Crafting your vision... Please have patience</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-600 px-1">
                  <span>Variant {Math.min(generationProgress.completed + 1, generationProgress.total)} of {generationProgress.total}</span>
                  <span>{generationProgress.completed} done</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full transition-all duration-700 shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-10 flex items-center justify-center gap-8 opacity-30">
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /><span className="text-[10px] text-white font-black uppercase tracking-widest">AI Cluster Active</span></div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[10px] text-white font-black uppercase tracking-widest">Fiber Pipeline</span></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {galleryImages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-24 h-24 rounded-3xl bg-zinc-900/50 border border-zinc-800/30 flex items-center justify-center mx-auto mb-4">
              <div className="w-12 h-8 rounded-lg bg-zinc-800/50 border border-zinc-700/30" />
            </div>
            <p className="text-zinc-600 text-sm font-medium">Your canvas is empty</p>
            <p className="text-zinc-700 text-xs mt-1">Generated images will appear here</p>
            <button
              onClick={() => setShowCampaignModal(true)}
              className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold flex items-center gap-2 mx-auto hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20"
            >
              <Zap size={14} /> Launch Campaign
            </button>
          </div>
        </div>
      )}

      {/* Focused One-by-One View */}
      {galleryImages.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Image Navigation Tabs */}
          <div className="shrink-0 px-4 md:px-6 py-3 border-b border-zinc-800/50 bg-[#0A0A0F]/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 min-w-0 pr-2">
            {galleryImages.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveImageId(img.id)}
                className={cn(
                  "px-3 md:px-4 py-1.5 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap",
                  activeImageId === img.id 
                    ? "bg-white text-black border-white shadow-lg" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                )}
              >
                {img.prompt.slice(0, 15)}...
              </button>
            ))}
            </div>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                saveSuccess 
                  ? "bg-emerald-500 text-white" 
                  : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span className="xs:inline hidden">Saving...</span>
                  <span className="xs:hidden">...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check size={12} />
                  <span className="xs:inline hidden">Saved</span>
                  <span className="xs:hidden"></span>
                </>
              ) : (
                <>
                  <Cloud size={12} />
                  <span className="xs:inline hidden">Save</span>
                  <span className="xs:hidden">Save</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowCampaignModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400 transition-all shrink-0 shadow-lg shadow-amber-500/20"
            >
              <Zap size={12} />
              <span className="hidden sm:inline">Campaign</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex justify-center items-start scrollbar-none pb-32 md:pb-8">
            {galleryImages.filter(i => i.id === activeImageId).map((img) => (
              <div key={img.id} className="relative group w-fit mx-auto max-w-full" onContextMenu={(e) => handleContextMenu(e, img)}>
                {/* Image Container */}
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800/30 hover:border-zinc-700/50 transition-all shadow-2xl shadow-black/60 bg-black/20 flex justify-center">
                    <img
                      src={getImageSrc(img.image, img.mimeType)}
                      alt={img.prompt}
                      className={cn(
                        "max-w-full max-h-[60vh] md:max-h-[calc(100vh-160px)] object-contain cursor-pointer transition-all duration-300",
                        editingImage === img.id && "opacity-40"
                      )}
                      onClick={() => setLightboxImage(img)}
                    />

                  {/* Actions Overlay — Static on mobile, hover on desktop */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <span className="text-[10px] text-white/50 font-mono uppercase tracking-widest">{img.aspectRatio}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setExportImage(img); }}
                          className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center text-white transition-all scale-110 md:scale-100"
                          title="Export for Platforms"
                        >
                          <Share2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingImage(img.id); }}
                          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all"
                          title="Edit with AI"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); downloadImage(img.image, img.mimeType, `creation-${img.id}.png`); }}
                          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all"
                          title="Download Original"
                        >
                          <Download size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setLightboxImage(img); }}
                          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all"
                          title="Full Screen"
                        >
                          <Maximize2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inline Edit Bar */}
                {editingImage === img.id && (
                  <div className="absolute inset-x-4 bottom-4 z-10 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="bg-[#0A0A0F]/95 backdrop-blur-xl border border-zinc-700/40 rounded-2xl p-4 shadow-2xl">
                      <textarea
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && editPrompt.trim()) { e.preventDefault(); handleEdit(img); }
                          if (e.key === 'Escape') { setEditingImage(null); setEditPrompt(''); }
                        }}
                        placeholder="Describe your edit..."
                        rows={2}
                        autoFocus
                        className="w-full bg-transparent border-none text-white text-[12px] focus:outline-none resize-none placeholder:text-zinc-500 leading-relaxed"
                      />
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/50">
                        <span className="text-[10px] text-zinc-600 font-medium">Enter to apply · Esc to cancel</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditingImage(null); setEditPrompt(''); }}
                            className="px-3 py-1.5 text-[10px] text-zinc-500 hover:text-white rounded-lg transition-colors font-bold uppercase tracking-widest"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleEdit(img)}
                            disabled={!editPrompt.trim() || isEditing}
                            className="px-4 py-1.5 text-[10px] bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white rounded-lg transition-all flex items-center gap-2 font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                          >
                            {isEditing ? <Loader2 size={12} className="animate-spin" /> : <Edit3 size={12} />}
                            Update
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[9999] bg-[#111118] border border-zinc-700/40 rounded-xl shadow-2xl py-1.5 min-w-[160px] animate-in fade-in zoom-in-95 duration-150"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { setEditingImage(contextMenu.image.id); closeContextMenu(); }}
            className="w-full px-3 py-2 text-left text-[11px] text-zinc-300 hover:bg-zinc-800/50 flex items-center gap-2.5 transition-colors"
          >
            <Edit3 size={13} className="text-indigo-400" /> Edit with AI
          </button>
          <button
            onClick={() => { downloadImage(contextMenu.image.image, contextMenu.image.mimeType, `creation-${contextMenu.image.id}.png`); closeContextMenu(); }}
            className="w-full px-3 py-2 text-left text-[11px] text-zinc-300 hover:bg-zinc-800/50 flex items-center gap-2.5 transition-colors"
          >
            <Download size={13} className="text-emerald-400" /> Download
          </button>
          <button
            onClick={() => { setLightboxImage(contextMenu.image); closeContextMenu(); }}
            className="w-full px-3 py-2 text-left text-[11px] text-zinc-300 hover:bg-zinc-800/50 flex items-center gap-2.5 transition-colors"
          >
            <Maximize2 size={13} className="text-blue-400" /> Full Screen
          </button>
          <div className="my-1 border-t border-zinc-800/50" />
          <button
            onClick={() => { removeGalleryImage(contextMenu.image.id); closeContextMenu(); }}
            className="w-full px-3 py-2 text-left text-[11px] text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
          >
            <Trash2 size={13} /> Remove
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            <X size={20} />
          </button>
          <img
            src={getImageSrc(lightboxImage.image, lightboxImage.mimeType)}
            alt="Full view"
            className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); downloadImage(lightboxImage.image, lightboxImage.mimeType, `creation-${lightboxImage.id}.png`); }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-2 transition-all"
            >
              <Download size={14} /> Download
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setEditingImage(lightboxImage.id); setLightboxImage(null); }}
              className="px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs flex items-center gap-2 transition-all"
            >
              <Edit3 size={14} /> Edit
            </button>
          </div>
        </div>
      )}



      {/* Export Modal */}
      {exportImage && (
        <ExportModal
          image={exportImage.image}
          mimeType={exportImage.mimeType}
          prompt={exportImage.prompt}
          onClose={() => setExportImage(null)}
        />
      )}

      {/* Campaign Batch Modal */}
      {showCampaignModal && (
        <CampaignBatchModal onClose={() => setShowCampaignModal(false)} />
      )}
    </div>
  );
}
