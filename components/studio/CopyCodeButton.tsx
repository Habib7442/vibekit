'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyCodeButtonProps {
  code: string;
}

export function CopyCodeButton({ code }: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={cn(
        "p-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest",
        copied ? "text-emerald-400 border-emerald-500/20" : "text-zinc-500 hover:text-white"
      )}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Code'}
    </button>
  );
}
