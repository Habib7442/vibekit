'use client';

import { REEL_TEMPLATES } from '@/lib/templates';
import { cn } from '@/lib/utils';
import { Play, Sparkles, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function TemplateGallery() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-7xl font-black tracking-tighter uppercase mb-6 leading-none">
          AI Reel <br /> <span className="text-[#f5e1c8] italic font-light lowercase font-[family-name:var(--font-playfair)]">Templates.</span>
        </h2>
        <p className="text-zinc-500 text-sm md:text-base font-bold uppercase tracking-[0.3em] max-w-xl mx-auto">
          Upload 5 photos. Pick a style. Get a high-energy viral montage.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-[400px] flex flex-col gap-8">
        {REEL_TEMPLATES.map((template) => (
          <Link
            key={template.id}
            href={`/templates/${template.id}`}
            onMouseEnter={() => setHoveredId(template.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="group relative h-[520px] rounded-[3rem] overflow-hidden bg-zinc-900 border border-white/5 transition-all hover:border-[#f5e1c8]/50 hover:shadow-2xl hover:shadow-[#f5e1c8]/10 block"
          >
            {/* Background Blur / Gradient */}
            <div 
              className="absolute inset-0 opacity-20 transition-opacity group-hover:opacity-40"
              style={{ background: `radial-gradient(circle at bottom, ${template.color}, transparent)` }}
            />

            {/* Video Preview */}
            <div className="absolute inset-0 bg-black/40">
              <video 
                src={template.previewVideo}
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Overlay to ensure text readability */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-8 pt-20 bg-gradient-to-t from-black via-black/80 to-transparent">
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: template.color }}
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  {template.style} Style
                </span>
              </div>
              <h3 className="text-xl font-black text-white uppercase mb-2 tracking-tight group-hover:text-[#f5e1c8] transition-colors">
                {template.name}
              </h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">
                {template.description}
              </p>
              
              <div className="mt-6 flex items-center gap-4 border-t border-white/10 pt-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white">
                   <Sparkles size={12} className="text-[#f5e1c8]" /> Use Template
                </span>
              </div>
            </div>

            {/* AI Badge */}
            <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center gap-2">
              <Wand2 size={10} className="text-[#f5e1c8]" />
              <span className="text-[8px] font-black uppercase tracking-widest text-white">AI Engine</span>
            </div>
          </Link>
        ))}
        </div>
      </div>
    </section>
  );
}
