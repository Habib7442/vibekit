'use client';
 
import Link from 'next/link';
import { Sparkles, ArrowRight, Paperclip, ChevronDown, Smartphone, Code2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { useAuth } from '@/lib/hooks/useAuth';
import { AuthModal } from '@/components/studio/AuthModal';
import { signOut } from '@/lib/auth-actions';
import { ShowcaseGrid } from '@/components/studio/ShowcaseGrid';
import { AssetShowcase } from '@/components/studio/AssetShowcase';
import { TemplateGallery } from '@/components/studio/TemplateGallery';
import { planAppAction, planVisualAction } from '@/lib/actions/ai.actions';

function LandingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState('');
  
  useEffect(() => {
    if (searchParams.get('auth') === 'true') {
      setShowAuthModal(true);
    }
  }, [searchParams]);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [type, setType] = useState<'app' | 'ui' | 'web' | 'image'>('image');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [pendingTargetUrl, setPendingTargetUrl] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  const getTargetUrl = (isPlan: boolean = false) => {
    const baseUrl = type === 'image' ? '/studio/visual' : '/studio/builder';
    const queryParams = new URLSearchParams();
    if (prompt.trim()) queryParams.set('prompt', prompt.trim());
    if (type === 'web' && websiteUrl.trim()) queryParams.set('url', websiteUrl.trim());
    
    if (type === 'app') queryParams.set('type', 'app');
    else if (type === 'ui') queryParams.set('type', 'component');
    else if (type === 'web') queryParams.set('type', 'web');

    if (isPlan) queryParams.set('plan', 'true');
    
    return `${baseUrl}?${queryParams.toString()}`;
  };

  const handleEnter = () => {
    if (type === 'web' && websiteUrl.trim() && !websiteUrl.trim().toLowerCase().startsWith('https://')) {
      alert('❌ Security Error: Please enter a secure website URL starting with https://');
      return;
    }
    const targetUrl = getTargetUrl(false);
    if (!user && !authLoading) {
      setPendingTargetUrl(targetUrl);
      setShowAuthModal(true);
      return;
    }
    if (authLoading && !user) return; // Still loading session
    router.push(targetUrl);
  };

  const handlePlan = async () => {
    if (!prompt.trim()) return;

    if (type === 'web' && websiteUrl.trim() && !websiteUrl.trim().toLowerCase().startsWith('https://')) {
      alert('❌ Security Error: Please enter a secure website URL starting with https://');
      return;
    }

    setIsPlanning(true);
    try {
      let result;
      if (type === 'image') {
        result = await planVisualAction(prompt);
      } else {
        result = await planAppAction(prompt);
      }

      if (result && result.detailedPrompt) {
        setPrompt(result.detailedPrompt);
      }
    } catch (err) {
      console.error("Planning failed:", err);
      // Fallback: just go to studio
      const targetUrl = getTargetUrl(true);
      router.push(targetUrl);
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#f5e1c8]/30 font-sans antialiased">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6">
        <nav className="w-full max-w-5xl flex items-center justify-between px-6 py-3 rounded-full bg-black/50 border border-zinc-800/50 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded overflow-hidden flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="ImageStudioLab Logo" 
                width={32} 
                height={32} 
                className="object-contain"
              />
            </div>
            <span className="font-bold text-sm tracking-tight text-white uppercase italic hidden sm:inline-block">ImageStudioLab</span>
          </div>
          
          <div className="flex items-center gap-3 md:gap-8">
            <Link href="/pricing" className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors hidden sm:block">Pricing</Link>
            <Link href="/testimonials" className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors hidden sm:block">Reviews</Link>
            {user && (
              <div className="flex items-center gap-3 pr-2 border-r border-zinc-800/50 mr-2">
                <div className="flex flex-col items-end hidden lg:flex">
                  <span className="text-xs font-black text-white uppercase tracking-tighter leading-none italic">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  <button 
                    onClick={() => signOut()}
                    className="text-xs font-bold text-zinc-500 hover:text-red-400 transition-colors uppercase tracking-widest mt-1"
                  >
                    Sign Out
                  </button>
                </div>
                <Link href="/studio/profile" className="w-8 h-8 rounded-full border border-zinc-800 p-0.5 bg-gradient-to-tr from-zinc-800 to-zinc-900 group relative transition-transform hover:scale-110 active:scale-95 shadow-xl">
                   {user.user_metadata?.avatar_url ? (
                     <Image 
                       src={user.user_metadata.avatar_url} 
                       alt="Profile" 
                       width={32} 
                       height={32} 
                       className="w-full h-full rounded-full object-cover"
                     />
                   ) : (
                     <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-black text-[#f5e1c8] uppercase">
                        {(user.user_metadata?.full_name?.[0] || user.email?.[0] || '?')}
                     </div>
                   )}
                </Link>
              </div>
            )}
            <Link href="/studio" className="px-5 py-2 rounded-full bg-[#f5e1c8] text-black text-xs font-black hover:bg-[#ebd5b8] transition-all flex items-center gap-2">
              <span className="hidden sm:inline">Launch Studio</span>
              <span className="sm:hidden">Launch</span>
              <ArrowRight size={12} className="hidden sm:block" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-40 pb-20 md:pb-28 px-6 flex flex-col items-center text-center overflow-hidden bg-[#080808] border-b border-zinc-900/50">
        {/* Soft Radial Ambient Glow */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80%] md:w-[60%] aspect-square bg-[#f5e1c8]/5 blur-[120px] rounded-full pointer-events-none z-0" />
        
        {/* Light Subdued Grid */}
        <div className="absolute inset-x-0 top-0 h-[100%] z-0 opacity-[0.03] pointer-events-none mask-fade-out" 
             style={{ 
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
               maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
               WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
             }} 
        />
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full flex flex-col items-center relative z-10">
           {/* Nano Banana Signature */}
           <div className="mb-10 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f5e1c8]/5 border border-[#f5e1c8]/10 text-[9px] font-black text-[#f5e1c8] uppercase tracking-[0.3em] backdrop-blur-md shadow-2xl animate-in fade-in zoom-in duration-1000">
             <div className="w-1 h-1 rounded-full bg-[#f5e1c8] animate-pulse shadow-[0_0_8px_rgba(245,225,200,0.8)]" />
             Powered by Nano Banana 2 🍌
           </div>
           
           <h1 className="text-5xl md:text-[6rem] font-bold text-white tracking-tight leading-[1.0] max-w-5xl mb-6">
             Professional AI Studio. <br /> 
             <span className="italic font-[family-name:var(--font-playfair)] font-light text-[#f5e1c8]">For High-End Brands.</span>
           </h1>
           
           <p className="text-zinc-500 text-sm md:text-lg max-w-3xl mx-auto mb-10 leading-relaxed uppercase tracking-[0.2em] font-black opacity-80">
             Turn one reference into a full Campaign. <br className="hidden md:block" />
             <span className="text-zinc-600">Identity Preservation Meets High-Fidelity Rendering.</span>
           </p>

           <div className="w-full max-w-2xl mx-auto mb-16 relative z-10">
             <div className="group relative bg-[#111111]/80 border border-zinc-800/50 rounded-2xl p-4 backdrop-blur-xl focus-within:border-zinc-700/80 transition-all shadow-2xl hover:shadow-[#f5e1c8]/5">
               {type === 'web' && (
                 <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                   <div className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-amber-500/20 rounded-xl focus-within:border-amber-500/40 transition-all">
                     <Globe size={14} className="text-amber-500/60" />
                     <input 
                       type="url"
                       value={websiteUrl}
                       onChange={(e) => setWebsiteUrl(e.target.value)}
                       placeholder="Paste website URL to redesign (https://...)"
                       className="flex-1 bg-transparent border-none focus:ring-0 text-[11px] text-amber-500 placeholder:text-amber-900/40 font-bold uppercase tracking-widest"
                     />
                   </div>
                 </div>
               )}
               <textarea 
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 placeholder={type === 'web' ? "Describe how you want to redesign it (e.g. Minimalist luxury, glassmorphism, dark mode...)" : "Describe what you want to create (e.g. A futuristic watch photoshoot, a 3D product shot, etc.)"}
                 className="w-full bg-transparent border-none focus:ring-0 text-sm md:text-base text-zinc-100 placeholder:text-zinc-700 resize-none h-24 mb-2 scrollbar-hide"
               />
               
                <div className="flex flex-col sm:flex-row items-center justify-between w-full pt-4 border-t border-zinc-800/40 gap-4">
                  {/* Left: Type Selector */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none flex items-center gap-2">
                       <button 
                         onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                         className={cn(
                           "flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all cursor-pointer uppercase tracking-widest text-[10px] font-black min-w-[140px] md:min-w-[160px] justify-between shadow-lg",
                           type === 'app' && "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 shadow-cyan-500/10",
                           type === 'ui' && "bg-violet-500/10 border-violet-500/40 text-violet-400 hover:bg-violet-500/20 shadow-violet-500/10",
                           type === 'web' && "bg-amber-500/10 border-amber-500/40 text-amber-500 hover:bg-amber-500/20 shadow-amber-500/10",
                           type === 'image' && "bg-rose-500/10 border-rose-500/40 text-rose-400 hover:bg-rose-500/20 shadow-rose-500/10"
                         )}
                       >
                         <div className="flex items-center gap-2">
                           <div className={cn(
                             "w-1.5 h-1.5 rounded-full",
                             type === 'app' && "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]",
                             type === 'ui' && "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]",
                             type === 'web' && "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
                             type === 'image' && "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                           )} />
                           <span className="hidden xs:inline">{type === 'app' ? 'App Designer' : type === 'ui' ? 'UI Studio' : type === 'web' ? 'Web Designer' : 'AI Photoshoot'}</span>
                           <span className="xs:hidden">{type === 'app' ? 'App' : type === 'ui' ? 'UI' : type === 'web' ? 'Web' : 'Photo'}</span>
                         </div>
                         <ChevronDown size={14} className={cn("transition-transform opacity-50", isDropdownOpen && "rotate-180")} />
                       </button>

                       {isDropdownOpen && (
                         <>
                           <div className="fixed inset-0 z-50" onClick={() => setIsDropdownOpen(false)} />
                           <div className="absolute bottom-full left-0 mb-3 w-56 bg-[#0C0C11] border border-white/10 rounded-2xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-2 duration-200 z-[60] backdrop-blur-2xl">
                              <button onClick={() => { setType('image'); setIsDropdownOpen(false); }} className="w-full px-5 py-4 text-left text-xs font-bold text-rose-400 hover:bg-rose-500/10 flex items-center justify-between uppercase tracking-widest transition-all group">
                                <span className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]" />
                                  AI Photoshoot
                                </span>
                                <Sparkles size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                              </button>
                           </div>
                         </>
                       )}
                    </div>
                  </div>

                  {/* Right: Plan + Enter Studio */}
                  <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto sm:justify-end">
                    <button 
                      onClick={handlePlan}
                      disabled={!prompt.trim() || isPlanning}
                      className={cn(
                        "px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[#f5e1c8] text-xs font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2",
                        isPlanning && "animate-pulse"
                      )}
                    >
                      {isPlanning ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-[#f5e1c8] animate-ping" />
                          Planning...
                        </>
                      ) : 'Plan'}
                    </button>

                    <button 
                      onClick={handleEnter}
                      disabled={!prompt.trim()}
                      className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#f5e1c8] text-black text-xs font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#f5e1c8]/10 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      Launch Studio
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

           {/* Expertise Tags */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-2 md:gap-3 max-w-4xl px-4">
              {['Identity Preservation', 'HD Rendering', 'Campaign Bulk Export', 'Pixel-Perfect Sync', 'Golden-Ratio Composition', 'Luxury Brand Grading'].map((tag) => (
                <span key={tag} className="px-3 md:px-5 py-2 rounded-full bg-black border border-[#f5e1c8]/10 text-[9px] md:text-[10px] font-black text-[#f5e1c8]/80 uppercase tracking-widest shadow-2xl hover:border-[#f5e1c8]/30 transition-all cursor-default text-center flex items-center justify-center">
                 {tag}
               </span>
             ))}
            </div>
        
      </section>

      {/* Template Gallery */}
      <div id="templates">
        <TemplateGallery />
      </div>

      {/* Platform Features Showcase */}
      <AssetShowcase />

      {/* Community Showcase */}
      <ShowcaseGrid />

      {/* Final CTA Area */}
      <section className="mx-6 mb-24 max-w-5xl md:mx-auto rounded-[3rem] bg-[#f5e1c8] px-6 py-12 md:p-20 text-center text-black shadow-2xl flex flex-col items-center">
        <h2 className="text-3xl md:text-6xl font-black tracking-tight mb-8 uppercase leading-tight">Scale Your <br />Brand Identity.</h2>
        <p className="text-black/60 text-xs md:text-base max-w-xl mx-auto mb-10 font-bold uppercase tracking-widest leading-relaxed">
          Join the elite e-commerce teams generating 4K visuals with pixel-perfect identity preservation.
        </p>
        <Link href="/studio" className="w-full sm:w-auto px-8 md:px-12 py-5 rounded-full bg-black text-white font-black text-xs uppercase tracking-[0.25em] hover:scale-105 active:scale-95 transition-all whitespace-nowrap shadow-2xl">
          Launch Your Studio
        </Link>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 px-6 border-t border-zinc-900 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-6 h-6 rounded overflow-hidden flex items-center justify-center opacity-80">
            <Image 
              src="/logo.png" 
              alt="ImageStudioLab Logo" 
              width={24} 
              height={24} 
              className="object-contain grayscale brightness-200"
            />
          </div>
          <span className="font-bold text-xs tracking-tight text-white uppercase italic">ImageStudioLab</span>
        </div>
        <div className="flex justify-center flex-wrap gap-8 mb-8 px-6">
           <Link href="/pricing" className="text-xs text-zinc-600 font-bold uppercase tracking-widest hover:text-white transition-colors">Pricing</Link>
           <Link href="/privacy" className="text-xs text-zinc-600 font-bold uppercase tracking-widest hover:text-white transition-colors">Privacy</Link>
           <Link href="/terms" className="text-xs text-zinc-600 font-bold uppercase tracking-widest hover:text-white transition-colors">Terms</Link>
           <Link href="/cookies" className="text-xs text-zinc-600 font-bold uppercase tracking-widest hover:text-white transition-colors">Cookies</Link>
        </div>
        <p className="text-xs text-zinc-800 font-bold">© 2026 IMAGESTUDIOLAB. POWERED BY NANO BANANA 2 🍌. 4K ASSETS ONLY.</p>
      </footer>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        next={pendingTargetUrl || undefined}
      />
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LandingPageContent />
    </Suspense>
  );
}
