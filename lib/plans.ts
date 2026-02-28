export type PlanType = 'free' | 'solo' | 'pro';

export interface PlanDetails {
  id: string;
  name: string;
  price: number;
  credits: number;
  resolution: '1K' | '2K' | '4K';
  identities: number;
  features: string[];
  description?: string;
}

export const PLANS: Record<PlanType, PlanDetails> = {
  free: {
    id: 'free',
    name: "Starter",
    price: 0,
    credits: 50,
    resolution: '1K',
    identities: 1,
    features: [
      "50 Credits / month",
      "1K Standard Resolution",
      "1 Identity Slot",
      "Basic Photoshoots",
      "Watermarked Exports"
    ]
  },
  solo: {
    id: process.env.NEXT_PUBLIC_DODO_SOLO_ID!,
    name: "Solo",
    price: 29,
    credits: 200,
    resolution: '2K',
    identities: 5,
    features: [
      "200 Credits / month",
      "2K High Resolution",
      "5 Identity Slots",
      "Everything in Starter",
      "Watermark-free Exports",
      "Priority Generation"
    ]
  },
  pro: {
    id: process.env.NEXT_PUBLIC_DODO_PRO_ID!,
    name: "Pro",
    price: 89,
    credits: 1000,
    resolution: '2K',
    identities: 999, // Unlimited
    features: [
      "1,000 Credits / month",
      "2K High-Resolution Output",
      "Unlimited Identity Slots",
      "Campaign Batch Mode",
      "Grounded Generation (Live Search)",
      "Dedicated Support"
    ]
  }
};
