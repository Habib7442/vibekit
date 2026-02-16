import { create } from 'zustand';

export type BuilderMode = 'app' | 'component' | 'web';

export interface GeneratedScreen {
  id: string;
  screenName: string;
  code: string;          // React/Tailwind code
  prompt: string;        // original app description
  timestamp: number;
  mode: BuilderMode;     // what mode generated this
  // Legacy image fields (kept for backward compat)
  image?: string;
  mimeType?: string;
}

export interface AppBuilderMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  screens?: GeneratedScreen[];
  isLoading?: boolean;
  timestamp: number;
}

interface AppBuilderState {
  messages: AppBuilderMessage[];
  galleryScreens: GeneratedScreen[];
  isGenerating: boolean;
  activeScreenId: string | null;
  builderMode: BuilderMode;

  addMessage: (msg: AppBuilderMessage) => void;
  updateMessage: (id: string, updates: Partial<AppBuilderMessage>) => void;
  addGalleryScreens: (screens: GeneratedScreen[]) => void;
  removeGalleryScreen: (id: string) => void;
  updateGalleryScreen: (id: string, updates: Partial<GeneratedScreen>) => void;
  setActiveScreenId: (id: string | null) => void;
  setIsGenerating: (v: boolean) => void;
  setBuilderMode: (mode: BuilderMode) => void;
  clearChat: () => void;
  clearGallery: () => void;
}

export const useAppBuilderStore = create<AppBuilderState>((set, get) => ({
  messages: [],
  galleryScreens: [],
  isGenerating: false,
  activeScreenId: null,
  builderMode: 'app',

  addMessage: (msg) => set({ messages: [...get().messages, msg] }),
  updateMessage: (id, updates) => set({
    messages: get().messages.map(m => m.id === id ? { ...m, ...updates } : m),
  }),
  addGalleryScreens: (screens) => {
    const current = get().galleryScreens;
    const updated = [...current, ...screens];
    set({
      galleryScreens: updated,
      activeScreenId: get().activeScreenId || screens[0]?.id || null,
    });
  },
  removeGalleryScreen: (id) => {
    const remaining = get().galleryScreens.filter(s => s.id !== id);
    set({
      galleryScreens: remaining,
      activeScreenId: get().activeScreenId === id ? (remaining[0]?.id || null) : get().activeScreenId,
    });
  },
  updateGalleryScreen: (id, updates) => set({
    galleryScreens: get().galleryScreens.map(s => s.id === id ? { ...s, ...updates } : s),
  }),
  setActiveScreenId: (id) => set({ activeScreenId: id }),
  setIsGenerating: (v) => set({ isGenerating: v }),
  setBuilderMode: (mode) => set({ builderMode: mode }),
  clearChat: () => set({ messages: [] }),
  clearGallery: () => set({ galleryScreens: [], activeScreenId: null }),
}));
