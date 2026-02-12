"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/10 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-red-600 p-1.5 rounded-lg shadow-lg shadow-red-600/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          Vibe<span className="text-red-600">Studio</span>
        </span>
      </div>
      
      <div className="hidden md:flex items-center gap-8">
        <Link href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Features</Link>
        <Link href="#showcase" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Showcase</Link>
        <Link href="#pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Pricing</Link>
      </div>

      <div className="flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="text-sm font-medium text-white hover:text-red-500 transition-colors">Login</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-full hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-lg">
              Get Started
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </nav>
  );
}
