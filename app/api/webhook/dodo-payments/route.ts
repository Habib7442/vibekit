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
  webhookKey: (webhookKey && isValidBase64(webhookKey)) ? webhookKey : "dGVzdF93ZWJob29rX3NlY3JldF9mb3JfYnVpbGRfcGhhc2VfdG8=",
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
      const creditsToAdd = parseInt(metadata.credits || "50");

      if (userId) {
        console.log(`Adding ${creditsToAdd} credits to user ${userId}`);
        
        // Update user credits in Supabase
        const { data: profile, error: fetchError } = await supabaseAdmin
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();

        if (!fetchError && profile) {
          const newCredits = (profile.credits || 0) + creditsToAdd;
          
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', userId);

          if (updateError) {
            console.error("Error updating credits:", updateError);
          } else {
            console.log("Credits updated successfully");
          }
        } else {
          console.error("User profile not found or fetch error:", fetchError);
        }
      } else {
        console.warn("No user_id found in webhook payload metadata");
      }
    }
  },
});
