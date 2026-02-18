'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Sparkles,
  Paperclip,
  X,
  Loader2,
  Minus,
  Plus,
  Wand2,
  Palette,
  Smartphone,
  Code2,
  RefreshCw,
  Zap,
  PlusCircle,
  Globe,
  Settings2,
  MessageSquare
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAppDesignerStore, AppDesignerMessage, GeneratedScreen, DesignerMode } from '@/lib/store/useAppDesignerStore';
import { cn } from '@/lib/utils';
import { planAppAction } from '@/lib/actions/ai.actions';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { deductCredit } from '@/lib/credits-actions';
import { AuthModal } from '@/components/studio/AuthModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_APP_SCREENS = ['Welcome', 'Login', 'Home', 'Profile', 'Settings'];
const DEFAULT_WEB_SCREENS = ['Landing', 'Features', 'Pricing', 'About', 'Contact'];

const COMPONENT_SUGGESTIONS = [
  'Glassmorphism pricing card',
  'Animated testimonial carousel',
  'Premium dark mode profile card',
  'SaaS feature section with icons',
  'Neon glow stats dashboard',
  'Product card with hover effects',
  'Gradient CTA banner',
  'Animated notification toast',
];

const PRESET_PALETTES = [
  { name: 'Cyber Mint', p: '00FFC8', s: '111111', a: 'F5E1C8' },
  { name: 'Hot Pink', p: 'FF3366', s: '202020', a: 'FFFFFF' },
  { name: 'Luxury Gold', p: 'FFD700', s: '0A0A0A', a: 'FFFCF2' },
  { name: 'Ocean Blue', p: '0070F3', s: '020617', a: 'FFFFFF' },
  { name: 'Midnight', p: '6366F1', s: '0A0A0F', a: '2DD4BF' },
];

const isColorLight = (hex: string) => {
  const color = hex.replace('#', '');
  if (color.length !== 6) return false;
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
};

function ColorInput({ label, value, onChange, placeholder, dotColor, disabled }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  dotColor: string;
  disabled?: boolean;
}) {
  const isValid = /^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
  const display = value && isValid ? `#${value}` : (value.startsWith('#') ? value : null);

  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="relative group/picker flex items-center gap-2 w-full bg-[#111118] border border-zinc-800/60 rounded-lg px-2.5 py-1.5 transition-all focus-within:border-cyan-500/40">
        <div className="relative shrink-0 w-5 h-5">
           <input 
             type="color" 
             value={display || dotColor}
             onChange={(e) => onChange(e.target.value)}
             disabled={disabled}
             className="absolute inset-0 opacity-0 cursor-not-allowed z-10 w-full h-full disabled:cursor-not-allowed"
           />
           <div 
             className={cn(
               "w-full h-full rounded border border-white/10 shadow-sm transition-opacity",
               disabled && "opacity-50"
             )}
             style={{ backgroundColor: display || dotColor }}
           />
        </div>
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{placeholder}</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Hex"
          className="bg-transparent border-none p-0 text-white text-[10px] font-mono focus:ring-0 w-full placeholder:text-zinc-700 disabled:opacity-50"
        />
      </div>
    </div>
  );
}

export function AppDesignerChatPanel() {
  const { 
    messages, 
    isGenerating, 
    addMessage, 
    updateMessage, 
    addGalleryScreens, 
    setIsGenerating, 
    builderMode, 
    setBuilderMode, 
    clearGallery,
    galleryScreens 
  } = useAppDesignerStore();
  const { user, profile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const router = useRouter();

  const [screens, setScreens] = useState<string[]>(builderMode === 'web' ? DEFAULT_WEB_SCREENS : DEFAULT_APP_SCREENS);

  const updateMode = (mode: DesignerMode) => {
    if (mode === builderMode) return;
    clearGallery();
    setBuilderMode(mode);
    setScreens(mode === 'web' ? DEFAULT_WEB_SCREENS : DEFAULT_APP_SCREENS);
    router.push(`/studio/builder?type=${mode}`, { scroll: false });
  };

  const [appDescription, setAppDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [accentColor, setAccentColor] = useState('');
  const [rounding, setRounding] = useState('12px');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [isPlanning, setIsPlanning] = useState(false);
  const [imageDatas, setImageDatas] = useState<{ data: string; mimeType: string }[]>([]);
  const [addScreenInput, setAddScreenInput] = useState('');
  const [isAddingScreen, setIsAddingScreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasProcessedUrl = useRef(false);
  const generationLockRef = useRef(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Landing page auto-trigger — runs on mount and syncs with parameters
  useEffect(() => {
    if (hasProcessedUrl.current) return;
    
    // 1. Sync builder mode from URL type param if present
    const urlType = searchParams.get('type') as DesignerMode | null;
    if (urlType && urlType !== builderMode) {
      setBuilderMode(urlType);
      return;
    }

    const p = searchParams.get('prompt');
    const u = searchParams.get('url');
    const isPlan = searchParams.get('plan') === 'true';
    
    if ((p || u) && messages.length === 0 && !isGenerating && !isPlanning) {
      hasProcessedUrl.current = true;
      const decodedP = p ? decodeURIComponent(p) : '';
      const decodedU = u ? decodeURIComponent(u) : '';
      
      if (decodedU) setSourceUrl(decodedU);
      if (decodedP) setAppDescription(decodedP);
      
      if (decodedU && builderMode === 'web') {
        setTimeout(() => handleScrapeAndPlan(decodedU, decodedP, isPlan), 500);
      } else if (decodedP) {
        if (isPlan) {
          setTimeout(() => handlePlan(decodedP), 500);
        } else {
          // Trigger Generation immediately
          setTimeout(() => {
            if (builderMode === 'app' || builderMode === 'web') {
              // Ensure we have some base colors for auto-gen if none set
              if (!primaryColor) {
                const palettes = [
                  { p: 'FF3366', s: '202020', a: 'FFFFFF' }, // Cinematic Pink/Red
                  { p: '00FFC8', s: '111111', a: 'F5E1C8' }, // Mint Cyber
                  { p: 'FFD700', s: '0A0A0A', a: 'FFFCF2' }  // Luxury Gold
                ];
                const choice = palettes[Math.floor(Math.random() * palettes.length)];
                setPrimaryColor(choice.p);
                setSecondaryColor(choice.s);
                setAccentColor(choice.a);
              }
              handleGenerateApp();
            } else {
              handleGenerateComponent();
            }
          }, 800);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builderMode, searchParams, messages.length, isGenerating, isPlanning]);



  const processFiles = (files: File[]) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImageDatas(prev => [...prev.slice(0, 4), { data: base64, mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(Array.from(files));
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

  const handleScrapeAndPlan = async (url: string, userPrompt: string, isPlanAction: boolean = false) => {
    if (url.trim() && !url.trim().toLowerCase().startsWith('https://')) {
      const asstMsgId = `msg_err_${Date.now()}`;
      addMessage({ id: `msg_u_err_${Date.now()}`, role: 'user', content: `Analyze URL: ${url}`, timestamp: Date.now() });
      addMessage({ 
        id: asstMsgId, 
        role: 'assistant', 
        content: '❌ Security Error: Please provide a secure URL starting with https:// for redesigning.', 
        isLoading: false, 
        timestamp: Date.now() 
      });
      return;
    }

    setIsPlanning(true);
    setAppDescription(`⚡ Redesigning ${url}...`);
    
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      if (res.ok) {
        const data = await res.json();
        const truncatedHtml = data.html ? data.html.slice(0, 15000) : '';
        
        // Pick a unique high-end palette to avoid common boring colors
        const uniquePalettes = [
          { p: '#FF3D00', s: '#0F172A', a: '#F8FAFC' }, // International Orange / Navy
          { p: '#7C3AED', s: '#020617', a: '#ec4899' }, // Deep Violet / Indigo / Pink
          { p: '#10B981', s: '#050505', a: '#34D399' }, // Emerald / Obsidian
          { p: '#F59E0B', s: '#18181B', a: '#FEF3C7' }, // Amber / Zinc
        ];
        const selected = uniquePalettes[Math.floor(Math.random() * uniquePalettes.length)];
        
        setPrimaryColor(selected.p.replace('#', ''));
        setSecondaryColor(selected.s.replace('#', ''));
        setAccentColor(selected.a.replace('#', ''));

        const richPrompt = `DEEP LUXURY RESPONSIVE REDESIGN: ${data.title}\n\nSOURCE CODE foundation: \n${truncatedHtml}\n\nCONTENT (DO NOT CHANGE): \n${data.text}\n\nSTYLE GOAL: ${userPrompt || 'Create a world-class, sexy, professional luxury redesign.'}\n\nINSTRUCTION: REDESIGN THE PROVIDED CODE INTO A RESPONSIVE MASTERPIECE. \n– Use the provided color palette: Primary ${selected.p}.\n– Layout: BENTO GRID complexity, perfectly responsive (mobile to desktop).\n– Aesthetic: Sophisticated glassmorphism, fluid typography, mesh gradients.\n– Viewport: Use Tailwind responsive prefixes (sm:, md:, lg:) to ensure it looks stunning on both iPhone and Ultra-wide monitors.`;
        
        // We set the user-facing description to something clean
        setAppDescription(`⚡ Expertly redesigning ${data.title} with a luxury aesthetic...`);

        if (isPlanAction) {
          const planData = await planAppAction(richPrompt);
          if (planData.detailedPrompt) setAppDescription(planData.detailedPrompt);
          
          setTimeout(() => {
            handleGenerateApp(planData.screens || DEFAULT_WEB_SCREENS, { 
              primary: planData.primaryColor || selected.p, 
              secondary: planData.secondaryColor || selected.s, 
              accent: planData.accentColor || selected.a 
            }, richPrompt);
          }, 300);
        } else {
          // Direct generation with the rich hidden context
          setTimeout(() => handleGenerateApp(DEFAULT_WEB_SCREENS, undefined, richPrompt), 500);
        }
      } else {
        throw new Error('Scraping failed');
      }
    } catch (err) {
      console.error('Scrape error:', err);
      const fallback = userPrompt || `Redesign ${url}`;
      setAppDescription(fallback);
      if (isPlanAction) handlePlan(fallback);
      else setTimeout(() => handleGenerateApp(), 500);
    } finally {
      setIsPlanning(false);
    }
  };

  const removeImage = (index: number) => {
    setImageDatas(prev => prev.filter((_, i) => i !== index));
  };

  // ── handle Plan (Magic) ──
  const handlePlan = async (overridePrompt?: string) => {
    const promptToPlan = overridePrompt || appDescription;
    if (!promptToPlan.trim() || isPlanning) return;
    setIsPlanning(true);

    try {
      const data = await planAppAction(promptToPlan);
      
      const pColor = data.primaryColor || '#00cfcf';
      const sColor = data.secondaryColor || '#00ffa3';
      const aColor = data.accentColor || '#f5e1c8';

      if (data.detailedPrompt) setAppDescription(data.detailedPrompt);
      setPrimaryColor(pColor.replace('#', ''));
      setSecondaryColor(sColor.replace('#', ''));
      setAccentColor(aColor.replace('#', ''));

      // Auto-generate based on mode
      setTimeout(() => {
        if (builderMode === 'app' || builderMode === 'web') {
          handleGenerateApp(data.screens || (builderMode === 'app' ? DEFAULT_APP_SCREENS : DEFAULT_WEB_SCREENS), { 
            primary: pColor, 
            secondary: sColor, 
            accent: aColor 
          });
        } else {
          handleGenerateComponent();
        }
      }, 300);

    } catch (err: any) {
      console.error('[AppBuilder Plan] Error:', err);
      alert(`Magic Plan failed: ${err.message}`);
    } finally {
      setIsPlanning(false);
    }
  };

  // ── Generate App Screens ──
  const handleGenerateApp = async (forcedScreens?: string[], forcedColors?: { primary: string, secondary: string, accent: string }, hiddenRichPrompt?: string) => {
    const defaultScreens = builderMode === 'web' ? DEFAULT_WEB_SCREENS : DEFAULT_APP_SCREENS;
    const currentScreens = forcedScreens || defaultScreens;
    const currentPrimary = forcedColors?.primary?.replace('#', '') || primaryColor;
    const currentSecondary = forcedColors?.secondary?.replace('#', '') || secondaryColor;
    const currentAccent = forcedColors?.accent?.replace('#', '') || accentColor;

    if (!appDescription.trim() || currentScreens.length === 0 || isGenerating || generationLockRef.current) return;
    generationLockRef.current = true;

    const userMsgId = `msg_u_${Date.now()}`;
    const asstMsgId = `msg_a_${Date.now()}`;

    // Use hiddenRichPrompt if available, otherwise fallback to the user visible description
    const generationPrompt = hiddenRichPrompt || appDescription;

    // Determine a consistent theme for the entire session
    const determinedTheme = isColorLight(currentPrimary) ? 'light' : 'dark';
    
    const contentToDisplay = imageDatas.length > 0 
      ? `${appDescription} (${imageDatas.length} images attached)`
      : appDescription;

    addMessage({ id: userMsgId, role: 'user', content: contentToDisplay, timestamp: Date.now() });
    setIsGenerating(true);
    addMessage({ id: asstMsgId, role: 'assistant', content: '', isLoading: true, timestamp: Date.now() });

    // CREDIT DEDUCTION ENGINE
    if (!user) {
      setShowAuthModal(true);
      updateMessage(asstMsgId, { content: 'Please sign in to start generating your project.', isLoading: false });
      setIsGenerating(false);
      generationLockRef.current = false;
      return;
    }

    try {
      updateMessage(asstMsgId, { content: `Allocating studio resources...`, isLoading: true });
      await deductCredit(2); // Flat 2 credits for whole app designing
    } catch (err: any) {
      updateMessage(asstMsgId, { content: err.message, isLoading: false });
      setIsGenerating(false);
      generationLockRef.current = false;
      return;
    }

    const generated: GeneratedScreen[] = [];
    let errorCount = 0;
    
    for (let i = 0; i < currentScreens.length; i++) {
      const screenName = currentScreens[i];

      updateMessage(asstMsgId, {
        content: `⚡ Writing code for "${screenName}"... (${i + 1}/${currentScreens.length})`,
        screens: [...generated],
        isLoading: true,
      });

      try {
        const response = await fetch('/api/generate/screen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appDescription: generationPrompt.trim(),
            screenName,
            colorHex: currentPrimary || '',
            secondaryColor: currentSecondary || '',
            accentColor: currentAccent || '',
            screenIndex: i + 1,
            totalScreens: currentScreens.length,
            allScreenNames: currentScreens,
            images: imageDatas,
            mode: builderMode,
            theme: determinedTheme,
            stylingContext: generated.length > 0 ? generated[0].code : undefined,
            rounding,
            fontFamily,
          }),
        });

        if (!response.ok) {
          const errorMsg = await response.text();
          throw new Error(errorMsg || `API error ${response.status}`);
        }

        const data = await response.json();
        let finalCode = data.code;

        const screen: GeneratedScreen = {
          id: `scr_${Date.now()}_${i}`,
          code: finalCode,
          screenName,
          prompt: appDescription,
          timestamp: Date.now(),
          mode: builderMode,
        };
        generated.push(screen);
        addGalleryScreens([screen]);

        updateMessage(asstMsgId, {
          content: `✅ Built ${generated.length} of ${currentScreens.length} screens...`,
          screens: [...generated],
          isLoading: i < currentScreens.length - 1,
        });

        // Delay between screens to stay under Gemini API rate limits (1 call per ~3s)
        if (i < currentScreens.length - 1) {
          await new Promise(r => setTimeout(r, 3000));
        }
      } catch (err: any) {
        console.error(`[AppBuilder] Screen "${screenName}" failed:`, err?.message || err);
        errorCount++;
        // Longer pause after error — likely a rate limit, give it time to recover
        await new Promise(r => setTimeout(r, 5000));
      }
    }

    updateMessage(asstMsgId, {
      content: generated.length > 0
        ? `🚀 Generated ${generated.length} live screen${generated.length > 1 ? 's' : ''} for your app!${errorCount > 0 ? ` (${errorCount} failed)` : ''} All screens are rendered live on the canvas.`
        : 'All screen generations failed. Please try again.',
      screens: generated,
      isLoading: false,
    });

    setIsGenerating(false);
    generationLockRef.current = false;
  };

  // ── Generate UI Component (Dark + Light mode in parallel) ──
  const handleGenerateComponent = async () => {
    if (!appDescription.trim() || isGenerating || generationLockRef.current) return;
    generationLockRef.current = true;

    const userMsgId = `msg_u_${Date.now()}`;
    const asstMsgId = `msg_a_${Date.now()}`;

    const contentWithImages = imageDatas.length > 0 
      ? `🃏 ${appDescription} (${imageDatas.length} images attached)`
      : `🃏 ${appDescription}`;

    addMessage({ id: userMsgId, role: 'user', content: contentWithImages, timestamp: Date.now() });
    setIsGenerating(true);
    addMessage({ id: asstMsgId, role: 'assistant', content: '', isLoading: true, timestamp: Date.now() });

    // CREDIT DEDUCTION ENGINE
    if (!user) {
      setShowAuthModal(true);
      updateMessage(asstMsgId, { content: 'Please sign in to start generating components.', isLoading: false });
      setIsGenerating(false);
      generationLockRef.current = false;
      return;
    }

    // Components are free as per user request
    updateMessage(asstMsgId, {
      content: `✨ Generating Dark & Light mode variants...`,
      isLoading: true,
    });

    const componentName = appDescription.trim().slice(0, 40);
    const baseBody = {
      description: appDescription.trim(),
      primaryColor: primaryColor || '',
      secondaryColor: secondaryColor || '',
      accentColor: accentColor || '',
      images: imageDatas,
    };

    // Fire both requests in parallel
    const fetchVariant = async (theme: 'dark' | 'light') => {
      try {
        const response = await fetch('/api/generate/component', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...baseBody,
            theme,
            instruction: appDescription,
            images: imageDatas,
            stylingContext: galleryScreens.length > 0 ? galleryScreens[0].code : undefined,
            rounding,
            fontFamily,
          }),
        });

        if (!response.ok) {
          const errorMsg = await response.text();
          throw new Error(errorMsg || `API error ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        console.error(`${theme} variant failed:`, err);
        throw err;
      }
    };

    try {
      const results = await Promise.allSettled([
        fetchVariant('dark'),
        fetchVariant('light'),
      ]);

      const screens: GeneratedScreen[] = [];
      const labels = ['Dark', 'Light'];

      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          screens.push({
            id: `comp_${Date.now()}_${labels[i].toLowerCase()}`,
            code: result.value.code,
            screenName: `${componentName} — ${labels[i]}`,
            prompt: appDescription,
            timestamp: Date.now() + i,
            mode: 'component',
          });
        }
      });

      if (screens.length > 0) {
        addGalleryScreens(screens);
        updateMessage(asstMsgId, {
          content: `🎉 Generated ${screens.length} variant${screens.length > 1 ? 's' : ''} (${screens.map(s => s.screenName.split(' — ')[1]).join(' & ')})! Check the canvas.`,
          screens,
          isLoading: false,
        });
      } else {
        updateMessage(asstMsgId, {
          content: `❌ Both variants failed. Please try again.`,
          isLoading: false,
        });
      }
    } finally {
      setIsGenerating(false);
      generationLockRef.current = false;
    }
  };

  // ── Add a single new screen after initial generation ──
  const handleAddSingleScreen = async () => {
    const screenName = addScreenInput.trim();
    if (!screenName || !appDescription.trim() || isGenerating || isAddingScreen) return;
    setIsAddingScreen(true);
    setAddScreenInput('');

    const asstMsgId = `msg_add_${Date.now()}`;
    addMessage({ id: `msg_u_add_${Date.now()}`, role: 'user', content: `Add screen: ${screenName}`, timestamp: Date.now() });
    addMessage({ id: asstMsgId, role: 'assistant', content: '', isLoading: true, timestamp: Date.now() });

    if (!user) {
      setShowAuthModal(true);
      updateMessage(asstMsgId, { content: 'Please sign in to add more screens.', isLoading: false });
      setIsAddingScreen(false);
      return;
    }

    try {
      updateMessage(asstMsgId, { content: `Allocating resources for "${screenName}"...`, isLoading: true });
      await deductCredit(1); // 1 Credit for extra screen
    } catch (err: any) {
      updateMessage(asstMsgId, { content: err.message, isLoading: false });
      setIsAddingScreen(false);
      return;
    }

    try {
      updateMessage(asstMsgId, { content: `⚡ Generating "${screenName}" screen...`, isLoading: true });

      const response = await fetch('/api/generate/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appDescription: appDescription.trim(),
          screenName,
          colorHex: primaryColor || '',
          secondaryColor: secondaryColor || '',
          accentColor: accentColor || '',
          screenIndex: 1,
          totalScreens: 1,
          allScreenNames: [screenName],
          images: imageDatas,
          mode: builderMode,
          theme: isColorLight(primaryColor) ? 'light' : 'dark',
          stylingContext: galleryScreens.length > 0 ? galleryScreens[0].code : undefined,
          rounding,
          fontFamily,
        }),
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || `API error ${response.status}`);
      }

      const data = await response.json();
      let finalCode = data.code;

      // Phase 2: Asset generation
      updateMessage(asstMsgId, { content: `🎨 Generating images for "${screenName}"...`, isLoading: true });
      try {
        const assetRes = await fetch('/api/generate/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: finalCode, appDescription: appDescription.trim(), screenName }),
        });
        
        if (assetRes.ok) {
          const assetData = await assetRes.json();
          if (assetData.code) finalCode = assetData.code;
        }
      } catch (assetErr) {
        console.warn(`[AppBuilder] Asset generation failed for "${screenName}":`, assetErr);
      }

      const screen: GeneratedScreen = {
        id: `scr_${Date.now()}`,
        code: finalCode,
        screenName,
        prompt: appDescription,
        timestamp: Date.now(),
        mode: builderMode,
      };
      addGalleryScreens([screen]);

      updateMessage(asstMsgId, { content: `✅ "${screenName}" screen is live on the canvas!`, isLoading: false });
    } catch (err: any) {
      console.error(`[AppBuilder] Add screen "${screenName}" failed:`, err?.message || err);
      updateMessage(asstMsgId, { content: `❌ Failed to generate "${screenName}". Please try again.`, isLoading: false });
    } finally {
      setIsAddingScreen(false);
    }
  };

  const handleGenerate = (builderMode === 'app' || builderMode === 'web') ? handleGenerateApp : handleGenerateComponent;
  const isProjectStarted = (builderMode === 'app' || builderMode === 'web') && messages.length > 0;
  const canGenerate = appDescription.trim() && !isGenerating && !isPlanning && !isProjectStarted;

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-[#0A0A0F]/95 backdrop-blur-2xl border-t border-white/5 p-4 pb-8">
        {/* Input Area */}
        <div className="relative">
          {imageDatas.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 p-2 flex gap-2 overflow-x-auto bg-[#0A0A0F]/80 backdrop-blur-md border border-white/5 rounded-t-2xl mb-2">
              {imageDatas.map((img, idx) => (
                <div key={idx} className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-white/10 shadow-xl">
                  <img src={img.data} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(idx)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center text-white"><X size={8} /></button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-2">
             <Sheet>
               <SheetTrigger asChild>
                 <button className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 shadow-xl active:scale-95">
                   <Settings2 size={20} />
                 </button>
               </SheetTrigger>
               <SheetContent side="bottom" className="h-[80vh] bg-[#050505] border-t-zinc-800/50 p-0 overflow-hidden flex flex-col rounded-t-[2rem]">
                 <SheetHeader className="p-6 border-b border-white/5 shrink-0">
                   <SheetTitle className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
                     <Settings2 size={16} className="text-cyan-400" />
                     Designer Settings
                   </SheetTitle>
                 </SheetHeader>
                 
                 <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-12">
                   {/* Mode Switcher */}
                   <div className="space-y-3">
                     <label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">Output Type</label>
                     <div className="grid grid-cols-3 gap-2">
                       {(['app', 'web', 'component'] as DesignerMode[]).map((mode) => (
                         <button
                           key={mode}
                           onClick={() => updateMode(mode)}
                           className={cn(
                             "py-3 rounded-xl text-[10px] font-black transition-all border uppercase",
                             builderMode === mode 
                               ? "bg-cyan-600 border-cyan-500 text-white shadow-lg" 
                               : "bg-zinc-900 border-zinc-800 text-zinc-500"
                           )}
                         >
                           {mode}
                         </button>
                       ))}
                     </div>
                   </div>

                   {/* Theme Colors */}
                   <div className="space-y-3">
                     <div className="flex items-center justify-between">
                       <label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">Brand Colors</label>
                       <Select onValueChange={(val) => {
                         const palette = PRESET_PALETTES.find(p => p.name === val);
                         if (palette) {
                           setPrimaryColor(palette.p);
                           setSecondaryColor(palette.s);
                           setAccentColor(palette.a);
                         }
                       }}>
                         <SelectTrigger className="h-5 border-zinc-800 bg-zinc-950/50 px-2 text-[9px] text-cyan-500 font-bold uppercase transition-colors hover:text-cyan-400">
                           <SelectValue placeholder="Presets" />
                         </SelectTrigger>
                         <SelectContent position="popper" className="bg-[#0A0A0F] border-zinc-800 z-[100] shadow-2xl">
                           {PRESET_PALETTES.map(p => (
                             <SelectItem key={p.name} value={p.name} className="text-[11px] text-zinc-400 focus:text-white transition-colors">
                               <div className="flex items-center gap-2">
                                 <div className="flex gap-0.5">
                                   <div className="w-2 h-2 rounded-full border border-white/10" style={{ backgroundColor: `#${p.p}` }} />
                                   <div className="w-2 h-2 rounded-full border border-white/10" style={{ backgroundColor: `#${p.s}` }} />
                                 </div>
                                 {p.name}
                               </div>
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-3 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                        <ColorInput label="Primary" value={primaryColor} onChange={setPrimaryColor} placeholder="FF0000" dotColor="#06b6d4" disabled={isGenerating} />
                        <ColorInput label="Secondary" value={secondaryColor} onChange={setSecondaryColor} placeholder="00FF00" dotColor="#14b8a6" disabled={isGenerating} />
                        <ColorInput label="Accent" value={accentColor} onChange={setAccentColor} placeholder="FFFFFF" dotColor="#f5e1c8" disabled={isGenerating} />
                     </div>
                   </div>

                   {/* Visual Tokens (Mobile) */}
                   <div className="space-y-4">
                     <label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">Visual Tokens</label>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">Rounding</span>
                          <Select value={rounding} onValueChange={setRounding}>
                            <SelectTrigger className="bg-zinc-950 border-zinc-800 text-[11px] h-10 text-zinc-300">
                              <SelectValue placeholder="Rounding" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="bg-[#0A0A0F] border-zinc-800 z-[100] shadow-2xl">
                              <SelectItem value="0px" className="text-zinc-400 focus:text-white">Sharp</SelectItem>
                              <SelectItem value="8px" className="text-zinc-400 focus:text-white">Soft</SelectItem>
                              <SelectItem value="12px" className="text-zinc-400 focus:text-white">Modern</SelectItem>
                              <SelectItem value="24px" className="text-zinc-400 focus:text-white">Round</SelectItem>
                              <SelectItem value="999px" className="text-zinc-400 focus:text-white">Pill</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">Typography</span>
                          <Select value={fontFamily} onValueChange={setFontFamily}>
                            <SelectTrigger className="bg-zinc-950 border-zinc-800 text-[11px] h-10 text-zinc-300">
                              <SelectValue placeholder="Font" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="bg-[#0A0A0F] border-zinc-800 z-[100] shadow-2xl">
                              <SelectItem value="Inter" className="text-zinc-400 focus:text-white">Inter</SelectItem>
                              <SelectItem value="Playfair Display" className="text-zinc-400 focus:text-white font-serif">Playfair</SelectItem>
                              <SelectItem value="Clash Display" className="text-zinc-400 focus:text-white">Clash</SelectItem>
                              <SelectItem value="Syne" className="text-zinc-400 focus:text-white">Syne</SelectItem>
                              <SelectItem value="Cabinet Grotesk" className="text-zinc-400 focus:text-white">Cabinet</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                     </div>
                   </div>

                   <div className="h-px bg-zinc-800/50 w-full my-4" />

                   {/* Blueprint & History */}
                   <div className="space-y-4">
                     <label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">Session Log</label>
                     <div className="space-y-4">
                        {messages.length === 0 ? (
                          <div className="py-10 text-center opacity-30">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">No session history</p>
                          </div>
                        ) : (
                          messages.map((msg) => (
                            <div key={msg.id} className={cn("flex flex-col gap-2", msg.role === 'user' ? 'items-end' : 'items-start')}>
                              <div className={cn(
                                "max-w-[85%] rounded-2xl px-4 py-3 text-[11px] leading-relaxed",
                                msg.role === 'user' ? "bg-cyan-600 text-white" : "bg-zinc-900 text-zinc-300 border border-zinc-800"
                              )}>
                                {msg.isLoading ? <Loader2 size={12} className="animate-spin" /> : msg.content}
                              </div>
                            </div>
                          ))
                        )}
                     </div>
                   </div>
                 </div>
               </SheetContent>
             </Sheet>

             <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  disabled={isGenerating || isPlanning || isProjectStarted}
                  placeholder={isProjectStarted ? "Locked" : "Describe app/web..."}
                  rows={1}
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-[20px] py-3.5 pl-10 pr-4 text-[13px] text-white focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all resize-none shadow-2xl"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 hover:text-white"
                >
                  <Paperclip size={16} />
                </button>
             </div>
             
             <button 
                onClick={() => sourceUrl.trim() && builderMode === 'web' ? handleScrapeAndPlan(sourceUrl, appDescription, true) : handlePlan()}
                disabled={(!appDescription.trim() && !sourceUrl.trim()) || isPlanning}
                className="w-11 h-11 rounded-xl bg-zinc-800 text-cyan-400 flex items-center justify-center shadow-lg border border-white/5 active:scale-95 disabled:opacity-50 transition-all shrink-0"
              >
               {isPlanning ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
             </button>

             <button 
                onClick={() => handleGenerate()}
                disabled={!canGenerate}
                className="w-11 h-11 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-lg shadow-cyan-600/20 active:scale-95 disabled:opacity-50 transition-all shrink-0"
              >
               {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
             </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
          
          {builderMode === 'web' && !isProjectStarted && (
             <div className="mt-3 px-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/40 border border-amber-500/20 rounded-xl">
                  <Globe size={12} className="text-amber-500/60" />
                  <input 
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="Website URL to redesign..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-[10px] text-amber-500 placeholder:text-zinc-700 uppercase tracking-widest font-black"
                  />
                </div>
             </div>
          )}
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
      {/* Mode Switcher - Dropdown */}
      <div className="shrink-0 px-6 py-4 border-b border-white/5 bg-[#0D0D12]/50 backdrop-blur-md">
        <Select value={builderMode} onValueChange={(v) => updateMode(v as DesignerMode)}>
          <SelectTrigger className="w-full bg-white/[0.03] border-white/5 rounded-xl h-12 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all shadow-2xl">
            <SelectValue placeholder="Select Designer Mode" />
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" className="bg-[#0D0D12] border-white/5 text-white mt-2">
            <SelectItem value="app" className="py-3 focus:bg-cyan-600/20 focus:text-cyan-400">
              <div className="flex items-center gap-3">
                <Smartphone size={14} className="text-cyan-500" />
                <span>App Designer</span>
              </div>
            </SelectItem>
            <SelectItem value="web" className="py-3 focus:bg-amber-600/20 focus:text-amber-400">
              <div className="flex items-center gap-3">
                <Globe size={14} className="text-amber-500" />
                <span>Web Designer</span>
              </div>
            </SelectItem>
            <SelectItem value="component" className="py-3 focus:bg-violet-600/20 focus:text-violet-400">
              <div className="flex items-center gap-3">
                <Code2 size={14} className="text-violet-500" />
                <span>UI Component</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <div className={cn(
              "w-16 h-16 rounded-2xl border flex items-center justify-center transition-colors duration-500",
              builderMode === 'app' && "bg-cyan-500/20 border-cyan-500/20",
              builderMode === 'component' && "bg-violet-500/20 border-violet-500/20",
              builderMode === 'web' && "bg-amber-500/20 border-amber-500/20"
            )}>
              {builderMode === 'app' && <Smartphone className="w-8 h-8 text-cyan-500" />}
              {builderMode === 'component' && <Code2 className="w-8 h-8 text-violet-500" />}
              {builderMode === 'web' && <Globe className="w-8 h-8 text-amber-500" />}
            </div>
            <p className="text-zinc-500 text-[11px] max-w-[200px]">
              {builderMode === 'app' && 'Describe your app idea and we\'ll auto-generate 5 core screens.'}
              {builderMode === 'component' && 'Describe a UI component and we\'ll generate a stunning animated React component.'}
              {builderMode === 'web' && 'Describe a website and we\'ll generate full-width responsive landing pages.'}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex flex-col gap-2", msg.role === 'user' ? 'items-end' : 'items-start')}>
            <div className={cn(
              "max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed",
              msg.role === 'user' 
                ? (
                    builderMode === 'app' ? "bg-cyan-600/20 text-cyan-50 border border-cyan-500/30" :
                    builderMode === 'web' ? "bg-amber-600/20 text-amber-50 border border-amber-500/30" :
                    "bg-violet-600/20 text-violet-50 border border-violet-500/30"
                  )
                : "bg-zinc-900 text-zinc-300 border border-zinc-800/50"
            )}>
              {msg.isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin" />
                  Processing...
                </div>
              ) : msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Configuration & Input Bottom Section */}
      <div className="shrink-0 p-4 border-t border-zinc-800/50 space-y-3 bg-black/20">
        {/* Add Screen input — only show after initial generation has happened */}
        {(builderMode === 'app' || builderMode === 'web') && messages.length > 0 && !isGenerating && (
          <div>
            <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-black mb-1.5 block px-1">
              {builderMode === 'web' ? 'Add Page' : 'Add Screen'}
            </label>
            <div className="flex gap-2">
              <input
                value={addScreenInput}
                onChange={(e) => setAddScreenInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddSingleScreen(); }}
                placeholder="e.g. Checkout, Chat, Analytics..."
                disabled={isAddingScreen}
                className="flex-1 bg-[#111118] border border-zinc-800/60 rounded-lg px-3 py-2 text-white text-[11px] focus:outline-none focus:border-cyan-500/40 transition-all placeholder:text-zinc-600"
              />
              <button
                onClick={handleAddSingleScreen}
                disabled={!addScreenInput.trim() || isAddingScreen || !appDescription.trim()}
                className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isAddingScreen ? <Loader2 size={12} className="animate-spin" /> : <PlusCircle size={12} />}
                {isAddingScreen ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {/* Component mode suggestions */}
        {builderMode === 'component' && (
          <div className="pb-2">
            <label className="text-[8px] text-zinc-600 uppercase tracking-[0.2em] font-black mb-1.5 block px-1 opacity-60">QUICK SUGGESTIONS</label>
            <div className="flex flex-wrap gap-1">
              {COMPONENT_SUGGESTIONS.slice(0, 4).map(s => (
                <button
                  key={s}
                  onClick={() => setAppDescription(s)}
                  className="px-2 py-1 rounded-md text-[9px] font-medium bg-[#111118] border border-zinc-800/40 text-zinc-500 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all whitespace-nowrap"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product / Brand Kit */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Brand Colors</label>
              <Select onValueChange={(val) => {
                const palette = PRESET_PALETTES.find(p => p.name === val);
                if (palette) {
                  setPrimaryColor(palette.p);
                  setSecondaryColor(palette.s);
                  setAccentColor(palette.a);
                }
              }}>
                <SelectTrigger className="h-4 border-none bg-transparent p-0 text-[8px] text-cyan-500/60 font-black uppercase hover:text-cyan-400">
                  <SelectValue placeholder="Presets" />
                </SelectTrigger>
                <SelectContent position="popper" className="bg-[#0A0A0F] border-zinc-800 z-[100]">
                  {PRESET_PALETTES.map(p => (
                    <SelectItem key={p.name} value={p.name} className="text-[10px] text-zinc-400 focus:text-white">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `#${p.p}` }} />
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `#${p.s}` }} />
                        </div>
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <ColorInput label="P" value={primaryColor} onChange={setPrimaryColor} placeholder="Primary" dotColor="#06b6d4" disabled={isGenerating || isPlanning} />
              <ColorInput label="S" value={secondaryColor} onChange={setSecondaryColor} placeholder="Secondary" dotColor="#14b8a6" disabled={isGenerating || isPlanning} />
              <ColorInput label="A" value={accentColor} onChange={setAccentColor} placeholder="Accent" dotColor="#f5e1c8" disabled={isGenerating || isPlanning} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block px-1">Visual Tokens</label>
            <div className="space-y-2 bg-zinc-900/30 p-2 rounded-xl border border-white/5">
               <div className="space-y-1">
                 <span className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest px-1">Rounding</span>
                 <Select value={rounding} onValueChange={setRounding}>
                   <SelectTrigger className="bg-zinc-950/50 border-zinc-800/40 text-[10px] h-8 text-zinc-300">
                     <SelectValue placeholder="Rounding" />
                   </SelectTrigger>
                   <SelectContent position="popper" className="bg-[#0A0A0F] border-zinc-800 z-[100]">
                     <SelectItem value="0px" className="text-zinc-400 focus:text-white">Sharp</SelectItem>
                     <SelectItem value="8px" className="text-zinc-400 focus:text-white">Soft</SelectItem>
                     <SelectItem value="12px" className="text-zinc-400 focus:text-white">Modern</SelectItem>
                     <SelectItem value="24px" className="text-zinc-400 focus:text-white">Round</SelectItem>
                     <SelectItem value="999px" className="text-zinc-400 focus:text-white">Pill</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-1">
                 <span className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest px-1">Typography</span>
                 <Select value={fontFamily} onValueChange={setFontFamily}>
                   <SelectTrigger className="bg-zinc-950/50 border-zinc-800/40 text-[10px] h-8 text-zinc-300">
                     <SelectValue placeholder="Font" />
                   </SelectTrigger>
                   <SelectContent position="popper" className="bg-[#0A0A0F] border-zinc-800 z-[100]">
                     <SelectItem value="Inter" className="text-zinc-400 focus:text-white">Inter (SaaS)</SelectItem>
                     <SelectItem value="Playfair Display" className="text-zinc-400 focus:text-white">Playfair (Luxury)</SelectItem>
                     <SelectItem value="Clash Display" className="text-zinc-400 focus:text-white">Clash (Modern)</SelectItem>
                     <SelectItem value="Syne" className="text-zinc-400 focus:text-white">Syne (Creative)</SelectItem>
                     <SelectItem value="Cabinet Grotesk" className="text-zinc-400 focus:text-white">Cabinet (Sharp)</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="pt-1">
          {builderMode === 'web' && (
            <div className="mb-2 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#111118] border border-amber-500/20 rounded-lg focus-within:border-amber-500/40 transition-all shadow-md">
                <Globe size={12} className="text-amber-500/50" />
                <input 
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  disabled={isGenerating || isPlanning}
                  placeholder="Website URL to redesign..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[10px] text-amber-500 placeholder:text-zinc-700 uppercase tracking-widest font-black disabled:opacity-50"
                />
              </div>
            </div>
          )}
          {imageDatas.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
              {imageDatas.map((img, idx) => (
                <div key={idx} className="relative w-10 h-10 shrink-0">
                  <img src={img.data} className="w-full h-full object-cover rounded-md border border-zinc-700" />
                  <button onClick={() => removeImage(idx)} className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-zinc-900 text-zinc-400 flex items-center justify-center"><X size={8} /></button>
                </div>
              ))}
            </div>
          )}

          <div className="relative group">
            <textarea
              ref={textareaRef}
              value={appDescription}
              onChange={(e) => setAppDescription(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              onPaste={handlePaste}
              disabled={isGenerating || isPlanning || isProjectStarted}
              placeholder={
                isProjectStarted ? "Project brief locked. Use 'Add Screen' to expand." :
                builderMode === 'app' ? "What app are we designing?" : 
                builderMode === 'web' ? "Describe your landing page or website vision..." :
                "Describe a UI element..."
              }
              rows={5}
              className={cn(
                "w-full bg-[#111118] border rounded-xl py-3 pl-4 pr-12 text-white text-xs resize-none transition-all leading-relaxed",
                builderMode === 'app' ? "border-zinc-800/60 focus:border-cyan-500/40" :
                builderMode === 'web' ? "border-zinc-800/60 focus:border-amber-500/40" :
                "border-zinc-800/60 focus:border-violet-500/40",
                isProjectStarted && "opacity-40 cursor-not-allowed"
              )}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating || isPlanning}
                className="p-1.5 text-zinc-600 hover:text-cyan-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Add screenshot"
              >
                <Paperclip size={16} />
              </button>
              
              <div className="flex gap-1">
                <button 
                  onClick={() => sourceUrl.trim() && builderMode === 'web' ? handleScrapeAndPlan(sourceUrl, appDescription, true) : handlePlan()}
                  disabled={(!appDescription.trim() && !sourceUrl.trim()) || isPlanning}
                  className={cn(
                    "p-1.5 rounded-lg transition-all disabled:opacity-30",
                    builderMode === 'app' ? "bg-zinc-800 text-cyan-400 hover:bg-zinc-700" : 
                    builderMode === 'web' ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20" :
                    "bg-black/40 text-violet-400 hover:bg-black/60 border border-violet-500/20"
                  )}
                  title={builderMode === 'web' && sourceUrl.trim() ? "Scrape & Redesign Website" : "Magic Plan — auto-pick colors & expand prompt"}
                >
                  {isPlanning ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                </button>
                <button 
                  onClick={() => handleGenerate()}
                  disabled={!canGenerate}
                  title={!canGenerate ? "Enter a description to generate" : 
                         builderMode === 'app' ? "Generate 5 core screens" : 
                         builderMode === 'web' ? "Generate landing pages" :
                         "Generate component"}
                  className={cn(
                    "p-1.5 rounded-lg text-white transition-all active:scale-90 disabled:opacity-30 shadow-lg",
                    builderMode === 'app' ? "bg-cyan-600 hover:bg-cyan-50 shadow-cyan-500/20" : 
                    builderMode === 'web' ? "bg-amber-600 hover:bg-amber-500 shadow-amber-500/20" :
                    "bg-violet-600 hover:bg-violet-500 shadow-violet-500/20"
                  )}
                >
                  {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
                </button>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} multiple accept="image/*" className="hidden" />
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

