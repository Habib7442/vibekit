"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <div className="fixed top-6 w-full z-50 px-6 flex justify-center">
      <nav className="max-w-4xl w-full bg-background/40 backdrop-blur-xl border border-border px-6 py-3 rounded-2xl flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tighter text-white">
            Vibe<span className="text-primary">Studio</span>
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          <Link href="#products" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Products</Link>
          <Link href="#blocks" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Blocks</Link>
          <Link href="#pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Pricing</Link>
          <Link href="#docs" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Docs</Link>
        </div>

        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer">Sign in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="bg-primary text-primary-foreground text-sm font-bold px-5 py-2 rounded-xl hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg">
                Get started
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/builder" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>
    </div>
  );
}
