"use client";

import React from "react";
import { motion } from "framer-motion";
import { Globe, Lock, LogOut } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

interface ProfileProgressProps {
  progress: number;
  isPublic: boolean;
  onTogglePrivacy: () => void;
}

export function ProfileProgress({ progress, isPublic, onTogglePrivacy }: ProfileProgressProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-zinc-900/40 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md">
      <div className="flex-1 space-y-3 w-full">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          <span>Profile Completion</span>
          <span className="text-primary">{progress}%</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${progress}%` }}
             className="h-full bg-primary shadow-[0_0_15px_rgba(255,224,194,0.3)]"
          />
        </div>
        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest text-center">
          {progress < 100 ? "Complete your stats to unlock professional media kits" : "Your profile is optimized for brand deals"}
        </p>
      </div>

      <div className="flex items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5">
         <button 
           onClick={onTogglePrivacy}
           className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isPublic ? 'bg-primary text-black' : 'text-zinc-500 hover:text-white'}`}
         >
           {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
           {isPublic ? "Public" : "Private"}
         </button>
         <SignOutButton>
           <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-red-400 hover:bg-red-400/10 transition-all">
             <LogOut className="w-3.5 h-3.5" />
             <span className="hidden sm:inline">Sign Out</span>
           </button>
         </SignOutButton>
      </div>
    </div>
  );
}
