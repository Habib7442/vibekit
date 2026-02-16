'use client';

import { useState } from 'react';
import { Star, Loader2, CheckCircle2, User, Quote, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { submitTestimonialAction } from '@/lib/actions/testimonials.actions';

export function TestimonialForm() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !content || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitTestimonialAction({ name, role, content, rating });
      setIsSuccess(true);
      setName('');
      setRole('');
      setContent('');
      setRating(5);
    } catch (err) {
      console.error(err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-8 rounded-[32px] bg-zinc-900/50 border border-emerald-500/20 text-center flex flex-col items-center gap-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <CheckCircle2 size={32} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Thank You!</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Your feedback means the world to us. It will help us to improve the platform for everyone.
          </p>
        </div>
        <button 
          onClick={() => setIsSuccess(false)}
          className="mt-4 px-6 py-2 rounded-full bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-all"
        >
          Write Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 rounded-[40px] bg-[#0A0A0F] border border-white/[0.05] shadow-2xl space-y-6 w-full max-w-xl mx-auto">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-indigo-400">
          <Quote size={14} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Platform Review</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Help us improve.</h2>
        <p className="text-zinc-500 text-xs">Share your experience with Image Studio Lab.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <User size={10} /> Full Name*
          </label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full bg-[#050505] border border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-800"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            Title/Role (Optional)
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Designer / Artist"
            className="w-full bg-[#050505] border border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-800"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-between">
          <span>Overall Experience*</span>
          <span className="text-amber-400 font-bold">{rating}/5</span>
        </label>
        <div className="flex gap-2 p-3 bg-[#050505] border border-zinc-800 rounded-2xl">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="transition-transform active:scale-90"
            >
              <Star
                size={20}
                className={cn(
                  "transition-colors",
                  star <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-800"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Your Experience*</label>
        <textarea
          required
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What do you think about the platform? This will help us to improve the platform..."
          className="w-full bg-[#050505] border border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-all resize-none placeholder:text-zinc-800"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !name || !content}
        className="w-full py-4 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all group"
      >
        {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} className="group-hover:translate-x-1 transition-transform" />}
        Submit Feedback
      </button>
    </form>
  );
}

export function TestimonialCard({ testimonial }: { testimonial: any }) {
  return (
    <div className="p-6 rounded-[32px] bg-[#0A0A0F] border border-white/[0.05] flex flex-col gap-4 relative group hover:border-white/10 transition-all hover:bg-[#0C0C14]">
      <div className="absolute top-6 right-6 text-zinc-900 group-hover:text-zinc-800 transition-colors">
        <Quote size={40} />
      </div>

      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={10} 
            className={cn(i < testimonial.rating ? "fill-amber-500 text-amber-500" : "text-zinc-800")} 
          />
        ))}
      </div>

      <p className="text-sm text-zinc-300 leading-relaxed relative z-10 italic">
        "{testimonial.content}"
      </p>

      <div className="flex items-center gap-3 mt-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 font-bold text-xs">
          {testimonial.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h4 className="text-[11px] font-black text-white uppercase tracking-widest">{testimonial.name}</h4>
          {testimonial.role && <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">{testimonial.role}</p>}
        </div>
      </div>
    </div>
  );
}
