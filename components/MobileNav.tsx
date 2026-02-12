"use client";

import React from "react";
import { 
  Home, 
  Search, 
  Clock, 
  LayoutGrid, 
  Star, 
  Users, 
  Gift, 
  Zap, 
  Bell,
  LogOut,
  Menu,
  Sparkles
} from "lucide-react";
import { useUser, UserButton, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  const { user } = useUser();
  const { credits } = useStore();
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "Home", href: "/builder" },
    { icon: Search, label: "Search", href: "#" },
    { icon: Users, label: "Profile", href: "/profile" },
  ];

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 p-4 flex items-center justify-between bg-black/80 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-black" />
        </div>
        <span className="font-serif font-bold text-lg tracking-tight">VibeStudio</span>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <button className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <Menu className="w-6 h-6 text-zinc-400" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] bg-black border-white/10 p-6 flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Access your profile, projects, and platform features.</SheetDescription>
          </SheetHeader>
          <div className="flex items-center gap-3 mb-10 mt-6">
            <div className="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center font-bold shadow-xl">
               {user?.firstName?.charAt(0) || "V"}
            </div>
            <div className="flex flex-col">
               <span className="text-sm font-bold text-white leading-tight">{user?.firstName}'s Space</span>
               <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{credits} Credits</span>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href}>
                <div className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${pathname === item.href ? 'bg-primary/20 text-primary' : 'text-zinc-500 hover:bg-white/5'}`}>
                   <item.icon className="w-5 h-5" />
                   <span className="font-bold text-sm tracking-tight">{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
             <div className="p-5 rounded-3xl bg-zinc-900/50 border border-white/5 space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Global Reach</span>
                  <Zap className="w-4 h-4 text-primary" />
               </div>
               <p className="text-[11px] text-zinc-600 font-medium leading-relaxed">
                 Upgrade to Pro to unlock advanced AI kit templates and verified stats tags.
               </p>
               <button className="w-full bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all">
                  Learn More
               </button>
             </div>

             <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <UserButton afterSignOutUrl="/" />
                  <span className="text-xs font-bold text-white">{user?.firstName}</span>
                </div>
                <SignOutButton>
                   <LogOut className="w-5 h-5 text-zinc-600 hover:text-red-400 cursor-pointer transition-colors" />
                </SignOutButton>
             </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
