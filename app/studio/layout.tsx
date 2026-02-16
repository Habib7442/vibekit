'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Smartphone, Sparkles, ImageIcon, User, Library } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { AuthModal } from '@/components/studio/AuthModal';
import { useAuth } from '@/lib/hooks/useAuth';
import { signOut } from '@/lib/auth-actions';

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasMounted, setHasMounted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, profile, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <main className="w-full h-screen overflow-hidden bg-[#050505] flex flex-col">
        <div className="shrink-0 h-16 border-b border-zinc-800/50 bg-[#0A0A0F]/80" />
        <div className="flex-1 min-h-0 bg-[#050505]" />
      </main>
    );
  }

  const isImageMode = pathname.includes('/studio/visual');
  const isDesignerMode = pathname.includes('/studio/builder');
  const isLibraryMode = pathname.includes('/studio/generations');

  return (
    <main className="w-full h-screen overflow-hidden bg-[#050505] flex flex-col">
      {/* Header / Mode Switcher */}
      <div className="shrink-0 h-16 border-b border-zinc-800/50 bg-[#0A0A0F]/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 z-[60]">
        <div className="flex-1 flex items-center">
          <Link href="/" className="group flex items-center gap-3 transition-all hover:scale-105 active:scale-95">
            <div className={cn(
              "w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center transition-all bg-[#111118] border border-white/5",
              isImageMode ? "shadow-[0_0_20px_rgba(79,70,229,0.15)] ring-1 ring-indigo-500/20" : "shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20"
            )}>
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={28} 
                height={28} 
                className="object-contain"
              />
            </div>
          </Link>
        </div>

        <div className="shrink-0 bg-white/[0.03] border border-white/5 rounded-2xl p-1 flex items-center gap-1 shadow-2xl backdrop-blur-md">
          <Link
            href="/studio/visual"
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2.5 transition-all duration-300",
              isImageMode
                ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            )}
          >
            <ImageIcon size={14} className={cn("transition-transform duration-300", isImageMode && "scale-110")} />
            Visual Artist
          </Link>
          <Link
            href="/studio/builder"
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2.5 transition-all duration-300",
              isDesignerMode
                ? "bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            )}
          >
            <Smartphone size={14} className={cn("transition-transform duration-300", isDesignerMode && "scale-110")} />
            App Designer
          </Link>
          <Link
            href="/studio/generations"
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2.5 transition-all duration-300",
              isLibraryMode
                ? "bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            )}
          >
            <Library size={14} className={cn("transition-transform duration-300", isLibraryMode && "scale-110")} />
            Vault
          </Link>
        </div>

        <div className="flex-1 flex justify-end items-center gap-4">
           {!authLoading && (
             <>
               {!isMobile && (
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/40 rounded-lg border border-zinc-800/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Live</span>
                 </div>
               )}

               {user ? (
                 <div className="flex items-center gap-4 pl-4 border-l border-white/5">
                   {!isMobile && (
                     <div className="text-right flex flex-col items-end justify-center py-1">
                        <p className="text-[11px] text-white font-bold tracking-tight mb-2">{profile?.name || user.user_metadata.full_name || user.email}</p>
                        <div className="flex items-center justify-end gap-2.5">
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 rounded-md border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                            <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-[9px] text-cyan-400 font-black uppercase tracking-wider leading-none">{profile?.credits ?? 20} Credits</span>
                          </div>
                        </div>
                     </div>
                   )}
                   <div className="flex items-center gap-3">
                     {isMobile && (
                       <button 
                         onClick={() => signOut()}
                         className="p-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 transition-all active:scale-90"
                         title="Sign Out"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                       </button>
                     )}
                     <div className="w-9 h-9 rounded-full border border-white/5 overflow-hidden shadow-2xl ring-1 ring-white/10 transition-all hover:ring-white/20 shrink-0">
                       {user.user_metadata.avatar_url ? (
                         <img 
                           src={user.user_metadata.avatar_url} 
                           alt="Profile" 
                           className="w-full h-full object-cover"
                           onError={(e) => {
                             (e.target as HTMLImageElement).style.display = 'none';
                             const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                             if (fallback) fallback.style.display = 'flex';
                           }}
                         />
                       ) : null}
                       <div 
                         className="w-full h-full bg-gradient-to-tr from-zinc-800 to-zinc-900 flex items-center justify-center"
                         style={{ display: user.user_metadata.avatar_url ? 'none' : 'flex' }}
                       >
                          <span className="text-[10px] text-white font-black uppercase">
                            {(profile?.name || user.user_metadata.full_name || user.email || 'U').charAt(0)}
                          </span>
                       </div>
                     </div>
                   </div>
                 </div>
               ) : (
                 <button
                   onClick={() => setShowAuthModal(true)}
                   className="h-10 px-6 rounded-full bg-white text-black text-[12px] font-black hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-white/5 uppercase tracking-wider"
                 >
                   Sign In
                 </button>
               )}
             </>
           )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {children}
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </main>
  );
}
