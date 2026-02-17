import { Webhooks } from "@dodopayments/nextjs";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

// Initialize Supabase admin client (Service Role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
const isValidBase64 = (str: string) => {
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
};

export const POST = Webhooks({
  webhookKey: (() => {
    if (!webhookKey) {
      throw new Error("DODO_PAYMENTS_WEBHOOK_KEY is not set");
    }
    if (!isValidBase64(webhookKey)) {
      throw new Error("DODO_PAYMENTS_WEBHOOK_KEY is not valid base64");
    }
    return webhookKey;
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
