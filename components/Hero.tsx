"use client";
import React from "react";

import { 
  Plus, 
  ArrowUp,
  Bot
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { useStore } from "@/lib/store";
import { processPromptAction, startBuildingAction } from "@/app/actions/ai";

export function Hero() {
  const { prompt, setPrompt, isGenerating, setIsGenerating, setMediaKit, setGeneratedCode } = useStore();
  const [isExpanding, setIsExpanding] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const handlePlan = async () => {
    if (!prompt.trim() || isExpanding || isGenerating) return;
    
    if (!user) {
      sessionStorage.setItem("last_prompt", prompt);
      router.push("/sign-in");
      return;
    }

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

  const handleStartBuilding = async () => {
    if (!prompt.trim() || isGenerating) return;

    if (!user) {
      sessionStorage.setItem("last_prompt", prompt);
      router.push("/sign-in");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await startBuildingAction(prompt);
      if (result) {
        setGeneratedCode(result.mediaKitData.code);
        router.push(`/builder/${result.projectId}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePlan();
    }
  };

  React.useEffect(() => {
    // Focus the textarea on mount to avoid hydration mismatch from autoFocus
    textareaRef.current?.focus();
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background text-center pt-32 pb-20 px-6">
      {/* Background Grid & Glows */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(252,232,209,0.15),transparent_80%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight text-white leading-[1.05]">
          Build Your <span className="font-serif italic text-primary/90 font-medium">Perfect</span> <br />
          Media Kit
        </h1>

        <p className="max-w-xl mx-auto text-base text-zinc-400 mb-12">
          Transform your social stats into high-converting professional <br className="hidden md:block" />
          media kits with AI. No design or coding required.
        </p>

        {/* Chat Interface Block */}
        <div 
          onClick={() => textareaRef.current?.focus()}
          className="w-full max-w-2xl bg-card border border-border rounded-[2rem] p-6 mb-16 shadow-2xl relative group focus-within:border-primary/30 transition-all duration-300 cursor-text"
        >
          <div className="flex flex-col gap-6 min-h-[140px] text-left">
            <div className="flex-1">
              <textarea 
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={onKeyDown}
                suppressHydrationWarning
                placeholder="Ask VibeStudio to create a"
                className="w-full bg-transparent border-none focus:ring-0 text-white text-lg md:text-xl font-medium placeholder:text-zinc-600 outline-none resize-none h-24 scrollbar-none"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 text-zinc-500 hover:text-white transition-colors cursor-pointer">
                  <Plus className="w-5 h-5" />
                </div>
              </div>

              <div className="flex items-center gap-3 relative">
                {/* AI Status Indicator Mockup */}
                
 

                <Button 
                  onClick={handlePlan}
                  disabled={isExpanding || !prompt.trim()}
                  className="bg-primary text-primary-foreground hover:opacity-90 rounded-full px-6 py-2 font-bold h-9 shadow-lg disabled:opacity-50"
                >
                  {isExpanding ? "Expanding..." : "Plan"}
                </Button>
                
                <div 
                  onClick={handleStartBuilding}
                  className={`h-9 w-9 bg-zinc-800 text-white rounded-full flex items-center justify-center hover:bg-zinc-700 transition-all shadow-lg cursor-pointer active:scale-95 translate-y-0 hover:-translate-y-0.5 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted By Section */}
        <div className="w-full pt-20">
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-600 mb-8">
            CREATED BY OVER 1,000+ PROFESSIONAL CREATORS
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 opacity-40 grayscale hover:opacity-70 transition-opacity">
            <span className="text-lg font-bold tracking-tighter text-white font-serif italic">Lifestyle</span>
            <span className="text-xl font-extrabold tracking-tight text-white">GAMING</span>
            <span className="text-base font-bold tracking-tighter text-white uppercase">Fitness Club</span>
            <span className="text-2xl font-black text-white">Beauty.</span>
            <span className="text-base font-medium tracking-tight text-white italic">Travel Guide</span>
          </div>
        </div>
      </div>
    </section>
  );
}

