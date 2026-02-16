import { getTestimonialsAction } from '@/lib/actions/testimonials.actions';
import { TestimonialForm, TestimonialCard } from '@/components/studio/Testimonials';
import Link from 'next/link';
import { ChevronLeft, MessageSquareHeart, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TestimonialsPage() {
  const testimonials = await getTestimonialsAction();

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#f5e1c8]/30 font-sans antialiased overflow-y-auto scrollbar-none pb-20">
      
      {/* Background Decorative Element */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square bg-amber-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12">
        {/* Navigation */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 group mb-12 text-zinc-500 hover:text-white transition-all"
        >
           <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-all">
              <ChevronLeft size={16} />
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Home</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 w-fit">
              <MessageSquareHeart size={12} className="text-indigo-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Wall of Love</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none italic">
               Community <br /> <span className="text-zinc-500 not-italic">Voice.</span>
            </h1>
            <p className="text-zinc-400 text-sm max-w-md font-medium leading-relaxed">
              Real feedback from the creators, builders, and artists shaping the future of AI-driven design. This will help us to improve the platform.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
             <div className="flex items-center gap-2 text-amber-500">
                <Zap size={16} className="fill-amber-500" />
                <span className="text-2xl font-bold tracking-tighter italic">Top Rated</span>
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Loved by 100+ Creators</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          {/* Form Side */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-12">
              <TestimonialForm />
              
              <div className="mt-8 p-6 rounded-[24px] bg-zinc-900/30 border border-white/[0.03] text-center">
                 <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                    Every review is carefully read by our team. <br /> 
                    We appreciate your time & honesty.
                 </p>
              </div>
            </div>
          </div>

          {/* Grid Side */}
          <div className="lg:col-span-7">
            {testimonials.length === 0 ? (
              <div className="p-20 rounded-[40px] border border-white/5 bg-[#0A0A0F]/50 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-zinc-900 flex items-center justify-center text-zinc-700">
                  <MessageSquareHeart size={24} />
                </div>
                <div>
                   <h3 className="text-zinc-400 font-bold mb-1">Silence is golden, but your voice is better.</h3>
                   <p className="text-zinc-600 text-xs">Be the first to leave a testimonial and help us grow!</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {testimonials.map((t: any) => (
                  <TestimonialCard key={t.id} testimonial={t} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
