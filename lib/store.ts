import { create } from 'zustand';

interface UserState {
  metrics: {
    follower_count: number | null;
    engagement_rate: number | null;
    total_reach: number | null;
  } | null;
  setMetrics: (metrics: any) => void;
  bio: string | null;
  setBio: (bio: string) => void;
  aesthetic: string | null;
  setAesthetic: (aesthetic: string) => void;
  generatedCode: string | null;
  setGeneratedCode: (code: string) => void;
}

export const useStore = create<UserState>((set) => ({
  metrics: null,
  setMetrics: (metrics) => set({ metrics }),
  bio: null,
  setBio: (bio) => set({ bio }),
  aesthetic: null,
  setAesthetic: (aesthetic) => set({ aesthetic }),
  generatedCode: null,
  setGeneratedCode: (code) => set({ generatedCode: code }),
}));
