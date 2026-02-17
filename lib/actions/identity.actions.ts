'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface StudioModel {
  id: string;
  name: string;
  description: string;
  type: 'person' | 'product' | 'brand';
  reference_images: string[];
}

export async function getMyIdentities() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('studio_models')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Identities] Fetch Error:', error);
    return [];
  }

  return data as StudioModel[];
}

export async function createIdentityAction(params: {
  name: string;
  description: string;
  type: 'person' | 'product' | 'brand';
  referenceImages?: string[];
}) {
  if (!params.name?.trim()) throw new Error('Name is required');
  if (params.name.length > 100) throw new Error('Name must be 100 characters or less');
  if (!params.description?.trim()) throw new Error('Description is required');
  if (params.description.length > 1000) throw new Error('Description must be 1000 characters or less');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from('studio_models')
    .insert([{
      user_id: user.id,
      name: params.name,
      description: params.description,
      type: params.type,
      reference_images: params.referenceImages || []
    }])
    .select()
    .single();

  if (error) throw error;
  
  revalidatePath('/studio/visual');
  return { success: true, model: data };
}

export async function deleteIdentityAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from('studio_models')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('Identity not found or already deleted');
  }
  revalidatePath('/studio/visual');
  return { success: true };
}
