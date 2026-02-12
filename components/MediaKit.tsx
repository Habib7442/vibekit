"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { 
  Instagram, 
  Mail, 
  ExternalLink, 
  Edit3, 
  Check, 
  Plus,
  ArrowRight
} from "lucide-react";

export function MediaKit() {
  const { mediaKit } = useStore();
  const [editingSection, setEditingSection] = useState<string | null>(null);

  if (!mediaKit) return null;

  const { sections, theme } = mediaKit;

  const handleEdit = (section: string) => {
    setEditingSection(section);
  };

  return (
    <div className="bg-white text-[#111111] font-sans overflow-hidden">
      {/* 1. CINEMATIC HERO */}
      <section className="relative min-h-screen flex flex-col justify-end overflow-hidden group">
        {/* Dynamic Background Layering */}
        <div className="absolute inset-0 bg-[#F9F9F8]" />
        
        {/* The "Sexy" Image Placement - Hero image that bleeds out of frame */}
        <div className="absolute top-0 right-0 w-full lg:w-[45%] h-full lg:h-[90%] overflow-hidden">
           <div 
             className="w-full h-full bg-cover bg-center grayscale hover:grayscale-0 transition-all duration-1000 transform group-hover:scale-105" 
             style={{ backgroundImage: `url(${sections.hero.image !== "URL_PLACEHOLDER" ? sections.hero.image : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=2000'})` }} 
           />
           {/* Sophisticated gradient overlay for text readability on mobile */}
           <div className="absolute inset-0 bg-gradient-to-t from-[#F9F9F8] via-[#F9F9F8]/20 to-transparent lg:bg-none" />
        </div>

        <div className="relative z-10 px-8 md:px-20 pb-20 md:pb-32 max-w-7xl mx-auto w-full">
          <div className="max-w-4xl space-y-12">
            <div className="flex items-center gap-6 animate-in fade-in slide-in-from-left-8 duration-1000">
               <span className="h-[1px] w-12 bg-[#111111]/30" />
               <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-[#111111]/40">VibeStudio Archive 2026</span>
            </div>
            
            <h1 className="text-[15vw] lg:text-[13rem] font-serif leading-[0.75] tracking-tighter text-[#111111] animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
               {sections.hero.title}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-32 items-end pt-8">
              <p className="text-xl md:text-2xl font-normal text-[#111111]/70 leading-relaxed tracking-tight animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
                {sections.hero.subtitle}
              </p>
              
              <div className="flex animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-400">
                 <button className="h-16 px-12 bg-[#111111] text-white rounded-full font-bold text-[11px] tracking-[0.3em] uppercase hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center gap-4 group/btn">
                   Request Rate Card <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                 </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section Edit Access */}
        <div className="absolute top-12 left-12 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={() => handleEdit('hero')} className="p-4 bg-white/80 backdrop-blur rounded-full shadow-lg hover:bg-white text-black border border-black/5">
            <Edit3 className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* 2. ARCHITECTURAL ABOUT */}
      <section className="py-60 px-8 md:px-20 relative group bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
           <div className="lg:col-span-8 lg:pr-24 space-y-20">
              <div className="space-y-6">
                 <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#111111]/30">The Essence</h2>
                 <div className="h-0.5 w-16 bg-[#111111]/10" />
              </div>
              <p className="text-5xl md:text-7xl lg:text-[5.5rem] font-serif leading-[1.05] text-[#111111] tracking-tight">
                {sections.about.text}
              </p>
           </div>
           
           <div className="lg:col-span-4 sticky top-32">
              <div className="aspect-[3/4] overflow-hidden group/img relative shadow-2xl">
                 <div className="w-full h-full bg-cover bg-center transition-all duration-1000 group-hover/img:scale-110" style={{ backgroundImage: `url(${sections.about.image !== "URL_PLACEHOLDER" ? sections.about.image : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1500'})` }} />
                 <div className="absolute inset-0 bg-[#111111]/5" />
              </div>
           </div>
        </div>

        <button onClick={() => handleEdit('about')} className="absolute top-12 right-12 p-4 bg-neutral-50 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md">
           <Edit3 className="w-5 h-5" />
        </button>
      </section>

      {/* 3. MONOLITHIC METRICS */}
      <section className="py-40 bg-[#111111] text-white relative group overflow-hidden">
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        
        <div className="px-8 md:px-20 max-w-7xl mx-auto space-y-32 relative z-10">
           <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/30 text-center">Quantifiable Influence</h2>
           
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-24 gap-x-12">
              {sections.metrics.map((metric: any, i: number) => (
                <div key={i} className="text-center space-y-4 group/item">
                   <span className="text-8xl md:text-[8rem] lg:text-[10rem] font-serif leading-none tracking-tighter block group-hover/item:scale-110 transition-transform duration-700">{metric.value}</span>
                   <div className="flex items-center justify-center gap-3">
                      <span className="h-[1px] w-6 bg-white/20" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">{metric.label}</span>
                      <span className="h-[1px] w-6 bg-white/20" />
                   </div>
                </div>
              ))}
           </div>
        </div>

        <button onClick={() => handleEdit('metrics')} className="absolute top-12 right-12 p-4 bg-white/5 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-all border border-white/10">
           <Edit3 className="w-5 h-5 text-white" />
        </button>
      </section>

      {/* 4. VALUES GRID */}
      <section className="py-40 px-8 md:px-20 group relative border-b border-neutral-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200">
           {sections.values.map((value: any, i: number) => (
             <div key={i} className="bg-white p-20 space-y-10 hover:bg-[#F9F9F8] transition-colors group/box">
                <span className="text-[10px] font-bold text-black/20 italic">0{i+1}</span>
                <h3 className="text-4xl font-serif text-black">{value.title}</h3>
                <p className="text-sm font-medium text-black/50 leading-loose tracking-wide">{value.text}</p>
             </div>
           ))}
        </div>

        <button onClick={() => handleEdit('values')} className="absolute top-12 left-1/2 -translate-x-1/2 p-4 bg-neutral-50 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md">
           <Edit3 className="w-5 h-5" />
        </button>
      </section>

      {/* 5. MINIMALIST FOOTER */}
      <footer className="py-60 px-8 md:px-20 text-center space-y-24 relative group">
         <div className="space-y-10">
            <h2 className="text-8xl md:text-[12rem] font-serif leading-[0.8] tracking-tighter">Collaborate</h2>
            <p className="text-xl text-black/50 font-normal max-w-2xl mx-auto tracking-tight">Available for select creative partnerships and intentional brand stories for the 2026 season.</p>
         </div>

         <div className="flex flex-wrap items-center justify-center gap-16 md:gap-24">
            {['Email', 'Instagram', 'TikTok'].map((link) => (
              <a key={link} href="#" className="relative text-[11px] font-bold uppercase tracking-[0.3em] group/link pb-2">
                {link}
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-black scale-x-0 group-hover/link:scale-x-100 transition-transform origin-right duration-500" />
              </a>
            ))}
         </div>

         <div className="pt-20 opacity-10 text-[9px] uppercase font-bold tracking-[0.6em]">
            Digital Assets © 2026 VibeStudio Archive
         </div>

         <button onClick={() => handleEdit('contact')} className="absolute bottom-12 left-1/2 -translate-x-1/2 p-4 bg-neutral-50 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md">
           <Edit3 className="w-5 h-5" />
         </button>
      </footer>
    </div>
  );
}
