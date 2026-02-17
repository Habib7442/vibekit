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
    
    // During build or in development, we can use a dummy key if the real one is missing
    if (!key) {
      if (isProd) {
        // This might still be a build phase, but we'll return a dummy to allow build to succeed.
        // In a real production runtime, the library will fail to verify signatures if this is dummy.
        return "dummy_build_key_unauthorized";
      }
      return "dev_dummy_key";
    }
    
    return key;
  })(),
  onPayload: async (payload: any) => {
    console.log("Dodo Payments Webhook received:", payload);

    const eventType = payload.type;
    const data = payload.data;

    // Handle payment succeeded or order completed
    if (eventType === 'payment.succeeded' || eventType === 'order.completed') {
      const metadata = data.metadata || {};
      const userId = metadata.user_id || data.customer?.external_id;
      
      // Determine credits to add (this might depend on product_id)
      // For now, let's assume a default or check metadata
      const creditsToAdd = parseInt(metadata.credits || "50", 10);

      if (userId) {
        const paymentId = data.payment_id || data.id;
        if (!paymentId) {
          console.error("No payment_id or id found in webhook data, cannot ensure idempotency");
          throw new Error("Missing payment identifier for idempotent credit update");
        }
        console.log(`Adding ${creditsToAdd} credits to user ${userId} (Payment ID: ${paymentId})`);
        
        const { error: rpcError } = await supabaseAdmin
          .rpc('increment_credits_idempotent', { 
            p_user_id: userId, 
            p_amount: creditsToAdd,
            p_payment_id: paymentId 
          });

        if (rpcError) {
          console.error("Error updating credits:", rpcError);
          throw new Error(`Failed to update credits: ${rpcError.message}`);
        }
        console.log("Credits updated successfully");
      } else {
        console.warn("No user_id found in webhook payload metadata");
      }
    }
  },
});
