"use client";

import React from "react";
import { 
  Instagram, 
  Youtube, 
  Twitter, 
  TrendingUp, 
  BarChart3, 
  Users as UsersIcon, 
  Globe 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AnalyticsSectionProps {
  editMode: boolean;
  editStats: any;
  onEditStatsChange: (updates: any) => void;
}

export function AnalyticsSection({ editMode, editStats, onEditStatsChange }: AnalyticsSectionProps) {
  return (
    <section className="space-y-8">
      {/* Short description of the section */}
      <div className="space-y-1 text-center sm:text-left">
        <h2 className="text-2xl font-bold tracking-tight text-white">Professional Analytics</h2>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Master data for your media kits</p>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EditableStat 
          editMode={editMode} 
          icon={Instagram} 
          label="IG Followers" 
          value={editStats.instagram_followers} 
          onChange={(v) => onEditStatsChange({ instagram_followers: v })}
        />
        <EditableStat 
          editMode={editMode} 
          icon={Youtube} 
          label="YT Subscriptions" 
          value={editStats.youtube_subscribers} 
          onChange={(v) => onEditStatsChange({ youtube_subscribers: v })}
        />
        <EditableStat 
          editMode={editMode} 
          icon={Twitter} 
          label="X Followers" 
          value={editStats.x_followers} 
          onChange={(v) => onEditStatsChange({ x_followers: v })}
        />
        <EditableStat 
          editMode={editMode} 
          icon={TrendingUp} 
          label="Engagement Rate" 
          value={editStats.engagement_rate} 
          onChange={(v) => onEditStatsChange({ engagement_rate: v })}
        />
      </div>

      {/* Deep Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-900/40 p-6 lg:p-8 rounded-[2.5rem] border border-white/5 space-y-6">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" /> Reach & Impact
          </h3>
          <div className="space-y-4">
             <MetricInput 
               editMode={editMode} 
               label="Monthly Reach" 
               value={editStats.monthly_reach} 
               placeholder="e.g. 1.2M"
               onChange={(v) => onEditStatsChange({ monthly_reach: v })}
             />
             <MetricInput 
               editMode={editMode} 
               label="Avg Views" 
               value={editStats.avg_views} 
               placeholder="e.g. 50K"
               onChange={(v) => onEditStatsChange({ avg_views: v })}
             />
          </div>
        </div>

        <div className="bg-zinc-900/40 p-6 lg:p-8 rounded-[2.5rem] border border-white/5 space-y-6">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
            <UsersIcon className="w-3.5 h-3.5" /> Demographic Mix
          </h3>
          <div className="grid grid-cols-2 gap-4">
             <MetricInput 
               editMode={editMode} 
               label="Female %" 
               value={editStats.female_percentage} 
               placeholder="e.g. 65%"
               onChange={(v) => onEditStatsChange({ female_percentage: v })}
             />
             <MetricInput 
               editMode={editMode} 
               label="Male %" 
               value={editStats.male_percentage} 
               placeholder="e.g. 35%"
               onChange={(v) => onEditStatsChange({ male_percentage: v })}
             />
          </div>
          <MetricInput 
            editMode={editMode} 
            label="Top Age Range" 
            value={editStats.top_age_range} 
            placeholder="e.g. 18-24"
            onChange={(v) => onEditStatsChange({ top_age_range: v })}
          />
        </div>

        <div className="bg-zinc-900/40 p-6 lg:p-8 rounded-[2.5rem] border border-white/5 space-y-6">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" /> Top Location
          </h3>
          <MetricInput 
            editMode={editMode} 
            label="Primary Country" 
            value={editStats.top_country} 
            placeholder="e.g. United States"
            onChange={(v) => onEditStatsChange({ top_country: v })}
          />
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-[10px] font-medium text-zinc-500 leading-relaxed italic">
            "Having these stats verified and ready helps Gemini build higher-converting media kits for you."
          </div>
        </div>
      </div>
    </section>
  );
}

function EditableStat({ editMode, icon: Icon, label, value, onChange }: { editMode: boolean, icon: any, label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="bg-zinc-900/60 border border-white/5 p-6 rounded-[2rem] space-y-3">
      <div className="flex items-center gap-2 text-zinc-500">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      {editMode ? (
        <Input 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="bg-black/50 border-white/5 h-10 rounded-xl text-sm"
          placeholder="0"
        />
      ) : (
        <p className="text-xl font-bold tracking-tight">{value || "—"}</p>
      )}
    </div>
  );
}

function MetricInput({ editMode, label, value, placeholder, onChange }: { editMode: boolean, label: string, value: string, placeholder: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5 w-full">
      <Label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1">{label}</Label>
      {editMode ? (
        <Input 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-black/40 border-white/5 h-10 rounded-xl text-sm text-white placeholder:text-zinc-800"
        />
      ) : (
        <div className="bg-black/20 px-4 py-2.5 rounded-xl border border-white/[0.02] text-sm font-medium">
          {value || <span className="text-zinc-700 italic text-xs">Not set</span>}
        </div>
      )}
    </div>
  );
}
