import { create } from 'zustand';

export type DesignerMode = 'app' | 'component' | 'web';

export interface GeneratedScreen {
  id: string;
  screenName: string;
  code: string;          // React/Tailwind code
  prompt: string;        // original app description
  timestamp: number;
  mode: DesignerMode;     // what mode generated this
  // Legacy image fields (kept for backward compat)
  image?: string;
  mimeType?: string;
}

export interface AppDesignerMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  screens?: GeneratedScreen[];
  isLoading?: boolean;
  timestamp: number;
}

interface AppDesignerState {
  messages: AppDesignerMessage[];
  galleryScreens: GeneratedScreen[];
  isGenerating: boolean;
  activeScreenId: string | null;
  builderMode: DesignerMode;

  addMessage: (msg: AppDesignerMessage) => void;
  updateMessage: (id: string, updates: Partial<AppDesignerMessage>) => void;
  addGalleryScreens: (screens: GeneratedScreen[]) => void;
  removeGalleryScreen: (id: string) => void;
  updateGalleryScreen: (id: string, updates: Partial<GeneratedScreen>) => void;
  setActiveScreenId: (id: string | null) => void;
  setIsGenerating: (v: boolean) => void;
  setBuilderMode: (mode: DesignerMode) => void;
  clearChat: () => void;
  clearGallery: () => void;
  savedCanvasId: string | null;
  setSavedCanvasId: (id: string | null) => void;
  projectTitle: string | null;
  setProjectTitle: (title: string | null) => void;
}

export const useAppDesignerStore = create<AppDesignerState>((set, get) => ({
  messages: [],
  galleryScreens: [],
  isGenerating: false,
  activeScreenId: null,
  builderMode: 'app',
  savedCanvasId: null,
  projectTitle: null,
  
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
  clearGallery: () => set({ galleryScreens: [], activeScreenId: null, savedCanvasId: null, projectTitle: null }),
  setSavedCanvasId: (id) => set({ savedCanvasId: id }),
  setProjectTitle: (title) => set({ projectTitle: title }),
}));
