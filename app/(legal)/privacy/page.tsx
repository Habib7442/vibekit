import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-24 selection:bg-[#f5e1c8]/30 font-sans">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest mb-12">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 italic font-serif">Privacy Policy</h1>
        <p className="text-zinc-500 text-sm italic mb-12">Last Updated: February 14, 2026</p>

        <div className="space-y-12 text-zinc-400 leading-relaxed text-sm font-medium">
          <section className="space-y-4">
            <h2 className="text-white text-lg font-bold">1. Information We Collect</h2>
            <p>At ImageStudioLab, we collect information to provide better services to all our users. This includes text prompts you provide, images you upload for processing, and basic account information when you sign in via Clerk.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-white text-lg font-bold">2. How We Use Information</h2>
            <p>We use the information we collect to operate, maintain, and provide the features and functionality of the Service, and to communicate directly with you.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>To process and generate AI imagery based on your inputs.</li>
              <li>To improve our specialized expert models.</li>
              <li>To provide customer support and security.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-white text-lg font-bold">3. Data Security</h2>
            <p>We use industry-standard security measures to protect your data. Images uploaded for processing are handled via secure API channels and are not used for public training material without your explicit consent.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-white text-lg font-bold">4. Your Rights</h2>
            <p>You have the right to access, delete, or modify the personal data we hold about you at any time through your account settings.</p>
          </section>

          <footer className="pt-12 border-t border-zinc-900">
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-loose">
              If you have any questions about this Privacy Policy, please contact us at support@imagestudiolab.com.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
