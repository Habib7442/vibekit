"use client";

import React from "react";
import { 
  Mail, 
  Calendar, 
  Edit3, 
  User, 
  AtSign, 
  Sparkles, 
  Zap, 
  Loader2 
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ProfileHeaderProps {
  user: any;
  profile: any;
  editMode: boolean;
  editStats: any;
  onEditStatsChange: (updates: any) => void;
  onWriteWithGemini: () => void;
  generatingBio: boolean;
  onProfileImageEdit: () => void;
}

export function ProfileHeader({ 
  user, 
  profile, 
  editMode, 
  editStats, 
  onEditStatsChange, 
  onWriteWithGemini, 
  generatingBio,
  onProfileImageEdit
}: ProfileHeaderProps) {
  return (
    <section className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start md:items-center">
      <div className="relative group mx-auto md:mx-0">
        <div className="w-32 h-32 md:w-36 md:h-36 rounded-[2.5rem] overflow-hidden border-2 border-white/10 p-1.5 bg-zinc-900/50 backdrop-blur-xl transition-transform group-hover:scale-[1.02]">
          <div className="w-full h-full rounded-[2.2rem] overflow-hidden">
            <img 
              src={profile?.profile_image_url || user?.imageUrl} 
              alt={profile?.name || "User"}
              className="w-full h-full object-cover object-top grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
        </div>
        <button 
          onClick={onProfileImageEdit}
          className="absolute -bottom-1 -right-1 bg-white text-black p-2.5 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 space-y-6 w-full text-center md:text-left">
        {editMode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-1.5 text-left">
                <Label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <Input 
                    value={editStats.name}
                    onChange={(e) => onEditStatsChange({ name: e.target.value })}
                    className="bg-zinc-900/40 border-white/5 h-10 pl-10 rounded-xl text-sm"
                  />
                </div>
             </div>
             <div className="space-y-1.5 text-left">
                <Label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Username</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <Input 
                    value={editStats.username}
                    onChange={(e) => onEditStatsChange({ username: e.target.value })}
                    className="bg-zinc-900/40 border-white/5 h-10 pl-10 rounded-xl text-sm"
                    placeholder="creator_handle"
                  />
                </div>
             </div>
             <div className="space-y-1.5 md:col-span-2 text-left">
                <div className="flex items-center justify-between pr-1">
                  <Label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Creator Bio</Label>
                  <button 
                    onClick={onWriteWithGemini}
                    disabled={generatingBio}
                    className="flex items-center gap-1.5 px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-[10px] font-bold rounded-lg transition-all"
                  >
                    {generatingBio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    <span className="hidden xs:inline">Write with Gemini</span>
                    <span className="xs:hidden">AI Write</span>
                  </button>
                </div>
                <Textarea 
                  value={editStats.bio}
                  onChange={(e) => onEditStatsChange({ bio: e.target.value })}
                  className="bg-zinc-900/40 border-white/5 min-h-[100px] rounded-xl text-sm resize-none"
                  placeholder="Establish your high-end creator identity..."
                />
             </div>
             <div className="space-y-1.5 md:col-span-2 text-left">
                <Label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Business Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <Input 
                    value={editStats.email}
                    onChange={(e) => onEditStatsChange({ email: e.target.value })}
                    className="bg-zinc-900/40 border-white/5 h-10 pl-10 rounded-xl text-sm"
                  />
                </div>
             </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-4xl lg:text-5xl font-serif font-bold tracking-tight">
                  {profile?.name || user?.fullName}
                </h1>
                <p className="text-primary text-sm font-bold tracking-tight">@{profile?.username || "creator"}</p>
              </div>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-2xl mx-auto md:mx-0">
                {profile?.bio}
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                <span>{profile?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Verified Creator</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] min-w-[240px] text-center space-y-4 relative overflow-hidden h-fit mx-auto md:mx-0">
          <Zap className="absolute top-2 right-2 w-12 h-12 text-primary/5 -rotate-12" />
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none">Vibe Credits</p>
             <p className="text-5xl font-bold tracking-tighter text-white">
                {profile?.credits || 0}
             </p>
          </div>
          <button className="w-full bg-primary text-black py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-lg shadow-primary/10">
             Manage
          </button>
      </div>
    </section>
  );
}
