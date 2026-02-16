'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface TestimonialParams {
  name: string;
  role?: string;
  content: string;
  rating: number;
}

export async function submitTestimonialAction(params: TestimonialParams) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('testimonials')
    .insert([{
      name: params.name,
      role: params.role,
      content: params.content,
      rating: params.rating,
      is_public: true // Automatically public as requested
    }])
    .select()
    .single();

  if (error) {
    console.error('[submitTestimonialAction] Error:', error);
    throw new Error('Failed to submit testimonial.');
  }

  revalidatePath('/testimonials');
  return { success: true, data };
}

export async function getTestimonialsAction() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getTestimonialsAction] Error:', error);
    return [];
  }

  return data;
}
