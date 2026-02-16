'use client';

import { useState, useEffect, useRef, memo, useMemo } from 'react';
import { useAppDesignerStore, GeneratedScreen } from '@/lib/store/useAppBuilderStore';
import { Code2, Download, Trash2, Copy, Check, Sparkles, RefreshCw, Loader2, ImageIcon, Smartphone, Globe } from 'lucide-react';
import { toPng } from 'html-to-image';
import { cn } from '@/lib/utils';
import { deductCredit } from '@/lib/credits-actions';

import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  useSandpack,
} from '@codesandbox/sandpack-react';

function downloadCode(code: string, filename: string) {
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Error guard that sits OVER the Sandpack preview.
 * - Detects errors via useSandpack()
 * - Auto-retries ONCE on first error
 * - If retry still fails, shows a clean dark overlay (no red screen)
 */
function SandpackErrorGuard() {
  const { sandpack } = useSandpack();
  const [retried, setRetried] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasError = !!sandpack.error;

  useEffect(() => {
    if (hasError && !retried) {
      // Auto-retry once after a short delay
      retryTimer.current = setTimeout(() => {
        setRetried(true);
        sandpack.runSandpack();
      }, 800);
      return () => {
        if (retryTimer.current) clearTimeout(retryTimer.current);
      };
    }

    if (hasError && retried) {
      // Already retried, show our clean overlay
      setShowOverlay(true);
    }

    if (!hasError) {
      // Error cleared (e.g. after successful retry)
      setShowOverlay(false);
    }
  }, [hasError, retried]);

  // Always render the overlay container to cover any flash of red
  return (
    <>
      {/* CSS injection to hide Sandpack's built-in red error screen */}
      <style>{`
        .sp-preview-container [class*="error"],
        .sp-preview-container [style*="background: rgb(255"],
        .sp-preview-container [style*="background-color: rgb(255"],
        .sp-overlay,
        .sp-error {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }
      `}</style>

      {/* Our clean overlay — covers the entire preview area */}
      {(hasError || showOverlay) && (
        <div
          className="absolute inset-0 bg-[#0C0C11] flex flex-col items-center justify-center gap-3 p-6"
          style={{ zIndex: 9999 }}
        >
          {!retried ? (
            // Auto-retrying state
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={20} className="text-zinc-500 animate-spin" />
              <p className="text-zinc-500 text-xs font-medium">Fixing render...</p>
            </div>
          ) : (
            // Retry failed — show clean message
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 border border-zinc-700/30 flex items-center justify-center">
                <RefreshCw size={18} className="text-zinc-500" />
              </div>
              <p className="text-zinc-400 text-sm font-medium">Render issue</p>
              <button
                onClick={() => {
                  setRetried(false);
                  setShowOverlay(false);
                  sandpack.runSandpack();
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-2 transition-all"
              >
                <RefreshCw size={11} /> Retry
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

const downloadImage = async (screen: GeneratedScreen) => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.zIndex = '-9999';
  container.style.opacity = '1';
  container.style.pointerEvents = 'none';
  
  const width = screen.mode === 'app' ? 480 : screen.mode === 'web' ? 1280 : 800;
  container.style.width = `${width}px`;
  
  document.body.appendChild(container);

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(screen.code, 'text/html');
    
    // Inject all styles
    const styles = Array.from(doc.querySelectorAll('style')).map(s => s.textContent).join('\n');
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    container.appendChild(styleEl);

    // Transfer links but don't let them block rule reading
    const links = doc.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = link.getAttribute('href') || '';
      l.dataset.external = "true";
      container.appendChild(l);
    });

    // Inject content without restrictive heights
    const bodyWrapper = document.createElement('div');
    bodyWrapper.className = doc.body.className || 'bg-[#050505] text-white';
    bodyWrapper.style.width = '100%';
    bodyWrapper.style.height = 'auto'; // Allow it to grow
    bodyWrapper.style.overflow = 'visible';
    bodyWrapper.innerHTML = doc.body.innerHTML;
    container.appendChild(bodyWrapper);

    // Wait for assets (fonts/images) to load
    await new Promise(r => setTimeout(r, 2500)); 

    // Measure the actual rendered height
    const fullHeight = container.scrollHeight;

    const dataUrl = await toPng(container, {
      width: width,
      height: fullHeight, // Use the full measured height
      backgroundColor: 'transparent', // Let CSS backgrounds handle it
      skipAutoScale: true,
      cacheBust: true,
      pixelRatio: 2,
      filter: (node) => {
        if (node instanceof HTMLElement && node.tagName === 'LINK' && (node as HTMLLinkElement).rel === 'stylesheet') {
          return true;
        }
        return true;
      }
    });

    const link = document.createElement('a');
    link.download = `${screen.screenName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err: any) {
    console.error('[Capture] Primary capture failed:', err);
    try {
      const dataUrl = await toPng(container, {
        width: width,
        height: container.scrollHeight,
        pixelRatio: 1,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });
      const link = document.createElement('a');
      link.download = `${screen.screenName.toLowerCase().replace(/\s+/g, '-')}-fallback.png`;
      link.href = dataUrl;
      link.click();
    } catch (fallbackErr) {
      console.error('[Capture] Fallback failed:', fallbackErr);
      alert('Security policy blocked the full-height capture. Try copying the design or code.');
    }
  } finally {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
};

const ScreenCard = memo(({ 
  screen, 
  onRemove, 
  onEdit 
}: { 
  screen: GeneratedScreen; 
  onRemove: () => void; 
  onEdit: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const [viewport, setViewport] = useState<'mobile' | 'desktop'>(screen.mode === 'web' ? 'desktop' : 'mobile');

  const handleCopy = () => {
    navigator.clipboard.writeText(screen.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sandpackFiles = useMemo(() => ({
    "/index.html": {
      code: screen.code.includes('<head>') 
        ? screen.code.replace('</head>', `<style>
            *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
            * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
            body { overflow-x: hidden; }
          </style></head>`)
        : `<!DOCTYPE html><html><head><style>
            *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
            * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
            body { font-family: sans-serif; margin: 0; padding: 0; overflow-x: hidden; }
          </style></head><body>${screen.code}</body></html>`,
      active: true,
    },
  }), [screen.code, screen.id]);

  return (
    <div className="rounded-[28px] border border-white/[0.06] bg-[#0C0C11] overflow-hidden group shadow-2xl shadow-black/60 hover:border-white/10 transition-all">
      {/* Screen Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            screen.mode === 'component' ? "bg-violet-500" : "bg-emerald-500"
          )} />
          <span className="text-[12px] text-white font-semibold tracking-tight">{screen.screenName}</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={handleCopy}
            className="h-7 px-2.5 rounded-full bg-white/[0.08] hover:bg-white/15 flex items-center gap-1.5 text-white/70 hover:text-white text-[10px] font-medium transition-all"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={onEdit}
            className="h-7 w-7 rounded-full bg-white/[0.08] hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-violet-400 transition-all"
            title="Edit with AI"
          >
            <Sparkles size={11} />
          </button>
          <button
            onClick={() => downloadImage(screen)}
            className="h-7 w-7 rounded-full bg-white/[0.08] hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-cyan-400 transition-all"
            title="Download as Image (PNG)"
          >
            <ImageIcon size={11} />
          </button>
          <button
            onClick={() => downloadCode(screen.code, `${screen.screenName.toLowerCase().replace(/\s+/g, '-')}.html`)}
            className="h-7 w-7 rounded-full bg-white/[0.08] hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition-all"
            title="Download Code"
          >
            <Download size={11} />
          </button>
          <button
            onClick={onRemove}
            className="h-7 w-7 rounded-full bg-white/[0.04] hover:bg-red-500/20 flex items-center justify-center text-white/30 hover:text-red-400 transition-all"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Viewport Toggle (Web Only) */}
      {screen.mode === 'web' && (
        <div className="flex items-center justify-center py-4 bg-[#080810]/50 border-b border-white/[0.04] gap-2">
          <button
            onClick={() => setViewport('mobile')}
            className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all transition-all flex items-center gap-2",
              viewport === 'mobile' ? "bg-amber-500 text-black shadow-lg" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Smartphone size={12} /> Mobile
          </button>
          <button
            onClick={() => setViewport('desktop')}
            className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              viewport === 'desktop' ? "bg-amber-500 text-black shadow-lg" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Globe size={12} /> Desktop
          </button>
        </div>
      )}

      {/* Sandpack Preview */}
      <div className={cn(
        "relative overflow-hidden flex justify-center",
        screen.mode === 'app' ? "bg-[#080810] py-6" : ""
      )}>
        {/* Mobile Device Frame (app mode only) */}
        <div className={cn(
          (screen.mode === 'app' || (screen.mode === 'web' && viewport === 'mobile'))
            ? "relative w-[390px] rounded-[3rem] border-[3px] border-zinc-700/60 bg-black overflow-hidden shadow-[0_0_60px_-15px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.05)] my-8"
            : "w-full"
        )}>
          {/* Phone Notch (app or web-mobile mode) */}
          {(screen.mode === 'app' || (screen.mode === 'web' && viewport === 'mobile')) && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-[120px] h-[28px] bg-black rounded-b-2xl flex items-center justify-center">
              <div className="w-[60px] h-[4px] bg-zinc-800 rounded-full" />
            </div>
          )}

          <SandpackProvider
            key={screen.id}
            template="static"
            theme="dark"
            files={sandpackFiles}
          >
            <SandpackLayout style={{ border: "none", borderRadius: 0, background: "transparent" }}>
              <SandpackPreview
                style={{
                  height: screen.mode === 'component' ? "600px" : 
                          screen.mode === 'web' ? (viewport === 'mobile' ? "844px" : "900px") : "844px",
                  width: (screen.mode === 'app' || (screen.mode === 'web' && viewport === 'mobile')) ? "390px" : "100%",
                  border: "none",
                }}
                showOpenInCodeSandbox={false}
                showRefreshButton={false}
                showNavigator={false}
              />
            </SandpackLayout>
            <SandpackErrorGuard />
          </SandpackProvider>

          {/* Home Indicator (app or web-mobile mode) */}
          {(screen.mode === 'app' || (screen.mode === 'web' && viewport === 'mobile')) && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 w-[130px] h-[5px] bg-white/20 rounded-full" />
          )}
        </div>
      </div>
    </div>
  );
});

function EditOverlay({ 
  screen, 
  onClose, 
  onUpdate 
}: { 
  screen: GeneratedScreen; 
  onClose: () => void; 
  onUpdate: (prompt: string) => Promise<void> 
}) {
  const [editPrompt, setEditPrompt] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  return (
    <div className="absolute inset-x-6 bottom-6 z-20 animate-in slide-in-from-bottom-2 duration-300">
      <div className="bg-[#0A0A0F]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]">
        <textarea
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { 
              e.preventDefault(); 
              setIsUpdating(true);
              onUpdate(editPrompt).finally(() => setIsUpdating(false)); 
            }
            if (e.key === 'Escape') { onClose(); }
          }}
          placeholder="What should we change? (e.g. 'Make the buttons larger', 'Change to blue theme')"
          rows={2}
          autoFocus
          className="w-full bg-transparent border-none text-white text-[12px] focus:outline-none resize-none placeholder:text-zinc-500 leading-relaxed"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] text-zinc-600 font-medium italic">Enter to update · Esc to cancel</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[10px] text-zinc-500 hover:text-white rounded-lg transition-colors font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsUpdating(true);
                onUpdate(editPrompt).finally(() => setIsUpdating(false));
              }}
              disabled={!editPrompt.trim() || isUpdating}
              className="px-4 py-1.5 text-[10px] bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white rounded-lg transition-all flex items-center gap-2 font-bold uppercase tracking-wider"
            >
              {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Update Design
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppDesignerGallery() {
  const { galleryScreens, removeGalleryScreen, updateGalleryScreen, builderMode } = useAppDesignerStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; screen: GeneratedScreen } | null>(null);
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);

  // Auto-focus latest screen when new ones are added
  const prevCountRef = useRef(galleryScreens.length);
  useEffect(() => {
    if (galleryScreens.length > prevCountRef.current && galleryScreens.length > 0) {
      // New screen was added — focus it
      setActiveScreenId(galleryScreens[galleryScreens.length - 1].id);
    } else if (galleryScreens.length > 0 && !galleryScreens.find(s => s.id === activeScreenId)) {
      // Current active was deleted — fall back to first
      setActiveScreenId(galleryScreens[0].id);
    } else if (galleryScreens.length > 0 && !activeScreenId) {
      // No active set yet
      setActiveScreenId(galleryScreens[0].id);
    }
    prevCountRef.current = galleryScreens.length;
  }, [galleryScreens]);

  const handleContextMenu = (e: React.MouseEvent, screen: GeneratedScreen) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, screen });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleEdit = async (screen: GeneratedScreen, prompt: string) => {
    if (!prompt.trim()) return;

    try {
      const isComponent = screen.mode === 'component';
      
      const endpoint = isComponent ? '/api/generate/component' : '/api/generate/screen';
      const body = isComponent ? {
        instruction: prompt,
        existingCode: screen.code,
        theme: screen.screenName.toLowerCase().includes('light') ? 'light' : 'dark',
      } : {
        instruction: prompt,
        existingCode: screen.code,
        screenName: screen.screenName,
        appDescription: screen.prompt,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || `API error ${response.status}`);
      }

      const data = await response.json();

      updateGalleryScreen(screen.id, { code: data.code });
      setEditingScreenId(null);
    } catch (err: any) {
      console.error('[AppBuilder Edit] Failed:', err);
      alert('Edit failed: ' + err.message);
    }
  };

  return (
    <div 
      className="w-full h-full bg-[#050505] relative overflow-hidden flex flex-col"
      onClick={closeContextMenu}
    >

      {/* Empty State */}
      {galleryScreens.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-20 h-20 rounded-[24px] bg-zinc-900/50 border border-zinc-800/20 flex items-center justify-center mx-auto mb-5">
              {builderMode === 'component' ? (
                <Sparkles size={28} className="text-zinc-700" />
              ) : (
                <Code2 size={28} className="text-zinc-700" />
              )}
            </div>
            <p className="text-zinc-500 text-sm font-semibold">
              {builderMode === 'component' ? 'No components yet' : 'No screens yet'}
            </p>
            <p className="text-zinc-700 text-xs mt-1">
              {builderMode === 'component' ? 'Generate components from the sidebar' : 'Generate screens from the sidebar'}
            </p>
          </div>
        </div>
      )}

      {/* Focused One-by-One View */}
      {galleryScreens.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Screen Navigation Tabs */}
          <div className="shrink-0 px-6 py-3 border-b border-white/[0.04] bg-[#0A0A0F]/50 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {galleryScreens.map((scr, idx) => (
              <button
                key={scr.id}
                onClick={() => setActiveScreenId(scr.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap",
                  activeScreenId === scr.id 
                    ? "bg-white text-black border-white shadow-lg" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                )}
              >
                {scr.screenName}
              </button>
            ))}
          </div>

          <div className={cn(
            "flex-1 overflow-y-auto scrollbar-none flex justify-center",
            galleryScreens.find(s => s.id === activeScreenId)?.mode === 'web' ? "p-0" : "p-6 lg:p-10"
          )}>
            {galleryScreens.filter(s => s.id === activeScreenId).map((scr) => (
              <div key={scr.id} className={cn(
                "relative group w-full", 
                scr.mode === 'app' ? "max-w-[480px]" : 
                scr.mode === 'web' ? "max-w-none" : "max-w-4xl"
              )} onContextMenu={(e) => handleContextMenu(e, scr)}>
                <ScreenCard
                  screen={scr}
                  onRemove={() => {
                    const idx = galleryScreens.findIndex(s => s.id === scr.id);
                    removeGalleryScreen(scr.id);
                    if (galleryScreens.length > 1) {
                      const next = galleryScreens[idx + 1] || galleryScreens[idx - 1];
                      if (next) setActiveScreenId(next.id);
                    }
                  }}
                  onEdit={() => setEditingScreenId(scr.id)}
                />
                
                {/* Inline Edit Bar Overlay */}
                {editingScreenId === scr.id && (
                  <EditOverlay 
                    screen={scr} 
                    onClose={() => setEditingScreenId(null)}
                    onUpdate={(prompt) => handleEdit(scr, prompt)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[9999] bg-[#0C0C11] border border-white/[0.08] rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] py-2 min-w-[180px] animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { setEditingScreenId(contextMenu.screen.id); closeContextMenu(); }}
            className="w-full px-4 py-2.5 text-left text-[11px] text-zinc-300 hover:bg-white/[0.05] flex items-center gap-3 transition-colors font-semibold"
          >
            <Sparkles size={14} className="text-violet-400" /> Edit with AI
          </button>
          <button
            onClick={() => { downloadCode(contextMenu.screen.code, `${contextMenu.screen.screenName.toLowerCase().replace(/\s+/g, '-')}.html`); closeContextMenu(); }}
            className="w-full px-4 py-2.5 text-left text-[11px] text-zinc-300 hover:bg-white/[0.05] flex items-center gap-3 transition-colors font-semibold"
          >
            <Download size={14} className="text-emerald-400" /> Download HTML Code
          </button>
          <div className="my-1.5 border-t border-white/[0.04]" />
          <button
            onClick={() => { removeGalleryScreen(contextMenu.screen.id); closeContextMenu(); }}
            className="w-full px-4 py-2.5 text-left text-[11px] text-red-400/80 hover:bg-red-500/10 flex items-center gap-3 transition-colors font-semibold"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
