'use client';

import { ChatPanel } from '@/components/studio/ChatPanel';
import { ImageGallery } from '@/components/studio/ImageGallery';
import { CampaignPanel } from '@/components/studio/CampaignPanel';
import { useImageChatStore } from '@/lib/store/useImageChatStore';

export default function VisualArtistPage() {
  const { selectedIdentity } = useImageChatStore();
  const isBrand = selectedIdentity?.type === 'brand';

  return (
    <div className="flex h-full animate-in fade-in duration-500 overflow-hidden">
      {/* Left Sidebar: Settings & Chat */}
      <div className="hidden md:block w-[360px] shrink-0 h-full border-r border-zinc-800/50">
        <ChatPanel />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 h-full min-w-0 bg-[#050505]">
        <ImageGallery />
      </div>

      {/* Right Sidebar: Campaign Tools (Conditional) */}
      {isBrand && (
        <div className="hidden lg:block">
          <CampaignPanel />
        </div>
      )}

      {/* Mobile: ChatPanel as overlay */}
      <div className="md:hidden absolute inset-0 pointer-events-none z-[100]">
        <ChatPanel />
      </div>
    </div>
  );
}
