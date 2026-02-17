'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Sparkles, CreditCard, User as UserIcon, Calendar, ShieldCheck, Mail, LogOut, ChevronRight, Zap, Smartphone, ImageIcon, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { signOut } from '@/lib/auth-actions';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'billing'>('details');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#050505]">
        <div className="w-8 h-8 rounded-full border-t-2 border-[#f5e1c8] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-[#050505] p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800">
          <UserIcon size={32} className="text-zinc-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-zinc-500 mb-8 max-w-xs">Please sign in to view your profile and subscription details.</p>
        <Link href="/" className="px-8 py-3 rounded-full bg-[#f5e1c8] text-black text-sm font-black uppercase tracking-widest hover:bg-[#ebd5b8] transition-all">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#050505] text-white p-6 md:p-12 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
      <div className="max-w-5xl mx-auto">
        
        {/* Profile Header */}
        <div className="relative mb-12 rounded-[2.5rem] p-8 md:p-12 border border-white/5 bg-gradient-to-br from-[#0A0A0F] via-black to-[#050505] overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#f5e1c8]/5 blur-[100px] rounded-full pointer-events-none transition-all group-hover:bg-[#f5e1c8]/10" />
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-[#f5e1c8]/20 p-1 bg-gradient-to-tr from-zinc-800 to-zinc-900 ring-4 ring-black shadow-2xl">
              {user.user_metadata?.avatar_url ? (
                <Image 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  width={128} 
                  height={128} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-3xl font-black text-[#f5e1c8] uppercase italic">
                   {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U')}
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">{user.user_metadata?.full_name || user.email?.split('@')[0]}</h1>
                <div className="px-4 py-1.5 rounded-full bg-[#f5e1c8]/10 border border-[#f5e1c8]/30 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f5e1c8] animate-pulse" />
                  <span className="text-[10px] text-[#f5e1c8] font-black uppercase tracking-widest">{profile?.credits ?? 0} Credits</span>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-4 text-zinc-500">
                <div className="flex items-center gap-2">
                  <Mail size={14} />
                  <span className="text-xs font-medium">{user.email}</span>
                </div>
                <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-zinc-800/50" />
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span className="text-xs font-medium">Member since {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl w-fit mb-10 shadow-xl backdrop-blur-sm">
          <button 
            onClick={() => setActiveTab('details')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'details' ? "bg-white text-black shadow-xl" : "text-zinc-500 hover:text-white hover:bg-white/5"
            )}
          >
            Account Details
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'billing' ? "bg-white text-black shadow-xl" : "text-zinc-500 hover:text-white hover:bg-white/5"
            )}
          >
            Billing & Usage
          </button>
        </div>

        {activeTab === 'details' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Personal Info */}
            <div className="bg-[#0A0A0F] border border-zinc-800/50 rounded-[2rem] p-8 md:p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <UserIcon size={20} className="text-[#f5e1c8]" />
                </div>
                <h2 className="text-lg font-bold uppercase tracking-widest">Personal Info</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Display Name</label>
                  <p className="text-sm font-medium text-white p-4 rounded-xl bg-black/40 border border-white/5">{user.user_metadata?.full_name || 'Not Set'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Email Address</label>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5">
                    <p className="text-sm font-medium text-white">{user.email}</p>
                    <ShieldCheck size={16} className="text-emerald-500" />
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-900">
                  <p className="text-[10px] text-zinc-600 italic">To update your personal info, please sign in with a different provider or contact support.</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#0A0A0F] border border-zinc-800/50 rounded-[2rem] p-8 md:p-10 shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <Zap size={20} className="text-amber-400" />
                </div>
                <h2 className="text-lg font-bold uppercase tracking-widest">Quick Studio</h2>
              </div>

              <div className="space-y-4">
                <Link href="/studio/visual" className="group flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-[#f5e1c8]/30 transition-all hover:bg-zinc-900/40">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-lg">
                      <ImageIcon size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest">Visual Artist</h4>
                      <p className="text-[10px] text-zinc-600 mt-1">Generate stunning AI photos</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </Link>

                <Link href="/studio/builder" className="group flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-cyan-500/30 transition-all hover:bg-zinc-900/40">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-lg">
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest">App Designer</h4>
                      <p className="text-[10px] text-zinc-600 mt-1">Create world-class UI code</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </Link>

                <button 
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all text-[11px] font-black uppercase tracking-widest justify-center mt-6"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Multi-grid for Billing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Credit Status */}
              <div className="col-span-1 md:col-span-1 bg-zinc-900/40 border border-zinc-800/50 rounded-[2rem] p-8 shadow-xl flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-[#f5e1c8]/5 border border-[#f5e1c8]/10 flex items-center justify-center mb-6 shadow-2xl relative">
                   <div className="absolute inset-0 bg-[#f5e1c8]/10 blur-[20px] rounded-full" />
                   <Sparkles size={32} className="text-[#f5e1c8] relative z-10" />
                </div>
                <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Available Credits</h3>
                <p className="text-6xl font-bold tracking-tighter mb-6">{profile?.credits ?? 0}</p>
                <Link href="/pricing" className="w-full py-4 rounded-2xl bg-[#f5e1c8] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#ebd5b8] transition-all shadow-xl shadow-[#f5e1c8]/10 group">
                   Buy More Credits
                   <ArrowRight size={12} className="inline ml-2 transition-all transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Current Subscription */}
              <div className="col-span-1 md:col-span-2 bg-[#0A0A0F] border border-zinc-800/50 rounded-[2rem] p-10 shadow-xl flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
                
                <div className="flex-1 relative z-10 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                      <CreditCard size={20} className="text-indigo-400" />
                    </div>
                    <h2 className="text-lg font-bold uppercase tracking-widest">Active Plan</h2>
                  </div>
                  
                  <div className="mb-8">
                    <h4 className="text-3xl font-black mb-2 uppercase italic tracking-tighter">Free Tier</h4>
                    <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest">Current billing cycle: <span className="text-white">Monthly</span></p>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="text-xs text-zinc-400 font-medium">Standard priority rendering enabled</span>
                     </div>
                     <div className="flex items-center gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs text-zinc-400 font-medium">All generations synced to private vault</span>
                     </div>
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-fit relative z-10 space-y-4">
                  <Link href="/pricing" className="w-full md:w-64 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 text-center block">
                    Upgrade to Pro
                  </Link>
                  <button 
                    disabled
                    className="w-full md:w-64 py-4 rounded-2xl border border-zinc-800 text-zinc-600 text-[10px] font-black uppercase tracking-widest cursor-not-allowed text-center"
                  >
                    Manage Subscription
                  </button>
                  <p className="text-[9px] text-zinc-700 text-center font-bold uppercase">Billing is managed via Dodo Payments.</p>
                </div>
              </div>
            </div>

            {/* Credit Info Box */}
            <div className="mt-8 p-10 rounded-[2rem] border border-zinc-900 bg-gradient-to-r from-zinc-900/50 to-transparent flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="max-w-md">
                  <h4 className="text-xs font-black uppercase tracking-widest mb-4">How do credits work?</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">Credits are consumed every time you generate a world-class UI or an editorial AI photograph. 1 Credit = 1 Generation. Purchased credits never expire and roll over to your next month.</p>
               </div>
               <Link href="/support" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors underline underline-offset-8">
                  View full documentation
               </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
