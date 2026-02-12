import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { Zap, Layout, Monitor, Code as CodeIcon, Sparkles, Wand2 } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
      <Navbar />
      <Hero />
      
      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-red-600 to-transparent" />
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-red-500">Core Capabilities</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">
              PLATFORM, <br />
              <span className="text-zinc-600 italic">NOT JUST A PRODUCT.</span>
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-lg leading-relaxed">
              We've combined Gemini's advanced vision and image generation APIs to build the ultimate creation engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-1px bg-zinc-900/50 border border-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl">
            <FeatureCard 
              icon={<Layout className="w-6 h-6 text-red-600" />}
              title="Vibe-Coding"
              description="Describe your aesthetic in natural language. AI builds the React component code instantly. No templates, no limits."
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-red-600" />}
              title="Metric Extraction"
              description="Upload an Instagram screenshot and our Vision API extracts your followers, engagement, and reach automatically."
            />
            <FeatureCard 
              icon={<Wand2 className="w-6 h-6 text-red-600" />}
              title="AI Visuals"
              description="Generate branded headers and portfolio assets with Gemini's high-fidelity image generation model."
            />
            <FeatureCard 
              icon={<CodeIcon className="w-6 h-6 text-red-600" />}
              title="Full Source Export"
              description="Download your media kit as a clean React/Tailwind project or static HTML. You own the code 100%."
            />
            <FeatureCard 
              icon={<Monitor className="w-6 h-6 text-red-600" />}
              title="One-Click Deploy"
              description="Get a professional custom subdomain like yourname.vibestudio.com with built-in analytics."
            />
            <FeatureCard 
              icon={<Sparkles className="w-6 h-6 text-red-600" />}
              title="Bio Polishing"
              description="Transform your casual description into 3 distinct professional tones: Corporate, Casual, and Luxury."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <h2 className="text-3xl md:text-6xl font-black mb-8 tracking-tighter leading-none">
              READY TO BUILD <br />
              <span className="text-zinc-700 italic">YOUR FUTURE?</span>
            </h2>
            <p className="text-zinc-400 mb-12 text-lg max-w-md mx-auto">
              Join 1,000+ creators who have already ditch templates for unique, AI-generated identities.
            </p>
            <button className="bg-white text-black font-black py-5 px-12 rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10">
              Get Early Access
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-black p-12 hover:bg-zinc-950 transition-colors group">
      <div className="mb-8 p-4 bg-zinc-900/50 rounded-2xl w-fit group-hover:scale-110 group-hover:bg-red-600/10 transition-all duration-500">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4 tracking-tight">{title}</h3>
      <p className="text-zinc-500 leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}
