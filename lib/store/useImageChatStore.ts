import { create } from 'zustand';

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
  
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  addGalleryImages: (images: GeneratedImage[]) => void;
  removeGalleryImage: (id: string) => void;
  updateGalleryImage: (id: string, updates: Partial<GeneratedImage>) => void;
  setIsGenerating: (v: boolean) => void;
  clearChat: () => void;
  clearGallery: () => void;
}

export const useImageChatStore = create<ImageChatState>((set, get) => ({
  messages: [],
  galleryImages: [],
  isGenerating: false,

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
  
  clearChat: () => set({ messages: [] }),
  clearGallery: () => set({ galleryImages: [] }),
}));
