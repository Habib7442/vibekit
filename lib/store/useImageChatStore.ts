import { create } from 'zustand';
import { StudioModel } from '@/lib/actions/identity.actions';

export interface GeneratedImage {
  id: string;
  image: string; // base64
  mimeType: string;
  prompt: string;
  aspectRatio: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: GeneratedImage[];
  imageCount?: number;
  aspectRatio?: string;
  isLoading?: boolean;
  timestamp: number;
}

interface ImageChatState {
  messages: ChatMessage[];
  galleryImages: GeneratedImage[];
  isGenerating: boolean;
  selectedIdentity: StudioModel | null;
  imageCount: number;
  aspectRatio: string;
  
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  addGalleryImages: (images: GeneratedImage[]) => void;
  removeGalleryImage: (id: string) => void;
  updateGalleryImage: (id: string, updates: Partial<GeneratedImage>) => void;
  setIsGenerating: (v: boolean) => void;
  setSelectedIdentity: (identity: StudioModel | null) => void;
  setImageCount: (count: number) => void;
  setAspectRatio: (ratio: string) => void;
  clearChat: () => void;
  clearGallery: () => void;
  savedCanvasId: string | null;
  setSavedCanvasId: (id: string | null) => void;
  generationProgress: { total: number; completed: number };
  setGenerationProgress: (progress: { total: number; completed: number }) => void;
}

export const useImageChatStore = create<ImageChatState>((set, get) => ({
  messages: [],
  galleryImages: [],
  isGenerating: false,
  selectedIdentity: null,
  imageCount: 1,
  aspectRatio: '1:1',
  savedCanvasId: null,
  generationProgress: { total: 0, completed: 0 },

  addMessage: (msg) => set({ messages: [...get().messages, msg] }),
  
  updateMessage: (id, updates) => set({
    messages: get().messages.map(m => m.id === id ? { ...m, ...updates } : m),
  }),
  
  addGalleryImages: (images) => set({
    galleryImages: [...get().galleryImages, ...images],
  }),

  removeGalleryImage: (id) => set({
    galleryImages: get().galleryImages.filter(i => i.id !== id),
  }),
  
  updateGalleryImage: (id, updates) => set({
    galleryImages: get().galleryImages.map(i => i.id === id ? { ...i, ...updates } : i),
  }),
  
  setIsGenerating: (v) => set({ isGenerating: v }),
  setSelectedIdentity: (identity) => set({ selectedIdentity: identity }),
  setImageCount: (count) => set({ imageCount: count }),
  setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
  
  clearChat: () => set({ messages: [] }),
  clearGallery: () => set({ galleryImages: [], savedCanvasId: null }),
  setSavedCanvasId: (id: string | null) => set({ savedCanvasId: id }),
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
}));
