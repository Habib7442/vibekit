"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black py-32 px-6">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-600/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full animate-pulse delay-1000" />
      
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 backdrop-blur-md mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-red-500" />
          <span className="text-xs font-bold tracking-widest uppercase text-zinc-400">Lovable for Media Kits</span>
        </div>

        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 tracking-tighter text-white leading-[0.9]">
          STOP USING <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">TEMPLATES.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-400 mb-12 leading-relaxed">
          Describe your dream media kit in plain English. Our AI generates the actual code. 
          Vibe-code it to perfection. Stand out from the crowd.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="group relative inline-flex items-center gap-2 bg-red-600 text-white font-bold py-5 px-10 rounded-full text-lg hover:bg-red-500 transition-all shadow-[0_0_40px_rgba(220,38,38,0.3)] hover:scale-105 active:scale-95 overflow-hidden">
                <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500 skew-x-12" />
                Start Vibe-Coding
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link 
              href="/dashboard" 
              className="group relative inline-flex items-center gap-2 bg-red-600 text-white font-bold py-5 px-10 rounded-full text-lg hover:bg-red-500 transition-all shadow-[0_0_40px_rgba(220,38,38,0.3)] hover:scale-105 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500 skew-x-12" />
              Go to Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </SignedIn>
          
          <Link 
            href="/showcase" 
            className="text-white font-bold hover:text-red-500 transition-colors flex items-center gap-2 group italic underline decoration-red-600/50 underline-offset-8"
          >
            View Showcase
          </Link>
        </div>

        {/* Floating Stats or social proof can go here */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-zinc-800 pt-12 opacity-50">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-1 tracking-tighter">∞</h3>
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Possibilities</p>
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-1 tracking-tighter">0</h3>
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Templates</p>
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-1 tracking-tighter">100%</h3>
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Custom Code</p>
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-1 tracking-tighter">10s</h3>
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Generation Time</p>
          </div>
        </div>
      </div>
    </section>
  );
}
