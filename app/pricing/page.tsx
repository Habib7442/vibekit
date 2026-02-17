'use client';

import Link from 'next/link';
import { Check, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';


const PLANS = [
  {
    name: "Explorer",
    price: "15",
    credits: "150",
    description: "Perfect for students and casual creators.",
    features: [
      "150 Credits / month",
      "Full Access to App Designer",
      "Editorial AI Photoshoots",
      "Export to HTML/Tailwind",
      "Private Gallery / Vault",
      "Email support"
    ],
    cta: "Start with Explorer",
    popular: false,
    color: "zinc",
    productId: "pdt_explorer" // Update with real Dodo Product ID
  },
  {
    name: "Professional",
    price: "39",
    credits: "500",
    description: "The choice for power users and freelancers.",
    features: [
      "500 Credits / month",
      "Everything in Explorer",
      "Magic Wand Prompt Expansion",
      "24/7 Priority support"
    ],
    cta: "Go Pro",
    popular: true,
    color: "indigo",
    productId: "pdt_pro" // Update with real Dodo Product ID
  },
  {
    name: "Agency",
    price: "89",
    credits: "1500",
    description: "Scale your creative output without limits.",
    features: [
      "1,500 Credits / month",
      "Everything in Pro",
      "Team Collaboration Tools",
      "Dedicated account manager"
    ],
    cta: "Scale Agency",
    popular: false,
    color: "amber",
    productId: "pdt_agency" // Update with real Dodo Product ID
  }
];

const LIFETIME = {
  name: "Lifetime Founder",
  price: "299",
  description: "Pay once, create forever. Join as an early bird founder.",
  features: [
    "One-time payment",
    "150 Credits / month (Lifetime renew)",
    "Exclusive Founder Badge",
    "First access to NEW features",
    "Direct discord contact",
    "All future UI templates included"
  ],
  cta: "Claim Lifetime Access",
  productId: "pdt_lifetime" // Update with real Dodo Product ID
};

export default function PricingPage() {
  const { user } = useAuth();

  const getCheckoutUrl = (productId: string, credits: string) => {
    const baseUrl = `/api/checkout?productId=${encodeURIComponent(productId)}`;
    if (!user) return `/auth?next=${encodeURIComponent('/pricing')}`;
    return `${baseUrl}&userId=${encodeURIComponent(user.id)}&credits=${encodeURIComponent(credits)}`;
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#f5e1c8]/30 font-sans antialiased">
      
      {/* Header (Simplified) */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6">
        <nav className="w-full max-w-5xl flex items-center justify-between px-6 py-3 rounded-full bg-black/50 border border-zinc-800/50 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded overflow-hidden flex items-center justify-center transition-transform group-hover:scale-110">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={32} 
                height={32} 
                className="object-contain"
              />
            </div>
            <span className="font-bold text-sm tracking-tight text-white uppercase italic">ImageStudioLab</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link href="/" className="text-[10px] uppercase tracking-widest font-black text-zinc-500 hover:text-white transition-colors">Home</Link>
            <Link href="/studio" className="px-5 py-2 rounded-full bg-[#f5e1c8] text-black text-[10px] font-black hover:bg-[#ebd5b8] transition-all">Launch Studio</Link>
          </div>
        </nav>
      </header>

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          
          {/* Hero Section */}
          <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">Simple, <span className="text-zinc-500 italic">Transparent</span> <br />Pricing.</h1>
            <p className="text-zinc-500 text-sm md:text-base max-w-2xl mx-auto uppercase tracking-widest font-black">
              Choose the plan that fits your creative workflow. <br />No hidden fees. Just pure vision.
            </p>
          </div>

          {/* Monthly Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-32">
            {PLANS.map((plan, idx) => (
              <div 
                key={plan.name}
                style={{ animationDelay: `${idx * 100}ms` }}
                className={cn(
                  "relative p-8 rounded-[2.5rem] border transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 flex flex-col",
                  plan.popular 
                    ? "bg-[#0A0A0F] border-[#f5e1c8] shadow-[0_0_80px_-20px_rgba(245,225,200,0.15)] ring-1 ring-[#f5e1c8]/20" 
                    : "bg-black border-zinc-800/50 hover:border-zinc-700 hover:bg-[#050505]"
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-[#f5e1c8] text-black text-[9px] font-black uppercase tracking-[0.2em] shadow-xl">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f5e1c8] mb-4">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold tracking-tighter">${plan.price}</span>
                    <span className="text-zinc-600 text-[11px] font-bold uppercase tracking-widest">/ month</span>
                  </div>
                  <p className="text-zinc-500 text-xs mt-4 font-medium leading-relaxed">{plan.description}</p>
                </div>

                <div className="flex-1 space-y-4 mb-10">
                  {plan.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-center gap-3">
                      <div className="shrink-0 w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <Check size={10} className="text-[#f5e1c8]" />
                      </div>
                      <span className="text-xs text-zinc-400 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <div 
                  className={cn(
                    "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center transition-all shadow-xl block opacity-50 cursor-not-allowed",
                    plan.popular
                      ? "bg-[#f5e1c8] text-black shadow-[#f5e1c8]/20"
                      : "bg-zinc-900 text-white border border-zinc-800"
                  )}
                >
                  Coming Soon
                </div>
              </div>
            ))}
          </div>

          {/* Lifetime Deal Section */}
          <div className="w-full max-w-5xl rounded-[3rem] p-1 border border-white/5 bg-gradient-to-tr from-zinc-900 via-black to-zinc-900 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000">
             <div className="rounded-[2.8rem] bg-black p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="relative z-10 flex-1">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em]">
                        One-Time Deal
                      </div>
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Zap size={14} className="text-amber-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest italic"> Founder Edition </span>
                      </div>
                   </div>
                   
                   <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">The Lifetime <br />Founder Plan.</h2>
                   <p className="text-zinc-500 text-sm max-w-md mb-10 leading-relaxed font-medium">Be part of the early-bird group. Pay once today, and we refill your credits every single month for life. No more subscriptions.</p>
                   
                   <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      {LIFETIME.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <Check size={12} className="text-indigo-400" />
                          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">{feature}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="relative z-10 shrink-0 w-full md:w-auto text-center md:text-right flex flex-col gap-6">
                   <div className="flex flex-col">
                      <span className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mb-2">One-time payment</span>
                      <div className="flex items-baseline justify-center md:justify-end gap-2">
                        <span className="text-6xl md:text-[5.5rem] font-bold tracking-tighter">${LIFETIME.price}</span>
                        <span className="text-2xl text-zinc-700 line-through font-light opacity-50">$999</span>
                      </div>
                   </div>
                   
                   <div 
                    className="w-full md:w-80 py-5 rounded-2xl bg-indigo-600/50 text-white/50 text-[11px] font-black uppercase tracking-[0.2em] border border-white/5 text-center transition-all shadow-2xl cursor-not-allowed block"
                   >
                     Coming Soon
                   </div>
                   <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest italic">Limited to the first 500 members only.</p>
                </div>
             </div>
          </div>

          {/* Secure & FAQ Minimal Section */}
          <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-16 w-full max-w-5xl text-center">
             <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-[#f5e1c8] border border-zinc-800">
                  <Shield size={20} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest">Secure Payments</h4>
                <p className="text-[11px] text-zinc-600 leading-relaxed">Encrypted transactions processed via Stripe. Your data is always safe.</p>
             </div>
             <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-[#f5e1c8] border border-zinc-800">
                  <Sparkles size={20} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest">Flexible Scaling</h4>
                <p className="text-[11px] text-zinc-600 leading-relaxed">Upgrade or downgrade anytime. Credits carry over across cycles.</p>
             </div>
             <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-[#f5e1c8] border border-zinc-800">
                  <Zap size={20} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest">Instant Activation</h4>
                <p className="text-[11px] text-zinc-600 leading-relaxed">Studio access is granted immediately after successful checkout.</p>
             </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-zinc-900/50 text-center">
        <div className="flex items-center justify-center gap-2 mb-10">
            <div className="w-6 h-6 rounded overflow-hidden flex items-center justify-center opacity-80">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={24} 
                height={24} 
                className="object-contain grayscale brightness-200"
              />
            </div>
            <span className="font-bold text-[10px] tracking-tight text-white uppercase italic">ImageStudioLab</span>
        </div>
        <div className="flex justify-center gap-8 mb-10">
           <Link href="/privacy" className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest hover:text-white transition-colors">Privacy</Link>
           <Link href="/terms" className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest hover:text-white transition-colors">Terms</Link>
           <Link href="/support" className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest hover:text-white transition-colors">Support</Link>
        </div>
        <p className="text-[8px] text-zinc-900 font-black tracking-[0.2em uppercase]">© 2026 IMAGESTUDIOLAB. CRAFTED FOR VISIONARIES.</p>
      </footer>

    </div>
  );
}
