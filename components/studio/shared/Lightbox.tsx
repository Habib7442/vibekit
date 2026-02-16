'use client';

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Download } from 'lucide-react';

interface LightboxProps {
  imageUrl: string;
  fileName?: string;
  onClose: () => void;
}

export function Lightbox({ imageUrl, fileName = 'asset.png', onClose }: LightboxProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10"
      >
        <X size={22} />
      </button>

      <img 
        src={imageUrl} 
        alt="Full preview" 
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      <div className="absolute bottom-8 flex gap-3">
        <a 
          href={imageUrl} 
          download={fileName}
          onClick={(e) => e.stopPropagation()}
          className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-xs font-medium flex items-center gap-2 transition-all"
        >
          <Download size={14} /> Download
        </a>
      </div>
    </div>,
    document.body
  );
}
