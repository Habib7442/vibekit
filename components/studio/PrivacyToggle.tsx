'use client';

import { useState } from 'react';
import { Lock, Globe, Loader2 } from 'lucide-react';
import { toggleCanvasPrivacyAction } from '@/lib/actions/studio.actions';
import { cn } from '@/lib/utils';

interface PrivacyToggleProps {
  canvasId: string;
  initialIsPublic: boolean;
}

export function PrivacyToggle({ canvasId, initialIsPublic }: PrivacyToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const nextState = !isPublic;
      await toggleCanvasPrivacyAction(canvasId, nextState);
      setIsPublic(nextState);
    } catch (err) {
      console.error('Privacy toggle failed:', err);
      alert('Failed to update privacy settings.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isUpdating}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border",
        isPublic 
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" 
          : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:bg-zinc-700"
      )}
      title={isPublic ? "Public - Anyone with the link can view" : "Private - Only you can view"}
    >
      {isUpdating ? (
        <Loader2 size={10} className="animate-spin" />
      ) : isPublic ? (
        <Globe size={10} />
      ) : (
        <Lock size={10} />
      )}
      {isPublic ? 'Public' : 'Private'}
    </button>
  );
}
