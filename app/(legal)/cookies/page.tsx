import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-24 selection:bg-[#f5e1c8]/30 font-sans">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest mb-12">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 italic font-serif">Cookie Policy</h1>
        <p className="text-zinc-500 text-sm italic mb-12">Last Updated: February 14, 2026</p>

        <div className="space-y-12 text-zinc-400 leading-relaxed text-sm font-medium">
          <section className="space-y-4">
            <h2 className="text-white text-lg font-bold">1. What are Cookies?</h2>
            <p>Cookies are small text files stored on your device to help websites function better and provide specialized features. At ImageStudioLab, we use them to keep you signed in and remember your preferences.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-white text-lg font-bold">2. Essential Cookies</h2>
            <p>These are necessary for the platform to work. They handle authentication (via Clerk) and security features so you can stay logged in during your creative sessions.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-white text-lg font-bold">3. Preferences & Analytics</h2>
            <p>We may use cookies to remember things like your preferred expert mode or aspect ratio settings to improve your workflow during your next visit.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-white text-lg font-bold">4. How to Manage Cookies</h2>
            <p>You can control or delete cookies through your browser settings. However, disabling essential cookies may prevent you from signing in or using the studio features.</p>
          </section>

          <footer className="pt-12 border-t border-zinc-900">
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-loose">
              By using our site, you consent to our use of cookies according to this policy.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
