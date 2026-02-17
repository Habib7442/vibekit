'use client';

import { Download } from 'lucide-react';

interface DownloadCodeButtonProps {
  code: string;
  fileName: string;
}

export function DownloadCodeButton({ code, fileName }: DownloadCodeButtonProps) {
  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button 
      onClick={handleDownload}
      className="p-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
      title="Download HTML"
    >
      <Download size={12} />
    </button>
  );
}
