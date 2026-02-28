import { Webhooks } from "@dodopayments/nextjs";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const POST = Webhooks({
  webhookKey: (() => {
    const key = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    const isProd = process.env.NODE_ENV === 'production';
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    
    if (!key) {
      if (isProd && !isBuildPhase) {
        throw new Error('DODO_PAYMENTS_WEBHOOK_KEY is required in production');
      }
      // During build phase or development, use a placeholder
      return "placeholder_key_for_build";
    }
    
    return key;
  })(),
  onPayload: async (payload: any) => {
    const eventType = payload.type;
    const data = payload.data;

    // Handle payment succeeded, order completed, or subscription becoming active
    const handledEvents = ['payment.succeeded', 'order.completed', 'subscription.active', 'subscription.renewed'];
    
    if (handledEvents.includes(eventType)) {
      const metadata = data.metadata || {};
      const userId = metadata.user_id || data.customer?.external_id;
      
      const planToUpdate = metadata.plan || data.plan_name || null;
      
      // Determine credits to add
      let creditsToAdd = parseInt(metadata.credits || "0", 10);
      
      // Fallback: Default credits based on plan if metadata is missing
      if (creditsToAdd === 0 && planToUpdate) {
        const planLower = planToUpdate.toLowerCase();
        if (planLower.includes('pro')) creditsToAdd = 1000;
        else if (planLower.includes('solo')) creditsToAdd = 200; 
      }
      
      // Final fallback to 50
      if (creditsToAdd === 0) creditsToAdd = 50;

      if (userId) {
        const paymentId = data.payment_id || data.id || data.subscription_id;
        if (!paymentId) {
          throw new Error("Missing payment identifier for idempotent credit update");
        }
        
        const { error: rpcError } = await supabaseAdmin
          .rpc('increment_credits_idempotent', { 
            p_user_id: userId, 
            p_amount: creditsToAdd,
            p_payment_id: paymentId,
            p_plan: planToUpdate
          });

        if (rpcError) {
          throw new Error(`Failed to update credits: ${rpcError.message}`);
        }
      } else {
        throw new Error(`No user_id found in webhook payload for event ${eventType}, payment_id: ${data.payment_id || data.id}`);
      }
    }
  },
});
