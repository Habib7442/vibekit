"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Loader2, Palette, PenTool, Layout, Layers, Sparkles, Plus, ArrowUp, Clock, History, Check, AlertCircle } from "lucide-react";
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview, 
  useSandpack 
} from "@codesandbox/sandpack-react";

export default function DynamicBuilder() {
  const { id } = useParams();
  const router = useRouter();
  const { 
    prompt, 
    mediaKit, 
    setMediaKit, 
    isGenerating, 
    setIsGenerating, 
    generatedCode, 
    setGeneratedCode, 
    versions, 
    addVersion,
    userData
  } = useStore();
  const [buildStep, setBuildStep] = useState(0);

  const buildingSteps = [
    { title: "Analyzing Tone", icon: Sparkles },
    { title: "Curating Aesthetic", icon: Palette },
    { title: "Crafting Narrative", icon: PenTool },
    { title: "Structuring Layout", icon: Layout },
    { title: "Optimizing Code", icon: Layers },
  ];

  useEffect(() => {
    if (prompt && !generatedCode && !isGenerating) {
      const interval = setInterval(() => {
        setBuildStep(prev => (prev < buildingSteps.length - 1 ? prev + 1 : prev));
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [prompt, generatedCode, isGenerating]);

  // No more manual getPreviewHtml - Sandpack handles this

  const [chatInput, setChatInput] = useState("");
  const [isIterating, setIsIterating] = useState(false);

  // Auto-trigger initial generation if we have a prompt but no code
  useEffect(() => {
    const triggerInitialBuild = async () => {
      if (prompt && !generatedCode && !isGenerating && !isIterating) {
        setIsGenerating(true);
        try {
          const response = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentCode: "", prompt, userData }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.code) {
              setGeneratedCode(data.code);
            }
          }
        } catch (error) {
          console.error("Initial Build Failed:", error);
        } finally {
          setIsGenerating(false);
        }
      }
    };

    triggerInitialBuild();
  }, [prompt, generatedCode, userData]);

  const handleChat = async (overrideInput?: string) => {
    const instruction = overrideInput || chatInput;
    if (!instruction.trim() || !generatedCode || isIterating) return;

    setIsIterating(true);
    try {
      // Save current version to history before updating
      if (generatedCode) {
        addVersion(instruction, generatedCode);
      }
      
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentCode: generatedCode, prompt: instruction }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.code) {
          setGeneratedCode(data.code);
          if (!overrideInput) setChatInput("");
        }
      }
    } catch (error) {
      console.error("Chat Iteration Failed:", error);
    } finally {
      setIsIterating(false);
    }
  };

  if (isGenerating || (!generatedCode && prompt)) {
// ... loading UI
    // ... loading UI (remains same)
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center z-[100] text-white">
        <div className="max-w-md w-full px-8 space-y-12 text-center">
          <div className="relative inline-block">
             <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center animate-pulse">
                {React.createElement(buildingSteps[buildStep].icon, { className: "w-8 h-8 text-white" })}
             </div>
             <div className="absolute inset-0 rounded-full border-2 border-t-[#FFE0C2] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>

          <div className="space-y-4">
             <h2 className="text-2xl font-serif tracking-tight">VibeStudio is coding...</h2>
             <div className="flex justify-center gap-2">
                {buildingSteps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 w-8 rounded-full transition-all duration-500 ${i <= buildStep ? 'bg-[#FFE0C2]' : 'bg-white/10'}`} 
                  />
                ))}
             </div>
             <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">
                {buildingSteps[buildStep].title}
             </p>
          </div>
        </div>
      </div>
    );
  }

  if (!generatedCode) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
            <h1 className="text-xl font-serif mb-4">No project data found.</h1>
            <button 
                onClick={() => router.push("/builder")}
                className="text-sm font-bold uppercase tracking-widest border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all"
            >
                Return to Dashboard
            </button>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0E0E0E] overflow-hidden text-white font-sans">
      {/* Vibe History Sidebar (ForgeAI Style) */}
      <aside className="w-80 border-r border-white/5 bg-[#0A0A0A] flex flex-col z-[70] transition-all">
         <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <History className="w-4 h-4 text-zinc-500" />
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Vibe History</span>
            </div>
            <div className="text-[10px] bg-white/5 px-2 py-1 rounded text-zinc-500 font-mono">
               {versions.length + 1} Sprints
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {/* Current Active Version */}
            <div className="p-4 rounded-2xl bg-[#FFE0C2]/5 border border-[#FFE0C2]/20 relative overflow-hidden group">
               <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFE0C2]">Active Studio</span>
                  <Clock className="w-3 h-3 text-[#FFE0C2]/40" />
               </div>
               <p className="text-sm font-medium text-white line-clamp-2 leading-relaxed italic">
                  "{prompt}"
               </p>
               <div className="mt-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FFE0C2] animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFE0C2]/60">Live Now</span>
               </div>
            </div>

            {/* Past Versions */}
            {versions.map((v, i) => (
               <div 
                 key={v.id}
                 onClick={() => setGeneratedCode(v.code)}
                 className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer group active:scale-[0.98]"
               >
                  <div className="flex items-start justify-between mb-1">
                     <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400 transition-colors">v{versions.length - i} REVISION</span>
                     <span className="text-[9px] font-mono text-zinc-600 group-hover:text-zinc-500">{v.timestamp}</span>
                  </div>
                  <p className="text-xs text-zinc-400 group-hover:text-zinc-300 line-clamp-2 leading-relaxed">
                     {v.name}
                  </p>
                  <div className="mt-3 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-[9px] font-bold uppercase tracking-widest text-[#FFE0C2]">Switch to this vibe →</span>
                  </div>
               </div>
            ))}

            {versions.length === 0 && (
               <div className="py-20 text-center flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                     <Clock className="w-4 h-4 text-zinc-700" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">No past sprints yet</p>
               </div>
            )}
         </div>

         <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
            {/* Sidebar Mutations */}
            <div className="flex flex-wrap gap-1.5 mb-4 px-1">
               {[
                 { label: 'Bold', prompt: 'More bold', icon: Sparkles },
                 { label: 'Luxury', prompt: 'More luxury', icon: Palette },
                 { label: 'Minimal', prompt: 'More minimal', icon: Layout },
                 { label: 'Sexy', prompt: 'Make it sexier', icon: PenTool },
                 { label: 'News', prompt: 'More editorial', icon: Layers },
               ].map((m) => (
                 <button
                   key={m.label}
                   onClick={() => handleChat(m.prompt)}
                   disabled={isIterating}
                   className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border border-white/5 rounded-lg hover:border-[#FFE0C2]/30 hover:bg-white/[0.07] transition-all group disabled:opacity-50"
                 >
                   <m.icon className="w-3 h-3 text-zinc-500 group-hover:text-[#FFE0C2] transition-colors" />
                   <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-white">{m.label}</span>
                 </button>
               ))}
            </div>

            {/* Sidebar Chat Input */}
            <div className="relative">
              <div className={`bg-white/[0.03] border border-white/10 rounded-2xl p-3 transition-all ${isIterating ? 'opacity-50' : 'focus-within:border-[#FFE0C2]/30 focus-within:bg-white/[0.05]'}`}>
                <textarea 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleChat();
                    }
                  }}
                  placeholder={isIterating ? "AI thinking..." : "Refine your vibe..."}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm text-white placeholder:text-zinc-600 outline-none resize-none h-16 py-1 scrollbar-none"
                  disabled={isIterating}
                />
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                    {isIterating ? "Processing..." : "Studio Agent"}
                  </span>
                  <button 
                    onClick={() => handleChat()}
                    disabled={isIterating || !chatInput.trim()}
                    className="p-2 bg-[#FFE0C2] text-black rounded-xl hover:bg-white transition-all active:scale-95 disabled:opacity-30"
                  >
                    {isIterating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <ArrowUp className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button className="w-full mt-4 py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:border-white/20 hover:text-white transition-all">
               Export Bundle
            </button>
         </div>
      </aside>

      {/* Studio Workspace */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#050505]">
        {/* Workspace Header */}
        <div className="h-16 bg-[#0E0E0E]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 z-50">
           <div className="flex items-center gap-6">
              <div 
                onClick={() => router.push('/builder')}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-[#FFE0C2]/10 rounded-full border border-[#FFE0C2]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFE0C2] animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFE0C2]">Draft Live</span>
                </div>
                <span className="text-sm font-medium text-white/90 tracking-tight">Untitled Vibe</span>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <button className="text-[11px] font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-all">Export</button>
              <button className="text-[11px] font-bold uppercase tracking-[0.2em] px-6 py-2.5 rounded-full bg-[#FFE0C2] text-black hover:opacity-90 transition-all shadow-[0_0_20px_rgba(255,224,194,0.15)]">Publish</button>
           </div>
        </div>

        {/* Cinematic Canvas Area */}
        <div className="flex-1 overflow-hidden bg-[#050505] relative flex flex-col items-center justify-center">
           {/* Studio Grid Background */}
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>

           <div className={`w-full h-full transition-all duration-700 ${isIterating ? 'scale-[0.98] opacity-20 blur-xl grayscale brightness-50' : 'scale-100 opacity-100 blur-0'}`}>
              <SandpackProvider
                template="react-ts"
                theme="dark"
                files={{
                  "/App.tsx": generatedCode || "",
                  "/index.html": `
<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
    <style>
      body, html, #root { margin: 0; padding: 0; background: #000; overflow: hidden; height: 100% !important; width: 100% !important; }
      ::-webkit-scrollbar { display: none; }
      * { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
                }}
                customSetup={{
                  dependencies: {
                    "lucide-react": "latest",
                    "framer-motion": "latest",
                    "clsx": "latest",
                    "tailwind-merge": "latest",
                  },
                }}
                options={{
                  externalResources: ["https://cdn.tailwindcss.com"],
                  recompileMode: "immediate",
                  recompileDelay: 300,
                }}
              >
                <SandpackLayout style={{ height: "calc(100vh - 64px)", border: "none", borderRadius: 0, background: "transparent" }}>
                  <SandpackPreview 
                    style={{ height: "calc(100vh - 64px)", width: "100%" }} 
                    showNavigator={false}
                    showOpenInCodeSandbox={false}
                    showRefreshButton={false}
                  />
                </SandpackLayout>
              </SandpackProvider>
           </div>

           {/* Enhanced Processing Overlay */}
           {isIterating && (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <div className="relative mb-8">
                   <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-[#FFE0C2] animate-pulse" />
                   </div>
                   <div className="absolute inset-0 rounded-full border-2 border-t-[#FFE0C2] border-r-transparent border-b-transparent border-l-transparent animate-[spin_1s_linear_infinite]" />
                   <div className="absolute -inset-4 rounded-full border border-white/5 animate-[pulse_2s_ease-in-out_infinite]" />
                </div>
                
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-serif text-white tracking-tight animate-in slide-in-from-bottom-2 duration-500">Mutating Design DNA</h3>
                  <div className="flex items-center justify-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-[#FFE0C2]/40 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#FFE0C2]/60 ml-2">Bespoke Studio Layering</p>
                </div>
             </div>
           )}
        </div>

        {/* integrated status line */}
        {isIterating && (
           <div className="absolute top-16 left-0 w-full h-0.5 z-[70]">
              <div className="h-full bg-[#FFE0C2] animate-[loading_2s_ease-in-out_infinite]" style={{ width: '30%' }} />
              <style jsx>{`
                @keyframes loading {
                  0% { transform: translateX(-100%); width: 30%; }
                  50% { width: 60%; }
                  100% { transform: translateX(400%); width: 30%; }
                }
              `}</style>
           </div>
        )}

      </main>
    </div>
  );
}
