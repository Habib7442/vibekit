'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { PLANS, PlanType } from '@/lib/plans';

export async function deductCredit(amount: number = 1) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Authentication required');

  const admin = createAdminClient();

  // Fetch current profile
  let { data: profile, error: fetchError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 1. Initial Profile Creation & Verification
  if (!profile || fetchError) {
    const { data: newProfile, error: createError } = await admin
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        credits: PLANS.free.credits,
        plan: 'free',
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        referral_id: Math.random().toString(36).substring(2, 10),
        last_reset_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (createError || !newProfile) {
      throw new Error('Creative Studio wallet not found.');
    }
    profile = newProfile;
  }

  // 2. Automated Credit Reset (Every 30 Days for Paid Plans)
  const lastReset = new Date(profile.last_reset_at || profile.created_at);
  const now = new Date();
  const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceReset >= 30) {
    const planKey = (profile.plan || 'free') as PlanType;
    const planDetails = PLANS[planKey];
    
    // Reset credits to plan limit
    const { data: resetProfile } = await admin
      .from('profiles')
      .update({ 
        credits: planDetails.credits,
        last_reset_at: now.toISOString()
      })
      .eq('id', user.id)
      .select('*')
      .single();
    
    if (resetProfile) profile = resetProfile;
  }

  // 3. Balance Check
  if (profile.credits < amount) {
    throw new Error(`Insufficient credits (${profile.credits} remaining). Upgrade to ${profile.plan === 'free' ? 'Solo' : 'Pro'} to continue generating.`);
  }

  // 4. Final Deduction
  const { error: updateError } = await admin
    .from('profiles')
    .update({ credits: profile.credits - amount })
    .eq('id', user.id);

  if (updateError) {
    throw new Error('Transaction failed.');
  }

  return { 
    success: true, 
    remaining: profile.credits - amount,
    plan: profile.plan || 'free'
  };
}
