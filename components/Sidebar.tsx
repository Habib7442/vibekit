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
  ChevronLeft,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useUser, UserButton, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar() {
  const { user } = useUser();
  const { credits, sidebarCollapsed, setSidebarCollapsed } = useStore();
  const pathname = usePathname();

  return (
    <motion.aside 
      initial={false}
      animate={{ width: sidebarCollapsed ? 80 : 256 }}
      className="hidden lg:flex h-screen bg-black border-r border-border/50 flex flex-col fixed left-0 top-0 z-40 pt-6 transition-all duration-300 ease-in-out"
    >
      {/* Collapse Toggle */}
      <button 
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-zinc-500 hover:text-white transition-colors z-50 shadow-xl"
      >
        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Header Section */}
      <div className="px-3 mb-8">
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-zinc-900/30 border border-border/50 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}>
           <div className="w-8 h-8 min-w-[32px] rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
              {user?.firstName?.charAt(0) || "V"}
           </div>
           {!sidebarCollapsed && (
             <motion.div 
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex flex-col text-left overflow-hidden"
             >
               <span className="text-sm font-semibold text-white leading-tight truncate">
                 {user?.firstName}'s Vibe
               </span>
             </motion.div>
           )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-none pr-2">
        <Link href="/builder">
          <NavItem icon={Home} label="Home" active={pathname === '/builder'} collapsed={sidebarCollapsed} />
        </Link>
        <NavItem icon={Search} label="Search" collapsed={sidebarCollapsed} />
        <Link href="/profile">
          <NavItem icon={Users} label="Profile" active={pathname === '/profile'} collapsed={sidebarCollapsed} />
        </Link>

        {!sidebarCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-8 pb-2 px-3"
          >
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Workspace</span>
          </motion.div>
        )}
        
        <NavItem icon={Clock} label="Recent" collapsed={sidebarCollapsed} />
        <NavItem icon={LayoutGrid} label="Collections" collapsed={sidebarCollapsed} />
        <NavItem icon={Star} label="Starred" collapsed={sidebarCollapsed} />
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 space-y-3">
        <div className={`p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-3 overflow-hidden ${sidebarCollapsed ? 'flex justify-center p-2 h-12' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary fill-primary/20" />
              {!sidebarCollapsed && <span className="text-sm font-bold text-white uppercase tracking-tighter">{credits} Credits</span>}
            </div>
            {!sidebarCollapsed && <Gift className="w-4 h-4 text-zinc-600" />}
          </div>
          {!sidebarCollapsed && <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest leading-none">Balance</p>}
        </div>

        {!sidebarCollapsed && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/5 relative overflow-hidden group hover:border-primary/20 transition-all font-sans"
          >
            <Sparkles className="absolute top-0 right-0 p-2 opacity-10 w-12 h-12 text-primary" />
            <div className="relative z-10 space-y-2">
              <span className="text-sm font-semibold text-white">Upgrade</span>
              <p className="text-[10px] text-zinc-500 leading-tight">Unlock AI models.</p>
            </div>
          </motion.div>
        )}

        {/* User Profile */}
        <div className={`pt-4 flex items-center justify-between px-1 ${sidebarCollapsed ? 'flex-col gap-4' : ''}`}>
           <div className="flex items-center gap-3">
             <UserButton afterSignOutUrl="/" />
             {!sidebarCollapsed && (
               <span className="text-xs font-bold text-white truncate max-w-[100px]">{user?.firstName}</span>
             )}
           </div>
           <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'flex-col' : ''}`}>
             {!sidebarCollapsed && <Bell className="w-4 h-4 text-zinc-500 hover:text-white cursor-pointer transition-colors" />}
             <SignOutButton>
               <LogOut className="w-4 h-4 text-zinc-500 hover:text-red-400 cursor-pointer transition-colors" />
             </SignOutButton>
           </div>
        </div>
      </div>
    </motion.aside>
  );
}

function NavItem({ icon: Icon, label, active = false, collapsed = false }: { icon: any, label: string, active?: boolean, collapsed?: boolean }) {
  return (
    <div className={`
      flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
      group relative
      ${active ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'}
      ${collapsed ? 'justify-center' : ''}
    `}>
      <Icon className={`w-5 h-5 min-w-[20px] ${active ? 'text-primary' : 'group-hover:text-zinc-300'}`} />
      {!collapsed && (
        <span className="text-sm font-bold tracking-tight truncate">{label}</span>
      )}
      
      {collapsed && (
        <div className="absolute left-14 bg-zinc-900 border border-white/10 px-2 py-1 rounded-md text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
          {label}
        </div>
      )}
    </div>
  );
}
