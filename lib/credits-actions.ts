'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { PLANS, PlanType } from '@/lib/plans';

export async function deductCredit(amount: number = 1) {
  if (amount <= 0 || !Number.isInteger(amount)) {
    throw new Error('Invalid credit amount');
  }
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
    const planKey = profile.plan || 'free';
    const planDetails = PLANS[planKey as PlanType] ?? PLANS.free;
    
    // Atomic reset: only update if last_reset_at hasn't changed to prevent race conditions
    const { data: resetProfile, error: resetError } = await admin
      .from('profiles')
      .update({ 
        credits: planDetails.credits,
        last_reset_at: now.toISOString()
      })
      .eq('id', user.id)
      .eq('last_reset_at', profile.last_reset_at) // Concurrency check
      .select('*')
      .single();
    
    if (resetError && resetError.code !== 'PGRST116') { // PGRST116 is "no rows found", meaning another request already reset it
      console.error('[Credit Reset] Failed to reset credits:', resetError.message);
      throw new Error('Wallet maintenance failed. Please try again in 1 minute.');
    }

    if (resetProfile) {
      profile = resetProfile;
    } else {
      // If no profile returned, it means the .eq('last_reset_at') check failed
      // Fetch the updated profile from the other successfully completed reset request
      const { data: updatedProfile } = await admin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (updatedProfile) profile = updatedProfile;
    }
  }

  // 3. Balance Check
  if (profile.credits < amount) {
    const upgradeHint = profile.plan === 'free' 
      ? 'Upgrade to Solo or Pro to continue generating.'
      : profile.plan === 'solo'
        ? 'Upgrade to Pro for more credits.'
        : 'Please wait for your credits to reset or contact support.';
    throw new Error(`Insufficient credits (${profile.credits} remaining). ${upgradeHint}`);
  }

  // 4. Final Deduction (atomic via RPC)
  const { data: updatedCredits, error: updateError } = await admin
    .rpc('deduct_credits', { user_id: user.id, deduction: amount });

  if (updateError) {
    console.error('[Credit Deduction] RPC Error:', updateError.message);
    if (updateError.message.includes('Insufficient credits')) {
      throw new Error('Transaction failed: Insufficient credits detected in wallet.');
    }
    throw new Error('Transaction failed. Please try again.');
  }

  return { 
    success: true, 
    remaining: updatedCredits,
    plan: profile.plan || 'free'
  };
}

export async function checkCredits(amount: number = 1) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('[checkCredits] No user session found');
    throw new Error('Authentication required');
  }

  const admin = createAdminClient();
  
  // Try to find profile
  let { data: profile, error } = await admin
    .from('profiles')
    .select('credits, plan')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    // If absolutely zero profile found by ID, try email fallback for account linking consistency
    const { data: fallback } = await admin
      .from('profiles')
      .select('credits, plan')
      .eq('email', user.email)
      .maybeSingle();
      
    if (fallback) {
      return {
        credits: fallback.credits ?? 0,
        canProceed: (fallback.credits ?? 0) >= amount
      };
    }

    // Default for brand new users
    return {
      credits: PLANS.free.credits,
      canProceed: PLANS.free.credits >= amount
    };
  }

  return {
    credits: profile.credits ?? 0,
    canProceed: (profile.credits ?? 0) >= amount
  };
}

