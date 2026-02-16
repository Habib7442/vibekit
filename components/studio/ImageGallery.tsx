'use client';

import { useState, useRef, useEffect } from 'react';
import { useImageChatStore, GeneratedImage } from '@/lib/store/useImageChatStore';
import { Download, Edit3, Trash2, Maximize2, X, Loader2, Copy, Cloud, Check } from 'lucide-react';
import { saveCanvasAction, uploadImageToStudio } from '@/lib/actions/studio.actions';
import { cn } from '@/lib/utils';
import { generateAIImage } from '@/lib/actions/ai.actions';
import { deductCredit } from '@/lib/credits-actions';

function downloadImage(base64: string, mimeType: string, filename: string) {
  const a = document.createElement('a');
  a.href = `data:${mimeType};base64,${base64}`;
  a.download = filename;
  a.click();
}

export function ImageGallery() {
  const { galleryImages, updateGalleryImage, removeGalleryImage, savedCanvasId, setSavedCanvasId } = useImageChatStore();
  const [lightboxImage, setLightboxImage] = useState<GeneratedImage | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; image: GeneratedImage } | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
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

      updateGalleryImage(image.id, { image: result.images[0].image, prompt: editPrompt });
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
        galleryImages.map(img => uploadImageToStudio(img.image, `img_${img.id}.png`))
      );

      // 2. Save canvas and image metadata
      const firstPrompt = galleryImages[0]?.prompt || 'New Visual Arts';
      
      const result = await saveCanvasAction({
        canvasId: savedCanvasId || undefined,
        name: firstPrompt.slice(0, 50),
        type: 'visual',
        images: galleryImages.map((img, idx) => ({
          imageUrl: imageUploads[idx],
          prompt: img.prompt,
          aspectRatio: img.aspectRatio
        }))
      });

      if (result.canvasId) {
        setSavedCanvasId(result.canvasId);
      }

      setSaveSuccess(true);
      saveSuccessTimeoutRef.current = setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('[Save All Images] Error:', err);
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#050505] relative overflow-hidden" onClick={closeContextMenu}>
      
      {/* Empty State */}
      {galleryImages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-24 h-24 rounded-3xl bg-zinc-900/50 border border-zinc-800/30 flex items-center justify-center mx-auto mb-4">
              <div className="w-12 h-8 rounded-lg bg-zinc-800/50 border border-zinc-700/30" />
            </div>
            <p className="text-zinc-600 text-sm font-medium">Your canvas is empty</p>
            <p className="text-zinc-700 text-xs mt-1">Generated images will appear here</p>
          </div>
        </div>
      )}

      {/* Focused One-by-One View */}
      {galleryImages.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Image Navigation Tabs */}
          <div className="shrink-0 px-6 py-3 border-b border-zinc-800/50 bg-[#0A0A0F]/50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1">
            {galleryImages.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveImageId(img.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap",
                  activeImageId === img.id 
                    ? "bg-white text-black border-white shadow-lg" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                )}
              >
                {img.prompt.slice(0, 20)}...
              </button>
            ))}
            </div>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className={cn(
                "flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                saveSuccess 
                  ? "bg-emerald-500 text-white" 
                  : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check size={12} />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Cloud size={12} />
                  <span>Save</span>
                  <span className="hidden md:inline"> to Cloud</span>
                </>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex justify-center items-start scrollbar-none">
            {galleryImages.filter(i => i.id === activeImageId).map((img) => (
              <div key={img.id} className="relative group w-fit mx-auto max-w-full" onContextMenu={(e) => handleContextMenu(e, img)}>
                {/* Image Container */}
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800/30 hover:border-zinc-700/50 transition-all shadow-2xl shadow-black/60 bg-black/20 flex justify-center">
                    <img
                      src={`data:${img.mimeType};base64,${img.image}`}
                      alt={img.prompt}
                      className={cn(
                        "max-w-full max-h-[calc(100vh-180px)] object-contain cursor-pointer transition-all duration-300",
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
                          onClick={(e) => { e.stopPropagation(); setEditingImage(img.id); }}
                          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all"
                          title="Edit with AI"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); downloadImage(img.image, img.mimeType, `creation-${img.id}.png`); }}
                          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all"
                          title="Download"
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
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(img); }
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
            src={`data:${lightboxImage.mimeType};base64,${lightboxImage.image}`}
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
    </div>
  );
}
