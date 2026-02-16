'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppBuilderStore, BuilderMode } from '@/lib/store/useAppBuilderStore';
import { AppBuilderChatPanel } from '@/components/studio/AppBuilderChatPanel';
import { AppBuilderGallery } from '@/components/studio/AppBuilderGallery';
import { Loader2 } from 'lucide-react';

function BuilderContent() {
  const { setBuilderMode, builderMode } = useAppBuilderStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasSynced = useRef(false);

  // Sync URL -> Store (once on mount)
  useEffect(() => {
    if (hasSynced.current || !searchParams) return;
    hasSynced.current = true;

    const type = searchParams.get('type') as BuilderMode;
    if (type && (type === 'app' || type === 'component')) {
      setBuilderMode(type);
    } else if (!type) {
      router.replace(`/studio/builder?type=${builderMode}`, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full animate-in fade-in duration-500">
      <div className="hidden md:block w-[320px] shrink-0 h-full border-r border-zinc-800/50">
        <AppBuilderChatPanel />
      </div>
      <div className="md:hidden">
        <AppBuilderChatPanel />
      </div>
      <div className="flex-1 h-full font-sans">
        <AppBuilderGallery />
      </div>
    </div>
  );
}

export default function AppBuilderPage() {
  return (
    <Suspense fallback={<div className="flex-1 h-full bg-[#050505] flex items-center justify-center"><Loader2 className="w-6 h-6 text-zinc-500 animate-spin" /></div>}>
      <BuilderContent />
    </Suspense>
  );
}
