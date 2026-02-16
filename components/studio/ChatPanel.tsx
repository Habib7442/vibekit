'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, ImageIcon, Sparkles, Loader2, Paperclip, X, Settings2, MessageSquare, LayoutGrid } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useImageChatStore, ChatMessage, GeneratedImage } from '@/lib/store/useImageChatStore';
import { cn } from '@/lib/utils';
import { generateAIImage } from '@/lib/actions/ai.actions';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { deductCredit } from '@/lib/credits-actions';
import { AuthModal } from '@/components/studio/AuthModal';

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
  const { messages, isGenerating, addMessage, updateMessage, addGalleryImages, setIsGenerating } = useImageChatStore();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [input, setInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Landing page auto-trigger
  useEffect(() => {
    const p = searchParams.get('prompt');
    if (p && messages.length === 0 && !isGenerating) {
      setInput(decodeURIComponent(p));
      // Short delay to let the state update before triggering
      setTimeout(() => {
        handleGenerate(decodeURIComponent(p));
      }, 500);
    }
  }, [searchParams, messages, isGenerating]);

  const [imageCount, setImageCount] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [selectedImages, setSelectedImages] = useState<{ data: string; mimeType: string }[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processFiles = (files: File[]) => {
    if (selectedImages.length + files.length > 5) {
      alert('You can upload a maximum of 5 images.');
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert('Please upload image files only.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImages(prev => [...prev, {
          data: (event.target?.result as string).split(',')[1],
          mimeType: file.type
        }].slice(0, 5));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    processFiles(files);
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      processFiles(files);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async (overridePrompt?: string) => {
    const prompt = overridePrompt || input.trim();
    if ((!prompt && selectedImages.length === 0 && !currentTemplate) || isGenerating) return;

    const userMsgId = `msg_user_${Date.now()}`;
    const assistantMsgId = `msg_asst_${Date.now()}`;

    // Add user message
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: prompt || (currentTemplate ? `Using ${TEMPLATES.find(t => t.id === currentTemplate)?.label} mode...` : 'Processing...'),
      imageCount,
      aspectRatio,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    
    const imageDatas = [...selectedImages];
    const template = currentTemplate;
    
    setInput('');
    setSelectedImages([]);
    // Don't clear template automatically, user might want to generate more with it
    setIsGenerating(true);

    // Add loading assistant message
    const loadingMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: Date.now(),
    };
    addMessage(loadingMsg);

    // CREDIT DEDUCTION (Visual Studio is higher cost: 2 Credits per generation)
    if (!user) {
      setShowAuthModal(true);
      updateMessage(assistantMsgId, { content: 'Please sign in to start creating visuals.', isLoading: false });
      setIsGenerating(false);
      return;
    }

    try {
      updateMessage(assistantMsgId, { content: `Allocating GPU resources for ${imageCount} variant${imageCount > 1 ? 's' : ''}...`, isLoading: true });
      await deductCredit(2 * imageCount); // 2 Credits per image generated
    } catch (err: any) {
      updateMessage(assistantMsgId, { content: err.message, isLoading: false });
      setIsGenerating(false);
      return;
    }

    try {
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
        content: `Generated ${generatedImages.length} variant${generatedImages.length > 1 ? 's' : ''} using ${template ? TEMPLATES.find(t => t.id === template)?.label : 'Standard'} mode.`,
        images: generatedImages,
        isLoading: false,
      });

      addGalleryImages(generatedImages);

    } catch (err: any) {
      updateMessage(assistantMsgId, {
        content: `Error: ${err.message}`,
        isLoading: false,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-[#0A0A0F]/90 backdrop-blur-xl border-t border-white/5 p-4 pb-8 space-y-4">
        {/* Floating Toggle for History/Settings */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((count) => (
              <button
                key={count}
                onClick={() => setImageCount(count)}
                className={cn(
                  "w-8 h-8 rounded-lg text-[10px] font-black transition-all border flex items-center justify-center",
                  imageCount === count
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                    : "bg-zinc-900 border-zinc-800 text-zinc-500"
                )}
              >
                {count}
              </button>
            ))}
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <button className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                <MessageSquare size={18} />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] bg-[#050505] border-t-zinc-800/50 p-0 overflow-hidden flex flex-col">
              <SheetHeader className="p-4 border-b border-white/5 shrink-0">
                <SheetTitle className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-400" />
                  Studio History & Style
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-10">
                {/* Messages in Sheet */}
                <div className="space-y-6">
                  {messages.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
                       <MessageSquare size={40} className="mb-4 text-zinc-600" />
                       <p className="text-xs font-bold uppercase tracking-widest">No history yet</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={cn("flex flex-col gap-2", msg.role === 'user' ? 'items-end' : 'items-start')}>
                        <div className={cn(
                          "max-w-[90%] rounded-2xl px-4 py-3 text-[11px] leading-relaxed",
                          msg.role === 'user' 
                            ? "bg-indigo-600 text-white shadow-lg" 
                            : "bg-zinc-900 text-zinc-300 border border-zinc-800"
                        )}>
                          {msg.isLoading ? <Loader2 size={12} className="animate-spin" /> : msg.content}
                        </div>
                        {msg.images && msg.images.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            {msg.images.map((img, i) => (
                              <img 
                               key={i} 
                               src={`data:${img.mimeType};base64,${img.image}`} 
                               className="w-full aspect-square object-cover rounded-xl border border-zinc-800 shadow-2xl"
                               alt="AI result"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="h-px bg-zinc-800/50 w-full" />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Quick Settings */}
        <div className="space-y-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r.value}
                onClick={() => setAspectRatio(r.value)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0",
                  aspectRatio === r.value 
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-500"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setCurrentTemplate(currentTemplate === t.id ? null : t.id)}
                className={cn(
                  "px-4 py-2.5 rounded-2xl text-[10px] font-bold border flex items-center gap-2 shrink-0 transition-all",
                  currentTemplate === t.id 
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white"
                )}
              >
                <span className="text-sm">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="relative">
          {selectedImages.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 p-2 flex gap-2 overflow-x-auto bg-[#0A0A0F]/80 backdrop-blur-md border border-white/5 rounded-t-2xl mb-2">
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-white/10 shadow-xl">
                  <img src={`data:${img.mimeType};base64,${img.data}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(idx)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center text-white"><X size={8} /></button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-end gap-3">
             <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your vision..."
                  rows={1}
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-[24px] py-4 pl-12 pr-4 text-xs text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none shadow-2xl"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white"
                >
                  <Paperclip size={18} />
                </button>
             </div>
             <button 
                onClick={() => handleGenerate()}
                disabled={(!input.trim() && selectedImages.length === 0) || isGenerating}
                className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/20 active:scale-90 disabled:opacity-50 transition-all shrink-0"
              >
               {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
             </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
        </div>

        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#0A0A0F]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-50">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-zinc-400 text-sm font-medium">Start your artistic journey</p>
            <p className="text-zinc-600 text-xs mt-1">Describe anything and we'll bring it to life</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex flex-col gap-2", msg.role === 'user' ? 'items-end' : 'items-start')}>
             <div className={cn(
               "max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed",
               msg.role === 'user' 
                 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10" 
                 : "bg-zinc-900 text-zinc-300 border border-zinc-800/50"
             )}>
                {msg.isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" />
                    Generating...
                  </div>
                ) : msg.content}
             </div>
             {msg.images && msg.images.length > 0 && (
               <div className="grid grid-cols-2 gap-2 mt-1">
                 {msg.images.map((img, i) => (
                   <img 
                    key={i} 
                    src={`data:${img.mimeType};base64,${img.image}`} 
                    className="w-24 h-24 object-cover rounded-lg border border-zinc-800"
                   />
                 ))}
               </div>
             )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Controls & Input */}
      <div className="shrink-0 p-4 border-t border-zinc-800/50 space-y-4 bg-black/20">
        <div className="space-y-3">
          {/* Ratios */}
          <div>
            <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-black mb-2 block px-1">Aspect Ratio</label>
            <div className="flex gap-1">
              {ASPECT_RATIOS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setAspectRatio(r.value)}
                  className={cn(
                    "flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all border",
                    aspectRatio === r.value 
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image Count */}
          <div>
            <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-black mb-2 block px-1">Number of Images</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  onClick={() => setImageCount(count)}
                  className={cn(
                    "flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all border",
                    imageCount === count
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Style Templates */}
          <div>
            <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-black mb-2 block px-1">Style Template</label>
            <div className="grid grid-cols-2 gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setCurrentTemplate(currentTemplate === t.id ? null : t.id)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-[10px] font-bold transition-all border flex items-center gap-2 text-left",
                    currentTemplate === t.id 
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg" 
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <span className="text-sm">{t.icon}</span>
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Input Area */}
        <div className="space-y-3 pt-2">
          {selectedImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative w-12 h-12 shrink-0 group">
                  <img src={`data:${img.mimeType};base64,${img.data}`} className="w-full h-full object-cover rounded-lg border border-indigo-500/30" />
                  <button onClick={() => removeImage(idx)} className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400"><X size={8} /></button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Describe your vision..."
              rows={2}
              className="w-full bg-[#111118] border border-zinc-800/60 rounded-xl py-3 pl-4 pr-12 text-white text-xs focus:outline-none focus:border-indigo-500/40 resize-none transition-all"
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-1">
               <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-zinc-600 hover:text-indigo-400 transition-colors">
                 <Paperclip size={16} />
               </button>
               <button 
                 onClick={() => handleGenerate()}
                 disabled={(!input.trim() && selectedImages.length === 0) || isGenerating}
                 className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-90"
               >
                 {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
               </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
