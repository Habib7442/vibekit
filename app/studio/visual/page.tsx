'use client';

import { ChatPanel } from '@/components/studio/ChatPanel';
import { ImageGallery } from '@/components/studio/ImageGallery';

export default function VisualArtistPage() {
  return (
    <div className="flex h-full animate-in fade-in duration-500">
      <div className="hidden md:block w-[380px] shrink-0 h-full border-r border-zinc-800/50">
        <ChatPanel />
      </div>
      <div className="md:hidden">
        <ChatPanel />
      </div>
      <div className="flex-1 h-full">
        <ImageGallery />
      </div>
    </div>
  );
}
