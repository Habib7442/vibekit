'use client';

import { useRef, useState, useEffect } from 'react';
import { SandpackProvider, SandpackLayout, SandpackPreview, useSandpack } from "@codesandbox/sandpack-react";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw } from 'lucide-react';

/**
 * Replicating the Error Guard from the Builder page for consistency
 */
function SandpackErrorGuard() {
  const { sandpack } = useSandpack();
  const [retried, setRetried] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasError = !!sandpack.error;

  useEffect(() => {
    if (hasError && !retried) {
      retryTimer.current = setTimeout(() => {
        setRetried(true);
        sandpack.runSandpack();
      }, 800);
      return () => {
        if (retryTimer.current) clearTimeout(retryTimer.current);
      };
    }
    if (hasError && retried) setShowOverlay(true);
    if (!hasError) setShowOverlay(false);
  }, [hasError, retried]);

  return (
    <>
      <style>{`
        .sp-preview-container [class*="error"],
        .sp-preview-container [style*="background: rgb(255"],
        .sp-preview-container [style*="background-color: rgb(255"],
        .sp-overlay,
        .sp-error {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }
      `}</style>

      {(hasError || showOverlay) && (
        <div
          className="absolute inset-0 bg-[#0C0C11] flex flex-col items-center justify-center gap-3 p-6"
          style={{ zIndex: 9999 }}
        >
          {!retried ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={20} className="text-zinc-500 animate-spin" />
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Restoring Design...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={18} className="text-zinc-600" />
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Preview Error</p>
              <button
                onClick={() => {
                  setRetried(false);
                  setShowOverlay(false);
                  sandpack.runSandpack();
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[9px] font-bold uppercase tracking-widest transition-all"
              >
                Retry Render
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

interface ReadOnlyPreviewProps {
  code: string;
  type: 'app' | 'web' | 'component';
}

export function ReadOnlyPreview({ code, type }: ReadOnlyPreviewProps) {
  const sandpackFiles = {
    "/index.html": {
      code: code.includes('<head>') 
        ? code.replace('</head>', `<style>
            *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
            * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
            body { overflow-x: hidden; }
          </style></head>`)
        : `<!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
                * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
                body { font-family: sans-serif; margin: 0; padding: 0; overflow-x: hidden; background: transparent; }
              </style>
            </head>
            <body>${code}</body>
          </html>`,
      active: true,
    },
  };

  const isMobile = type === 'app';

  return (
    <div className={cn(
      "w-full h-full bg-transparent overflow-hidden",
      isMobile ? "max-w-[390px] mx-auto " : "w-full"
    )}>
      <SandpackProvider
        template="static"
        theme="dark"
        files={sandpackFiles}
      >
        <SandpackLayout style={{ border: 'none', background: 'transparent' }}>
          <SandpackPreview 
            style={{ 
              height: isMobile ? "844px" : "100%",
              width: "100%",
              background: "transparent"
            }} 
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            showNavigator={false}
          />
        </SandpackLayout>
        <SandpackErrorGuard />
      </SandpackProvider>
    </div>
  );
}

