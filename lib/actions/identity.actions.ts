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

  const { error } = await supabase
    .from('studio_models')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
  revalidatePath('/studio/visual');
  return { success: true };
}
