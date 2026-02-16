'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener('click', close);
    window.addEventListener('contextmenu', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('contextmenu', close);
    };
  }, [onClose]);

  return createPortal(
    <div 
      className="fixed z-[9999]" 
      style={{ left: x, top: y }}
    >
      <div className="bg-[#12121A] border border-zinc-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden min-w-[160px] py-1 animate-in fade-in zoom-in-95 duration-150">
        {items.map((item, i) => (
          <div key={i}>
            {item.divider && <div className="border-t border-zinc-800/50 my-1" />}
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); item.onClick(); }}
              className="w-full px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/5 flex items-center gap-3 transition-colors"
            >
              {item.icon}
              {item.label}
            </button>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}
