'use server';



import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';

export async function deductCredit(amount: number = 1) {
  // 1. Verify user identity using standard client (Cookie-based auth)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Authentication required');

  // 2. Use Admin client for DB operations to ensure reliability and bypass RLS
  const admin = createAdminClient();

  // Fetch current credits with self-healing
  let { data: profile, error: fetchError } = await admin
    .from('profiles')
    .select('credits, id')
    .eq('id', user.id)
    .single();

  // Self-healing: Create profile if missing
  if (!profile || fetchError) {
    const { data: newProfile, error: createError } = await admin
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        credits: 20, // Initial free credits
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        referral_id: Math.random().toString(36).substring(2, 10), // Basic fallback referral
      })
      .select('credits, id')
      .single();

    if (createError || !newProfile) {
      console.error('CRITICAL: Could not verify or create profile:', createError || 'No profile returned');
      throw new Error('Creative Studio wallet not found. Please contact support.');
    }
    profile = newProfile;
  }

  if (profile.credits < amount) {
    throw new Error(`Insufficient credits (${profile.credits} remaining). Upgrade to Pro to continue generating.`);
  }

  // Deduct credits
  const { error: updateError } = await admin
    .from('profiles')
    .update({ credits: profile.credits - amount })
    .eq('id', user.id);

  if (updateError) {
    console.error('Credit update failed:', updateError);
    throw new Error('Transaction failed. Your balance was not touched.');
  }

  return { success: true, remaining: profile.credits - amount };
}
