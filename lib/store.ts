import { create } from 'zustand';

interface DesignVersion {
  id: string;
  name: string;
  code: string;
  timestamp: string;
}

interface UserData {
  name: string;
  bio: string;
  instagramFollowers: string;
  youtubeSubscribers: string;
  xFollowers: string;
  instagramLink: string;
  youtubeLink: string;
  xLink: string;
  engagementRate: string;
  email: string;
  photos: string[]; 
  profileImageUrl: string;
  username: string;
  monthlyReach: string;
  avgViews: string;
  femalePercentage: string;
  malePercentage: string;
  topAgeRange: string;
  topCountry: string;
  isPublic: boolean;
}

interface UserState {
  userData: UserData;
  setUserData: (data: Partial<UserData>) => void;
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
  prompt: string;
  setPrompt: (prompt: string) => void;
  isGenerating: boolean;
  setIsGenerating: (status: boolean) => void;
  versions: DesignVersion[];
  addVersion: (name: string, code: string) => void;
  mediaKit: any; 
  setMediaKit: (kit: any) => void;
  updateSection: (section: string, data: any) => void;
  credits: number;
  setCredits: (credits: number) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (status: boolean) => void;
}

export const useStore = create<UserState>((set) => ({
  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  credits: 0,
  setCredits: (credits) => set({ credits }),
  userData: {
    name: "",
    bio: "",
    instagramFollowers: "",
    youtubeSubscribers: "",
    xFollowers: "",
    instagramLink: "",
    youtubeLink: "",
    xLink: "",
    engagementRate: "",
    email: "",
    photos: [],
    profileImageUrl: "",
    username: "",
    monthlyReach: "",
    avgViews: "",
    femalePercentage: "",
    malePercentage: "",
    topAgeRange: "",
    topCountry: "",
    isPublic: false,
  },
  setUserData: (data) => set((state) => ({ 
    userData: { ...state.userData, ...data } 
  })),
  metrics: null,
  setMetrics: (metrics) => set({ metrics }),
  bio: null,
  setBio: (bio) => set({ bio }),
  aesthetic: null,
  setAesthetic: (aesthetic) => set({ aesthetic }),
  generatedCode: null,
  setGeneratedCode: (code) => set({ generatedCode: code }),
  prompt: "",
  setPrompt: (prompt) => set({ prompt }),
  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  versions: [],
  addVersion: (name, code) => set((state) => ({
    versions: [
      {
        id: Math.random().toString(36).substring(7),
        name: name || `Revision ${state.versions.length + 1}`,
        code,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...state.versions,
    ]
  })),
  mediaKit: null,
  setMediaKit: (mediaKit) => set({ mediaKit }),
  updateSection: (section, data) => set((state) => ({
    mediaKit: state.mediaKit ? {
      ...state.mediaKit,
      sections: {
        ...state.mediaKit.sections,
        [section]: data
      }
    } : null
  })),
}));
