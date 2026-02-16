import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-24 selection:bg-[#f5e1c8]/30 font-sans">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest mb-12">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 italic font-serif">Terms of Service</h1>
        <p className="text-zinc-500 text-sm italic mb-12">Last Updated: February 14, 2026</p>

        <div className="space-y-12 text-zinc-400 leading-relaxed text-sm font-medium">
          <section className="space-y-4">
            <h2 className="text-white text-lg font-bold">1. Acceptance of Terms</h2>
            <p>By accessing and using ImageStudioLab, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-white text-lg font-bold">2. Use License</h2>
            <p>You are granted a limited, personal, non-transferable license to use the ImageStudioLab platform to generate visual assets. You own the rights to the AI-generated output for commercial use, provided you do not violate the usage policies of our underlying AI providers.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-white text-lg font-bold">3. Prohibited Content</h2>
            <p>You agree not to use the service to generate content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-white text-lg font-bold">4. Disclaimer</h2>
            <p>ImageStudioLab is provided "as is". We make no warranties regarding the accuracy or consistency of the AI-generated results, as the output is inherently probabilistic.</p>
          </section>

          <footer className="pt-12 border-t border-zinc-900">
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-loose">
              Violation of these terms may result in account termination.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
