'use client';

import { useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface EditBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  placeholder?: string;
  accentColor?: string;
}

export function EditBar({ 
  value, 
  onChange, 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  placeholder = 'Describe your edit...', 
  accentColor = 'amber' 
}: EditBarProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const colorMap: Record<string, { border: string; borderFocus: string; bg: string; bgHover: string }> = {
    amber: { border: 'border-amber-500/30', borderFocus: 'focus:border-amber-500/60', bg: 'bg-amber-500', bgHover: 'hover:bg-amber-400' },
    purple: { border: 'border-purple-500/30', borderFocus: 'focus:border-purple-500/60', bg: 'bg-purple-500', bgHover: 'hover:bg-purple-400' },
    blue: { border: 'border-blue-500/30', borderFocus: 'focus:border-blue-500/60', bg: 'bg-blue-500', bgHover: 'hover:bg-blue-400' },
    green: { border: 'border-green-500/30', borderFocus: 'focus:border-green-500/60', bg: 'bg-green-500', bgHover: 'hover:bg-green-400' },
  };
  const colors = colorMap[accentColor] || colorMap.amber;

  return (
    <div className="relative animate-in slide-in-from-top duration-200">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className={`w-full h-16 bg-[#050505] border ${colors.border} rounded-xl p-3 pr-10 text-white text-xs focus:outline-none ${colors.borderFocus} resize-none placeholder:text-zinc-600`}
      />
      <button
        onClick={onSubmit}
        disabled={isLoading || !value.trim()}
        className={`absolute right-2 bottom-2 w-7 h-7 rounded-lg ${colors.bg} ${colors.bgHover} disabled:opacity-30 flex items-center justify-center text-black transition-all`}
      >
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
      </button>
    </div>
  );
}
