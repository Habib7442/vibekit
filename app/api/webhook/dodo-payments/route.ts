import { Webhooks } from "@dodopayments/nextjs";

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,
  onPayload: async (payload) => {
    console.log("Dodo Payments Webhook received:", payload);
    // Add your logic here to process the payload (e.g., updating user credits)
    // payload.type can be 'subscription.created', 'order.completed', etc.
  },
});
