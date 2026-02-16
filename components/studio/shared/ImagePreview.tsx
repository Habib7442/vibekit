'use client';

import { useState, useCallback } from 'react';
import { ImageIcon, Download, Maximize2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Lightbox } from './Lightbox';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

interface ImagePreviewAction {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}

interface ImagePreviewProps {
  imageUrl: string | null;
  fileName?: string;
  isLoading?: boolean;
  loadingText?: string;
  idleText?: string;
  onEdit?: () => void;
  extraActions?: ImagePreviewAction[];
  className?: string;
}

export function ImagePreview({
  imageUrl,
  fileName = 'asset.png',
  isLoading = false,
  loadingText = 'Painting...',
  idleText = 'Awaiting prompt',
  onEdit,
  extraActions = [],
  className,
}: ImagePreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextPos, setContextPos] = useState({ x: 0, y: 0 });

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!imageUrl) return;
    e.preventDefault();
    e.stopPropagation();
    setContextPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, [imageUrl]);

  // Build context menu items
  const contextItems: ContextMenuItem[] = [];
  if (onEdit) {
    contextItems.push({ 
      label: 'Edit Image', 
      icon: <Pencil size={14} className="text-amber-500" />, 
      onClick: onEdit 
    });
  }
  contextItems.push({ 
    label: 'View Full Size', 
    icon: <Maximize2 size={14} className="text-zinc-400" />, 
    onClick: () => setExpanded(true) 
  });
  contextItems.push({ 
    label: 'Download', 
    icon: <Download size={14} className="text-zinc-400" />, 
    onClick: () => {
      if (imageUrl) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName;
        link.click();
      }
    },
    divider: true 
  });

  return (
    <>
      <div 
        className={cn(
          "relative w-full rounded-xl overflow-hidden border border-zinc-800/50 bg-[#050505] flex items-center justify-center group/img",
          imageUrl ? "aspect-[4/5]" : "aspect-square",
          !imageUrl && !isLoading && "border-dashed",
          className
        )}
        onContextMenu={handleContextMenu}
      >
        {imageUrl ? (
          <>
            <img 
              src={imageUrl} 
              alt="Generated" 
              className="w-full h-full object-cover"
            />
            {/* Hover overlay with actions */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-end justify-center pb-3 gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 flex items-center justify-center text-white transition-all"
                title="Expand"
              >
                <Maximize2 size={16} />
              </button>
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 flex items-center justify-center text-white transition-all"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
              )}
              {extraActions.map((action, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                  className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 flex items-center justify-center text-white transition-all"
                  title={action.title}
                >
                  {action.icon}
                </button>
              ))}
              <a 
                href={imageUrl} 
                download={fileName}
                onClick={(e) => e.stopPropagation()}
                className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 flex items-center justify-center text-white transition-all"
                title="Download"
              >
                <Download size={16} />
              </a>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-600 p-6">
            {isLoading ? (
              <>
                <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-500/60">{loadingText}</p>
              </>
            ) : (
              <>
                <ImageIcon size={20} strokeWidth={1} />
                <p className="text-[9px] font-bold uppercase tracking-[0.2em]">{idleText}</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <ContextMenu 
          x={contextPos.x} 
          y={contextPos.y} 
          items={contextItems} 
          onClose={() => setShowContextMenu(false)} 
        />
      )}

      {/* Lightbox */}
      {expanded && imageUrl && (
        <Lightbox imageUrl={imageUrl} fileName={fileName} onClose={() => setExpanded(false)} />
      )}
    </>
  );
}
