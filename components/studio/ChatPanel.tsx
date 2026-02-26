'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, ImageIcon, Palette, Loader2, Paperclip, X, Settings2, MessageSquare, LayoutGrid, Wand2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useImageChatStore, ChatMessage, GeneratedImage } from '@/lib/store/useImageChatStore';
import { cn } from '@/lib/utils';
import { generateAIImage, planVisualAction } from '@/lib/actions/ai.actions';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { deductCredit } from '@/lib/credits-actions';
import { AuthModal } from '@/components/studio/AuthModal';
import { IdentityLab } from './IdentityLab';
import { StudioModel } from '@/lib/actions/identity.actions';

const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1' },
  { label: '4:5', value: '4:5' },
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
];

const TEMPLATES = [
  { id: 'etsy-studio', label: 'Etsy Studio', icon: '🏠', desc: 'Artisanal & Cozy' },
  { id: 'fashion-editorial', label: 'Fashion Pro', icon: '👠', desc: 'Editorial & Luxury' },
  { id: 'cinematic-extreme', label: 'Cinematic Mood', icon: '🎬', desc: 'Hollywood Visuals' },
  { id: 'minimal-tech', label: 'Clean Tech', icon: '💻', desc: 'Minimalist & Apple-style' },
  { id: 'street-vogue', label: 'Street Trend', icon: '🏙️', desc: 'Urban & Candid' },
];

export function ChatPanel() {
  const searchParams = useSearchParams();
  const { 
    messages, isGenerating, addMessage, updateMessage, addGalleryImages, setIsGenerating, 
    selectedIdentity, setSelectedIdentity, imageCount, setImageCount, aspectRatio, setAspectRatio,
    clearChat, clearGallery
  } = useImageChatStore();
  const { user, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'chat' | 'setup' | 'identity'>('chat');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [input, setInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const [selectedImages, setSelectedImages] = useState<{ data: string; mimeType: string }[]>([]);
  const [identityImages, setIdentityImages] = useState<{ data: string; mimeType: string }[]>([]);
  const [isIdentitySyncing, setIsIdentitySyncing] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<string | null>(null);

  // Sync identity images whenever the selection changes
  useEffect(() => {
    const syncIdentityImages = async () => {
      if (!selectedIdentity?.reference_images || selectedIdentity.reference_images.length === 0) {
        setIdentityImages([]);
        setIsIdentitySyncing(false);
        return;
      }

      setIsIdentitySyncing(true);
      const images: { data: string; mimeType: string }[] = [];
      
      try {
        for (const ref of selectedIdentity.reference_images) {
          // Handle base64 (legacy or immediate upload)
          const base64Match = ref.match(/^data:([^;]+);base64,(.+)$/);
          if (base64Match) {
            images.push({ mimeType: base64Match[1], data: base64Match[2] });
            continue;
          }

          // Handle URL (Supabase Storage)
          if (ref.startsWith('http')) {
            const response = await fetch(ref);
            const blob = await response.blob();
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            const result = await base64Promise;
            const match = result.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              images.push({ mimeType: match[1], data: match[2] });
            }
          }
        }
        setIdentityImages(images);
      } catch (err) {
        console.error('[ChatPanel] Error fetching identity image:', err);
      } finally {
        setIsIdentitySyncing(false);
      }
    };

    syncIdentityImages();
  }, [selectedIdentity]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const p = searchParams.get('prompt');
    if (p && messages.length === 0 && !isGenerating && !authLoading) {
      setInput(decodeURIComponent(p));
      setTimeout(() => {
        handleGenerate(decodeURIComponent(p));
      }, 500);
    }
  }, [searchParams, messages, isGenerating, authLoading]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processFiles = (files: File[]) => {
    if (selectedImages.length + files.length > 5) {
      alert('Maximum 5 images.');
      return;
    }
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) return;
        const parts = result.split(',');
        if (parts.length < 2) return;
        setSelectedImages(prev => [...prev, { data: parts[1], mimeType: file.type }].slice(0, 5));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) processFiles(files);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async (overridePrompt?: string) => {
    let prompt = overridePrompt || input.trim();
    if (selectedIdentity) {
      prompt = `SUBJECT IDENTITY [${selectedIdentity.name}]: ${selectedIdentity.description}
      
      CRITICAL: FACE-MATCH & IDENTITY LOCK. You MUST treat the subject in the provided reference photos as the source of truth. The generated face must have the EXACT features, eye shape, and structure as the person in the photo.
      
      SCENE/ACTION: ${prompt || 'A professional editorial photoshoot.'}`;
    }
    if ((!prompt && selectedImages.length === 0 && !currentTemplate) || isGenerating) return;

    // Clear previous results to prevent memory lag
    clearChat();
    clearGallery();

    const assistantMsgId = `msg_asst_${Date.now()}`;
    const displayPrompt = overridePrompt || input.trim();
    addMessage({
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: displayPrompt || (currentTemplate ? `Applying ${TEMPLATES.find(t => t.id === currentTemplate)?.label}...` : 'New Request'),
      timestamp: Date.now(),
    });
    
    const imageDatas = [...identityImages, ...selectedImages];
    const template = currentTemplate;
    setInput('');
    setSelectedImages([]);
    setIsGenerating(true);
    if (isMobile) setShowMobileChat(true);

    addMessage({ id: assistantMsgId, role: 'assistant', content: '', isLoading: true, timestamp: Date.now() });

    if (!user) {
      setShowAuthModal(true);
      updateMessage(assistantMsgId, { content: 'Please sign in to start creating.', isLoading: false });
      setIsGenerating(false);
      return;
    }

    try {
      await deductCredit(2 * imageCount);
      const data = await generateAIImage({
        prompt: prompt,
        aspectRatio,
        count: imageCount,
        template: template || undefined,
        images: imageDatas.map(img => ({ data: img.data, mimeType: img.mimeType }))
      });

      const generatedImages: GeneratedImage[] = data.images.map((img, i) => ({
        id: `img_${Date.now()}_${i}`,
        image: img.image,
        mimeType: img.mimeType || 'image/png',
        prompt: prompt || `Template: ${template}`,
        aspectRatio,
        timestamp: Date.now(),
      }));

      updateMessage(assistantMsgId, {
        content: `Ready! Generated ${generatedImages.length} variants.`,
        images: generatedImages,
        isLoading: false,
      });
      addGalleryImages(generatedImages);
    } catch (err: any) {
      updateMessage(assistantMsgId, { content: `Error: ${err.message}`, isLoading: false });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); }
  };

  const renderTabs = () => (
    <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5 mb-4 shrink-0 mx-4 mt-4">
      {[
        { id: 'chat', icon: MessageSquare, label: 'Chat' },
        { id: 'setup', icon: Settings2, label: 'Setup' },
        { id: 'identity', icon: Wand2, label: 'Identity' }
      ].map((tab) => (
        <button 
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
            activeTab === tab.id ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <tab.icon size={12} />
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );

  const renderInput = () => (
    <div className="p-4 border-t border-zinc-800/50 bg-black/40 space-y-3 shrink-0 pointer-events-auto">
        {selectedImages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative w-12 h-12 shrink-0 group">
                <img src={`data:${img.mimeType};base64,${img.data}`} alt="Ref" className="w-full h-full object-cover rounded-lg border border-indigo-500/30" />
                <button onClick={() => removeImage(idx)} className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400"><X size={8} /></button>
              </div>
            ))}
          </div>
        )}
        <div className="relative group">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Talk to Design AI..."
            rows={1}
            className="w-full bg-[#111118] border border-zinc-800/60 rounded-2xl py-4 pl-4 pr-12 text-white text-xs focus:outline-none focus:border-indigo-500/40 resize-none transition-all shadow-2xl"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
             <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-zinc-600 hover:text-indigo-400 transition-colors">
               <ImageIcon size={18} />
             </button>
             <button 
               onClick={() => handleGenerate()}
               disabled={(!input.trim() && selectedImages.length === 0) || isGenerating || isIdentitySyncing}
               className="p-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
             >
               {(isGenerating || isIdentitySyncing) ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
             </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
        </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="absolute inset-0 z-[100] flex flex-col pointer-events-none">
        {/* Mobile Header Toggle */}
        <div className="h-full flex flex-col pointer-events-none">
           <div className="flex-1" />
           
           {/* Floating Chat Container */}
           <div className={cn(
             "w-full bg-[#0A0A0F]/95 backdrop-blur-2xl border-t border-white/5 transition-all duration-300 pointer-events-auto",
             showMobileChat ? "h-[70vh] rounded-t-[2rem]" : "h-0 overflow-hidden"
           )}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <span className="text-[10px] font-black tracking-widest uppercase text-white">Assistant</span>
                <button onClick={() => setShowMobileChat(false)} className="text-zinc-500"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 h-[calc(100%-120px)]">
                 {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex flex-col gap-2", msg.role === 'user' ? 'items-end' : 'items-start')}>
                       <div className={cn(
                         "max-w-[85%] rounded-2xl px-4 py-3 text-[11px]",
                         msg.role === 'user' ? "bg-indigo-600 text-white" : "bg-zinc-900 text-zinc-300 border border-zinc-800"
                       )}>
                          {msg.isLoading ? <Loader2 size={12} className="animate-spin" /> : msg.content}
                       </div>
                    </div>
                 ))}
                 <div ref={messagesEndRef} />
              </div>
           </div>

           {/* Always visible Bottom Bar */}
           <div className="bg-[#0A0A0F]/95 backdrop-blur-2xl border-t border-white/5 p-4 pointer-events-auto flex items-center gap-3">
              <button 
                onClick={() => setShowMobileChat(!showMobileChat)}
                className={cn(
                  "p-3 rounded-xl transition-all",
                  showMobileChat ? "bg-indigo-600 text-white" : "bg-zinc-900 text-zinc-500"
                )}
              >
                <MessageSquare size={20} />
              </button>
              
              <div className="relative flex-1">
                 <input
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyDown={handleKeyDown}
                   placeholder="Prompt..."
                   className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3 px-4 text-xs text-white"
                 />
                 <button onClick={() => handleGenerate()} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 p-1.5"><Send size={18}/></button>
              </div>

              <Sheet>
                 <SheetTrigger asChild>
                    <button className="p-3 bg-zinc-900 text-zinc-500 rounded-xl"><Settings2 size={20}/></button>
                 </SheetTrigger>
                 <SheetContent side="bottom" className="h-[70vh] bg-[#050505] rounded-t-[2rem] border-t-white/10 p-6 overflow-y-auto">
                    <SheetHeader className="mb-6"><SheetTitle className="text-white text-sm font-black uppercase tracking-widest">Studio Config</SheetTitle></SheetHeader>
                    <div className="space-y-8">
                       <IdentityLab onSelect={setSelectedIdentity} selectedId={selectedIdentity?.id} />
                       <div className="space-y-4">
                          <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Dimensions</label>
                          <div className="grid grid-cols-4 gap-2">
                             {ASPECT_RATIOS.map(r => (
                                <button key={r.value} onClick={() => setAspectRatio(r.value)} className={cn("py-2 rounded-lg text-[10px] border font-bold", aspectRatio === r.value ? "bg-indigo-600 border-indigo-400 text-white" : "bg-zinc-900 border-white/5 text-zinc-500")}>{r.label}</button>
                             ))}
                          </div>
                       </div>
                    </div>
                 </SheetContent>
              </Sheet>
           </div>
        </div>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#0A0A0F]">
      {renderTabs()}

      <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-thin">
        {activeTab === 'chat' && (
          <div className="space-y-6 pt-2">
            {messages.length === 0 && (
              <div className="h-full py-12 flex flex-col items-center justify-center text-center opacity-30">
                <Palette className="w-8 h-8 text-indigo-400 mb-4" />
                <p className="text-zinc-400 text-sm font-medium uppercase tracking-[0.2em]">Studio Ready</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex flex-col gap-2", msg.role === 'user' ? 'items-end' : 'items-start animate-in fade-in slide-in-from-left-2 duration-300')}>
                 <div className={cn(
                   "max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed",
                   msg.role === 'user' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/10" : "bg-zinc-900 text-zinc-300 border border-zinc-800/50"
                 )}>
                    {msg.isLoading ? <Loader2 size={12} className="animate-spin" /> : msg.content}
                 </div>
                 {msg.images && (
                   <div className="grid grid-cols-2 gap-2 mt-1">
                     {msg.images.map((img, i) => (
                       <img key={i} src={`data:${img.mimeType};base64,${img.image}`} className="w-28 h-28 object-cover rounded-xl border border-zinc-800" />
                     ))}
                   </div>
                 )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {activeTab === 'setup' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300 p-2">
            <div className="space-y-4">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Dimensions</label>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIOS.map((r) => (
                  <button key={r.value} onClick={() => setAspectRatio(r.value)} className={cn("py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all", aspectRatio === r.value ? "bg-indigo-600 border-indigo-500 text-white shadow-lg" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white")}>{r.label}</button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Variations</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((count) => (
                  <button key={count} onClick={() => setImageCount(count)} className={cn("flex-1 py-3 rounded-xl text-[11px] font-black border transition-all", imageCount === count ? "bg-indigo-600 border-indigo-500 text-white shadow-lg" : "bg-zinc-900 border-zinc-800 text-zinc-500")}>{count}</button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Creative Style</label>
              <div className="grid grid-cols-1 gap-2">
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => setCurrentTemplate(currentTemplate === t.id ? null : t.id)} className={cn("px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border flex items-center justify-between transition-all", currentTemplate === t.id ? "bg-indigo-600 border-indigo-500 text-white shadow-xl" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-white/10")}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{t.icon}</span>
                      <span>{t.label}</span>
                    </div>
                    {currentTemplate === t.id && <Wand2 size={12} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'identity' && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300 p-2">
            <IdentityLab selectedId={selectedIdentity?.id} onSelect={(iden) => setSelectedIdentity(selectedIdentity?.id === iden.id ? null : iden)} />
          </div>
        )}
      </div>

      {renderInput()}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
