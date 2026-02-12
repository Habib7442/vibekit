"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Instagram, 
  Youtube, 
  Twitter, 
  ExternalLink, 
  Image as ImageIcon, 
  ChevronRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { userData, setUserData } = useStore();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hydrate data if exists
  useEffect(() => {
    async function checkStatus() {
      if (!isLoaded || !user) return;
      
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const profile = await response.json();
          if (profile?.onboarding_complete) {
            // Hydrate store with existing data for editing
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
          }
          setChecking(false);
        } else {
          setChecking(false);
        }
      } catch (error) {
        console.error("Check status failed:", error);
        setChecking(false);
      }
    }
    checkStatus();
  }, [user, isLoaded]);

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file, file.name || "profile.png");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      setUserData({ profileImageUrl: data.publicUrl });
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Failed to upload profile picture: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeProfilePicture = () => {
    setUserData({ profileImageUrl: "" });
  };

  const handleSubmit = async () => {
    if (!user || loading) return;
    
    // Basic validation
    if (!userData.name || !userData.bio || !userData.email) {
      alert("Please fill in your name, bio, and email.");
      return;
    }

    setLoading(true);
    try {
      // Auto-generate username if not present
      const generatedUsername = userData.username || userData.name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          username: generatedUsername,
          onboarding_complete: true
        }),
      });

      if (!response.ok) throw new Error("Failed to update profile");
      
      router.push('/builder');
    } catch (error: any) {
      console.error("Onboarding Error:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking || !isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Header */}
          <div className="space-y-4 text-center mb-16">
            <div className="flex items-center justify-center gap-3 text-primary">
              <Sparkles className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-[0.3em]">Creator Setup</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif tracking-tight leading-tight">
              {userData.name ? "Refine your" : "Start your"} <br /> 
              <span className="text-zinc-500 italic">digital identity.</span>
            </h1>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              Just the basics. You can add detailed analytics and stats later in your profile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Identity Form */}
            <div className="space-y-8">
              <section className="space-y-6 bg-zinc-900/40 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Identity</h3>
                  <div className="h-px bg-white/5 w-full" />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Full Name</Label>
                    <Input 
                      placeholder="e.g. Hannah Morales"
                      value={userData.name}
                      onChange={(e) => setUserData({ name: e.target.value })}
                      className="bg-white/5 border-white/5 h-12 rounded-xl focus:border-primary/50 transition-all text-white placeholder:text-zinc-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Professional Email</Label>
                    <Input 
                      placeholder="e.g. hannah@creator.com"
                      value={userData.email}
                      onChange={(e) => setUserData({ email: e.target.value })}
                      className="bg-white/5 border-white/5 h-12 rounded-xl focus:border-primary/50 transition-all text-white placeholder:text-zinc-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Niche / Primary Topic</Label>
                    <Textarea 
                      placeholder="e.g. Luxury Travel & Editorial Photography"
                      value={userData.bio}
                      onChange={(e) => setUserData({ bio: e.target.value })}
                      className="bg-white/5 border-white/5 min-h-[100px] rounded-xl focus:border-primary/50 transition-all resize-none text-white placeholder:text-zinc-700"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-6 bg-zinc-900/40 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Social Links</h3>
                  <div className="h-px bg-white/5 w-full" />
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'instagramLink', icon: Instagram, label: "Instagram Link" },
                    { key: 'youtubeLink', icon: Youtube, label: "YouTube Link" },
                    { key: 'xLink', icon: Twitter, label: "X (Twitter) Link" },
                  ].map((item) => (
                    <div key={item.key} className="relative">
                      <item.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <Input 
                        placeholder={item.label}
                        value={(userData as any)[item.key]}
                        onChange={(e) => setUserData({ [item.key]: e.target.value })}
                        className="bg-white/5 border-white/5 h-11 rounded-xl pl-10 focus:border-primary/50 transition-all text-white placeholder:text-zinc-700"
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Profile Picture Column */}
            <div className="space-y-8">
              <section className="space-y-6 bg-zinc-900/40 p-10 rounded-[2.5rem] border border-white/5 backdrop-blur-md flex flex-col items-center">
                <div className="space-y-2 w-full text-center">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Profile Picture</h3>
                  <div className="h-px bg-white/5 w-full" />
                </div>

                <div className="space-y-6 w-full flex flex-col items-center py-6">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleProfilePictureUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {!userData.profileImageUrl ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/10 rounded-full w-48 h-48 flex flex-col items-center justify-center gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer group overflow-hidden"
                    >
                      <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                        <ImageIcon className="w-7 h-7 text-zinc-500 group-hover:text-primary transition-all" />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 text-center px-6">Upload Professional Headshot</span>
                    </div>
                  ) : (
                    <div className="relative w-48 h-48 group">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-primary/20 bg-zinc-800 shadow-2xl">
                        <img src={userData.profileImageUrl} className="w-full h-full object-cover" />
                      </div>
                      <button 
                        onClick={removeProfilePicture}
                        className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-8 h-8" />
                      </button>
                    </div>
                  )}
                  
                  <p className="text-[11px] text-center text-zinc-500 font-medium leading-relaxed max-w-[200px]">
                    Brands trust creators with high-quality, clear professional portraits.
                  </p>
                </div>
              </section>

              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#FFE0C2] text-black hover:opacity-90 h-16 rounded-[1.8rem] font-bold text-lg flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,224,194,0.1)] transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    {userData.name ? "Update Profile" : "Complete Onboarding"}
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </Button>

              <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                You can add detailed stats & audience metrics in your profile later.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
