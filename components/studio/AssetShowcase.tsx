'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { MoveRight } from 'lucide-react';

const ASSETS = [
  {
    name: 'Instagram Story',
    size: '1080 x 1920',
    ratio: '9:16',
    src: '/landing_page_showcase/Instagram_Story_1080x1920.jpg',
    className: 'col-span-1 row-span-2'
  },
  {
    name: 'Amazon Main Image',
    size: '2000 x 2000',
    ratio: '1:1',
    src: '/landing_page_showcase/Amazon_Main_Image_2000x2000.jpg',
    className: 'col-span-1 row-span-1'
  },
  {
    name: 'YouTube Thumbnail',
    size: '1280 x 720',
    ratio: '16:9',
    src: '/landing_page_showcase/YouTube_Thumbnail_1280x720.jpg',
    className: 'col-span-2 row-span-1'
  },
  {
    name: 'Shopify Product',
    size: '2048 x 2048',
    ratio: '1:1',
    src: '/landing_page_showcase/Shopify_Product_2048x2048.jpg',
    className: 'col-span-1 row-span-1'
  },
  {
    name: 'Facebook Ad',
    size: '1200 x 628',
    ratio: '1.91:1',
    src: '/landing_page_showcase/Facebook_Ad_1200x628.jpg',
    className: 'col-span-1 row-span-1'
  },
  {
    name: 'Twitter/X Post',
    size: '1600 x 900',
    ratio: '16:9',
    src: '/landing_page_showcase/TwitterX_Post_1600x900.jpg',
    className: 'col-span-1 row-span-1'
  },
];

export function AssetShowcase() {
  return (
    <section className="py-24 px-6 bg-[#000000]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16 gap-6">
          <div className="max-w-3xl">
            <h2 className="text-4xl md:text-7xl font-black tracking-tight text-white mb-6 uppercase leading-none">
              One Asset. <br />
              <span className="text-[#f5e1c8] italic font-light lowercase font-[family-name:var(--font-playfair)]">Every Format.</span>
            </h2>
            <p className="text-zinc-500 text-xs md:text-sm font-black uppercase tracking-[0.2em] leading-relaxed mx-auto max-w-xl">
              Generate once. Export everywhere. Our AI understands aspect ratios and automatically recomposes your scene for every platform — from 9:16 Stories to 16:9 Banners.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[200px] md:auto-rows-[250px]">
          {ASSETS.map((asset, i) => (
            <div 
              key={i} 
              className={cn(
                "group relative rounded-3xl overflow-hidden border border-white/5 bg-zinc-900/50 hover:border-[#f5e1c8]/30 transition-all duration-500 shadow-2xl",
                asset.className
              )}
            >
              <img 
                src={asset.src}
                alt={asset.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="absolute bottom-6 left-6 right-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <p className="text-[9px] font-black text-[#f5e1c8] uppercase tracking-[0.2em] mb-1 opacity-60">
                  {asset.ratio} • {asset.size}
                </p>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">
                  {asset.name}
                </h3>
              </div>

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
