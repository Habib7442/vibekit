import { Github, Instagram, Twitter, Sparkles } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-black border-t border-zinc-900 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl font-bold tracking-tighter text-white">
                Vibe<span className="text-primary">Studio</span>
              </span>
            </div>
            <p className="text-zinc-500 max-w-sm mb-8 leading-relaxed">
              The world's first AI-powered media kit platform for creators. 
              Built for the next generation of designers who don't want to code.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="p-3 bg-zinc-900 rounded-lg text-zinc-400 hover:text-primary hover:bg-zinc-800 transition-all">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="p-3 bg-zinc-900 rounded-lg text-zinc-400 hover:text-primary hover:bg-zinc-800 transition-all">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="p-3 bg-zinc-900 rounded-lg text-zinc-400 hover:text-primary hover:bg-zinc-800 transition-all">
                <Github className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Product</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">Features</Link></li>
              <li><Link href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">Showcase</Link></li>
              <li><Link href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">Pricing</Link></li>
              <li><Link href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">API</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Company</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">About</Link></li>
              <li><Link href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">Blog</Link></li>
              <li><Link href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">Careers</Link></li>
              <li><Link href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-zinc-900 gap-4">
          <p className="text-zinc-600 text-xs font-medium">
            © 2026 ImageStudioLab. All rights reserved.
          </p>
          <div className="flex gap-8 text-[10px] uppercase tracking-widest font-bold text-zinc-600">
            <Link href="#" className="hover:text-zinc-400">Privacy Policy</Link>
            <Link href="#" className="hover:text-zinc-400">Terms of Service</Link>
            <Link href="#" className="hover:text-zinc-400">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
