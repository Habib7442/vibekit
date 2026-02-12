"use client";

import React, { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { 
  Plus, 
  ArrowUp, 
  ChevronRight, 
  Search, 
  LayoutGrid, 
  Clock,
  Layout,
  MoreHorizontal,
  Instagram,
  Youtube,
  Twitter,
  ExternalLink,
  Users,
  BarChart3,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { useStore } from "@/lib/store";
import { processPromptAction, startBuildingAction } from "@/app/actions/ai";
import { motion, AnimatePresence } from "framer-motion";

export default function BuilderPage() {
  const { user, isLoaded } = useUser();
  const { 
    prompt, 
    setPrompt, 
    isGenerating, 
    setIsGenerating, 
    userData, 
    setUserData,
    setCredits,
    credits,
    sidebarCollapsed
  } = useStore();
  const [isExpanding, setIsExpanding] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Onboarding Guard & Data Sync
  useEffect(() => {
    async function syncProfile() {
      if (!user) return;

      try {
        const response = await fetch('/api/profile');
        if (!response.ok) throw new Error("Failed to fetch profile");
        
        const profile = await response.json();

        if (!profile || !profile.onboarding_complete) {
          router.push('/onboarding');
          return;
        }

        // Sync to store
        setUserData({
          name: profile.name || "",
          bio: profile.bio || "",
          email: profile.email || "",
          instagramFollowers: profile.instagram_followers || "",
          youtubeSubscribers: profile.youtube_subscribers || "",
          xFollowers: profile.x_followers || "",
          instagramLink: profile.instagram_link || "",
          youtubeLink: profile.youtube_link || "",
          xLink: profile.x_link || "",
          engagementRate: profile.engagement_rate || "",
          photos: profile.photos || [],
          profileImageUrl: profile.profile_image_url || "",
          username: profile.username || "",
          monthlyReach: profile.monthly_reach || "",
          avgViews: profile.avg_views || "",
          femalePercentage: profile.female_percentage || "",
          malePercentage: profile.male_percentage || "",
          topAgeRange: profile.top_age_range || "",
          topCountry: profile.top_country || "",
          isPublic: profile.is_public ?? false,
        });
        setCredits(profile.credits || 0);
        setIsChecking(false);
      } catch (error) {
        console.error("Profile sync failed:", error);
        router.push('/onboarding');
      }
    }

    if (isLoaded && user) {
      syncProfile();
    } else if (isLoaded && !user) {
      setIsChecking(false);
    }
  }, [user, isLoaded]);

  const handlePlan = async () => {
    if (!prompt.trim() || isExpanding || isGenerating) return;

    setIsExpanding(true);
    try {
      const detailed = await processPromptAction(prompt);
      if (detailed) {
        setPrompt(detailed);
      }
    } finally {
      setIsExpanding(false);
    }
  };

  const handleStartBuilding = () => {
    if (!prompt.trim() || isGenerating) return;
    if (credits < 1) {
      alert("You need at least 1 credit to generate a media kit.");
      return;
    }
    router.push(`/builder/${crypto.randomUUID()}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePlan();
    }
  };

  useEffect(() => {
    const savedPrompt = sessionStorage.getItem("last_prompt");
    if (savedPrompt && !prompt) {
      setPrompt(savedPrompt);
      sessionStorage.removeItem("last_prompt");
    }
  }, []);

  const calculateProgress = () => {
    const fields = [
      userData.name, userData.bio, userData.profileImageUrl, 
      userData.instagramFollowers, userData.youtubeSubscribers, 
      userData.engagementRate, userData.monthlyReach, 
      userData.topCountry, userData.topAgeRange
    ];
    const filled = fields.filter(f => f && f !== "").length;
    return Math.round((filled / fields.length) * 100);
  };

  if (!isLoaded || isChecking) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-[#FFE0C2] animate-spin" />
        <p className="text-zinc-500 text-sm font-medium tracking-widest uppercase">Syncing your vibe...</p>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="flex min-h-screen bg-black text-foreground">
      <Sidebar />
      <MobileNav />
      
      <main 
        className={`flex-1 flex flex-col min-h-screen relative overflow-x-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-20 lg:pt-0`}
      >
        {/* Top Feature Banner & Gradient Area */}
        <section className="relative py-16 px-6 lg:px-12 flex flex-col items-center">
          {/* Animated Mesh Gradient Background */}
          <div className="absolute top-0 right-0 w-[120%] h-[500px] bg-[radial-gradient(circle_at_60%_20%,rgba(255,224,194,0.1),transparent_50%),radial-gradient(circle_at_40%_60%,rgba(57,48,40,0.2),transparent_60%),radial-gradient(circle_at_50%_40%,rgba(17,17,17,1),transparent_80%)] -z-10 blur-3xl opacity-80" />
          <div className="absolute top-0 left-0 w-full h-[600px] bg-[linear-gradient(to_bottom,transparent,rgba(17,17,17,1))] -z-10" />

          {/* Profile Completion Warning */}
          {progress < 100 && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-lg mb-8 bg-zinc-900/40 border border-white/5 p-4 rounded-3xl backdrop-blur-md cursor-pointer"
              onClick={() => router.push('/profile')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Profile Efficiency</span>
                <span className="text-primary text-[10px] font-bold">{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${progress}%` }}
                   className="h-full bg-primary"
                />
              </div>
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest text-center">
                Add stats to profile to improve AI generation accuracy
              </p>
            </motion.div>
          )}

          {/* New Feature Badge */}
          <div className="flex items-center gap-2 bg-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-8 border border-primary/20 hover:bg-primary/30 transition-all cursor-pointer group">
            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-md text-[10px]">New</span>
            <span>Introducing a smarter VibeStudio</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold mb-10 tracking-tight text-white text-center px-4">
            Ready to build, {user?.firstName || "Habib"}?
          </h1>

          {/* Builder Chat Interface */}
          <div 
            onClick={() => textareaRef.current?.focus()}
            className="w-full max-w-3xl bg-zinc-900/60 backdrop-blur-3xl border border-border/50 rounded-[2rem] p-6 mb-12 shadow-2xl relative group focus-within:border-primary/30 transition-all duration-300 cursor-text ring-1 ring-white/5 mx-4"
          >
            <div className="flex flex-col gap-6 min-h-[140px] text-left">
              <div className="flex-1">
                <textarea 
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask VibeStudio to create a"
                  className="w-full bg-transparent border-none focus:ring-0 text-white text-lg lg:text-xl font-medium placeholder:text-zinc-600 outline-none resize-none h-24 scrollbar-none"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2.5 text-zinc-500 hover:text-white transition-colors cursor-pointer bg-zinc-800/50 rounded-full">
                    <Plus className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button 
                    onClick={handlePlan}
                    disabled={isExpanding || !prompt.trim()}
                    className="bg-primary text-primary-foreground hover:opacity-90 rounded-full px-6 py-2 font-bold h-10 shadow-lg border-none disabled:opacity-50"
                  >
                    {isExpanding ? "Expanding..." : "Plan"}
                  </Button>
                  
                  <div 
                    onClick={handleStartBuilding}
                    className={`h-10 w-10 bg-zinc-100 text-black rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg cursor-pointer active:scale-95 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isGenerating ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <ArrowUp className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Projects Section */}
        <section className="flex-1 px-6 lg:px-12 pb-20">
          <div className="max-w-6xl mx-auto bg-zinc-900/40 border border-border/50 rounded-[2.5rem] p-6 lg:p-8 shadow-inner overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-primary cursor-pointer">
                  <span className="text-sm font-bold text-white leading-tight">My media kits</span>
                </div>
                <div className="flex items-center gap-2 pb-2 border-b-2 border-transparent hover:border-zinc-700 transition-colors cursor-pointer">
                  <span className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors">Templates</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer group">
                <span className="text-sm font-semibold">Browse all</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProjectCard 
                name="Lifestyle Media Kit" 
                time="Edited 1 minute ago" 
                thumbnail="/thumbnail-1.webp" 
                userChar={user?.firstName?.charAt(0) || "H"} 
              />
              <ProjectCard 
                name="Gaming Portfolio v2" 
                time="Edited 2 hours ago" 
                thumbnail="/thumbnail-2.webp" 
                userChar={user?.firstName?.charAt(0) || "H"}
              />
              <div className="border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-zinc-700 transition-colors cursor-pointer group min-h-[280px]">
                 <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors shadow-xl">
                   <Plus className="w-6 h-6 text-zinc-500" />
                 </div>
                 <span className="text-sm font-bold text-zinc-600">New Kit</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ProjectCard({ name, time, thumbnail, userChar }: { name: string, time: string, thumbnail: string, userChar: string }) {
  return (
    <div className="bg-zinc-900/60 border border-border/50 rounded-3xl overflow-hidden group hover:border-primary/20 transition-all cursor-pointer shadow-xl hover:shadow-primary/5">
      <div className="aspect-video bg-zinc-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center opacity-40 group-hover:scale-105 transition-transform duration-500">
          <Layout className="w-12 h-12 text-zinc-700" />
        </div>
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
          Chat
        </div>
      </div>
      
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">
            {userChar}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-tight">{name}</span>
            <span className="text-xs text-zinc-500 mt-0.5">{time}</span>
          </div>
        </div>
        <button className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-white">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
