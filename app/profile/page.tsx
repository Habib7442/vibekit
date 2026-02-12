"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2, Edit3, Check } from "lucide-react";

import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { ProfileProgress } from "@/components/profile/ProfileProgress";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { AnalyticsSection } from "@/components/profile/AnalyticsSection";
import { AssetLibrary } from "@/components/profile/AssetLibrary";
import { useStore } from "@/lib/store";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { sidebarCollapsed, setCredits } = useStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();

  const [editStats, setEditStats] = useState<any>({
    photos: []
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!isLoaded || !user) return;
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setCredits(data.credits || 0);
          setEditStats({
            name: data.name || user.fullName || "",
            bio: data.bio || "",
            email: data.email || user.primaryEmailAddress?.emailAddress || "",
            username: data.username || "",
            instagram_followers: data.instagram_followers || "",
            youtube_subscribers: data.youtube_subscribers || "",
            x_followers: data.x_followers || "",
            engagement_rate: data.engagement_rate || "",
            monthly_reach: data.monthly_reach || "",
            avg_views: data.avg_views || "",
            female_percentage: data.female_percentage || "",
            male_percentage: data.male_percentage || "",
            top_age_range: data.top_age_range || "",
            top_country: data.top_country || "",
            is_public: data.is_public ?? false,
            photos: data.photos || [],
            profile_image_url: data.profile_image_url || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user, isLoaded]);

  const handleSaveStats = async (customStats?: any) => {
    if (saving && !customStats) return;
    const statsToSave = customStats || editStats;
    if (!customStats) setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          name: statsToSave.name,
          bio: statsToSave.bio,
          email: statsToSave.email,
          username: statsToSave.username,
          instagramFollowers: statsToSave.instagram_followers,
          youtubeSubscribers: statsToSave.youtube_subscribers,
          xFollowers: statsToSave.x_followers,
          engagementRate: statsToSave.engagement_rate,
          monthlyReach: statsToSave.monthly_reach,
          avgViews: statsToSave.avg_views,
          femalePercentage: statsToSave.female_percentage,
          malePercentage: statsToSave.male_percentage,
          topAgeRange: statsToSave.top_age_range,
          topCountry: statsToSave.top_country,
          isPublic: statsToSave.is_public,
          photos: statsToSave.photos,
          profile_image_url: statsToSave.profile_image_url,
        }),
      });

      if (response.ok) {
        setProfile({ ...profile, ...statsToSave });
        if (!customStats) setEditMode(false);
      } else if (!customStats) {
        const err = await response.json();
        alert(`Failed to save: ${err.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Save failed:", error);
      if (!customStats) alert("Something went wrong while saving. Please try again.");
    } finally {
      if (!customStats) setSaving(false);
    }
  };

  const handleWriteWithGemini = async () => {
    if (!editStats.name) {
      alert("Please enter your name first.");
      return;
    }

    setGeneratingBio(true);
    try {
      const response = await fetch("/api/generate/bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editStats.name,
          currentBio: editStats.bio,
          stats: {
            niche: editStats.bio,
            platforms: "Instagram, YouTube, X"
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEditStats({ ...editStats, bio: data.bio });
      }
    } catch (error) {
      console.error("Gemini generation failed:", error);
    } finally {
      setGeneratingBio(false);
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("type", "profile");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      
      // Update local state and auto-save to database
      const updatedStats = { ...editStats, profile_image_url: data.publicUrl };
      setEditStats(updatedStats);
      await handleSaveStats(updatedStats);
      
      // Update current profile display
      setProfile((prev: any) => ({ ...prev, profile_image_url: data.publicUrl }));
      
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Failed to upload profile picture: ${error.message}`);
    } finally {
      setSaving(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSaving(true);
    try {
      const newPhotos = [...(editStats.photos || [])];
      
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i], files[i].name);
        
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data?.publicUrl || data?.url) {
            newPhotos.push(data.publicUrl || data.url);
          }
        }
      }
      
      setEditStats({ ...editStats, photos: newPhotos });
      // Auto-save the new photo list to the profile
      await handleSaveStats({ ...editStats, photos: newPhotos });
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload some assets.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMedia = async (url: string) => {
    setSaving(true);
    try {
      // Delete from Supabase storage and assets table
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const newPhotos = editStats.photos.filter((p: string) => p !== url);
      setEditStats({
        ...editStats,
        photos: newPhotos
      });
      // Auto-save after delete
      await handleSaveStats({ ...editStats, photos: newPhotos });
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete asset.");
    } finally {
      setSaving(false);
    }
  };

  const calculateProgress = () => {
    if (!profile) return 0;
    const fields = [
      profile.name, profile.bio, profile.profile_image_url, 
      profile.instagram_followers, profile.youtube_subscribers, 
      profile.engagement_rate, profile.monthly_reach, 
      profile.top_country, profile.top_age_range
    ];
    const filled = fields.filter(f => f && f !== "").length;
    return Math.round((filled / fields.length) * 100);
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (profile && !profile.onboarding_complete) {
    router.push("/onboarding");
    return null;
  }

  const progress = calculateProgress();

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <MobileNav />
      
      <main 
        className={`flex-1 flex flex-col relative overflow-x-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-20 lg:pt-0`}
      >
        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
        
        <div className="p-6 lg:p-12 max-w-6xl mx-auto w-full space-y-12 pb-32">
          {/* Top Bar with Completion & Privacy */}
          <ProfileProgress 
            progress={progress} 
            isPublic={editStats.is_public}
            onTogglePrivacy={() => setEditStats({ ...editStats, is_public: !editStats.is_public })}
          />

          {/* Header Section */}
          <ProfileHeader 
            user={user}
            profile={profile}
            editMode={editMode}
            editStats={editStats}
            onEditStatsChange={(updates) => setEditStats({ ...editStats, ...updates })}
            onWriteWithGemini={handleWriteWithGemini}
            generatingBio={generatingBio}
            onProfileImageEdit={() => document.getElementById('profile-image-input')?.click()}
          />

          <input 
            type="file" 
            id="profile-image-input" 
            className="hidden" 
            accept="image/*"
            onChange={handleProfileImageUpload}
          />

          {/* Stats Management Section */}
          <div className="space-y-12">
            <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/5 pb-6 gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold tracking-tight text-white">Workspace Controls</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Update your intelligence engine</p>
              </div>
              <button 
                onClick={() => editMode ? handleSaveStats() : setEditMode(true)}
                disabled={saving}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${editMode ? 'bg-[#FFE0C2] text-black shadow-lg shadow-[#FFE0C2]/10' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : editMode ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </>
                )}
              </button>
            </div>

            <AnalyticsSection 
              editMode={editMode}
              editStats={editStats}
              onEditStatsChange={(updates) => setEditStats({ ...editStats, ...updates })}
            />

            <AssetLibrary 
              photos={editStats.photos}
              onUpload={handleUploadMedia}
              onDelete={handleDeleteMedia}
              uploading={saving}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
