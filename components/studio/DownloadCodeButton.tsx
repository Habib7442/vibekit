'use client';

import { Download, Smartphone, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { convertToReactNativeAction } from '@/lib/actions/ai.actions';

interface DownloadCodeButtonProps {
  code: string;
  fileName: string;
  mode?: 'app' | 'component' | 'web';
}

export function DownloadCodeButton({ code, fileName, mode }: DownloadCodeButtonProps) {
  const [isConverting, setIsConverting] = useState(false);

  const handleDownloadHtml = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadReactNative = async () => {
    try {
      setIsConverting(true);
      const result = await convertToReactNativeAction(code);
      
      if (result.wasTruncated) {
        alert("Warning: The HTML code was too large and has been truncated. The React Native output might be incomplete.");
      }

      const blob = new Blob([result.code], { type: 'text/typescript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName.toLowerCase().replace(/\s+/g, '-')}-rn.tsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("RN Conversion failed:", err);
      alert("Failed to convert to React Native. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handleDownloadHtml}
        className="p-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
        title="Download HTML"
      >
        <Download size={12} />
        <span className="hidden md:inline">HTML</span>
      </button>

      {mode === 'app' && (
        <button 
          onClick={handleDownloadReactNative}
          disabled={isConverting}
          className="p-2 px-3 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20 hover:text-indigo-300 transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export as React Native"
        >
          {isConverting ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Smartphone size={12} />
          )}
          <span className="hidden md:inline">{isConverting ? 'Converting...' : 'React Native'}</span>
        </button>
      )}
    </div>
  );
}
