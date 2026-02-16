'use client';

import { RefreshCcw } from 'lucide-react';

export function RetryButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all flex items-center gap-2"
    >
      <RefreshCcw size={14} />
      Try Again
    </button>
  );
}
