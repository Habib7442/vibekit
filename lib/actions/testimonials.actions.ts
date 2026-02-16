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
  const trimmedName = params.name?.trim();
  const trimmedContent = params.content?.trim();

  if (!trimmedName) {
    throw new Error('Name is required.');
  }

  if (!trimmedContent) {
    throw new Error('Content is required.');
  }

  if (trimmedContent.length > 1000) {
    throw new Error('Content must be 1000 characters or less.');
  }

  if (!Number.isInteger(params.rating) || params.rating < 1 || params.rating > 5) {
    throw new Error('Rating must be an integer between 1 and 5.');
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('testimonials')
    .insert([{
      name: trimmedName,
      role: params.role?.trim(),
      content: trimmedContent,
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
    return { data: [], error: 'Failed to fetch testimonials.' };
  }

  return { data: data || [], error: null };
}
