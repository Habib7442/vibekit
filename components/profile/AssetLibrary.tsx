"use client";

import React from "react";
import { motion } from "framer-motion";
import { ImagePlus, Trash2, Plus, Loader2 } from "lucide-react";

interface AssetLibraryProps {
  photos: string[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (url: string) => void;
  uploading?: boolean;
}

export function AssetLibrary({ photos, onUpload, onDelete, uploading }: AssetLibraryProps) {
  return (
    <section className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/5 pb-6 gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-2xl font-bold tracking-tight text-white">Asset Library</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Brand assets for your media kits</p>
        </div>
        <div className="flex items-center gap-3">
           <input 
             type="file" 
             id="media-upload" 
             multiple 
             hidden 
             accept="image/*"
             onChange={onUpload}
           />
           <label 
             htmlFor="media-upload"
             className={`cursor-pointer px-6 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
             {uploading ? (
               <Loader2 className="w-4 h-4 animate-spin" />
             ) : (
               <ImagePlus className="w-4 h-4" />
             )}
             {uploading ? "Uploading..." : "Add Assets"}
           </label>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
         {photos?.map((url, index) => (
           <motion.div 
             key={url}
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: index * 0.05 }}
             className="group relative aspect-square rounded-[2.5rem] overflow-hidden border-2 border-white/10 p-1.5 bg-zinc-900/50 backdrop-blur-xl transition-transform hover:scale-[1.02]"
           >
              <div className="w-full h-full rounded-[2.2rem] overflow-hidden relative">
                <img 
                  src={url} 
                  alt={`Asset ${index}`} 
                  className="w-full h-full object-cover object-top transition-all duration-500 grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                   <button 
                     onClick={() => onDelete(url)}
                     className="p-3 bg-red-500/20 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all backdrop-blur-md border border-red-500/20"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
           </motion.div>
         ))}
         
         <label 
           htmlFor="media-upload"
           className={`aspect-square rounded-[2.5rem] border-2 border-dashed border-white/10 p-1.5 flex items-center justify-center cursor-pointer group transition-all hover:border-primary/30 hover:scale-[1.02] ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
         >
            <div className="w-full h-full rounded-[2.2rem] bg-zinc-900/30 flex flex-col items-center justify-center gap-2 text-zinc-600 group-hover:text-primary group-hover:bg-primary/5 transition-all">
              <div className="p-3 rounded-2xl bg-zinc-900 group-hover:bg-primary/10 transition-colors">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest">{uploading ? "Wait..." : "Upload"}</span>
            </div>
         </label>
      </div>
      
      {(!photos || photos.length === 0) && (
        <div className="py-20 text-center border border-dashed border-white/5 rounded-[2.5rem] bg-zinc-900/20">
           <p className="text-sm font-medium text-zinc-600">No assets in your library yet.</p>
           <p className="text-[10px] text-zinc-700 uppercase tracking-widest font-bold mt-2">Upload your best quality shots to showcase your brand</p>
        </div>
      )}
    </section>
  );
}
