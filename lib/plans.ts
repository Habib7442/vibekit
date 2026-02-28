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

const SOLO_ID = process.env.NEXT_PUBLIC_DODO_SOLO_ID;
const PRO_ID = process.env.NEXT_PUBLIC_DODO_PRO_ID;

// Validate essential IDs for production, fallback to 'dev' for local builds if missing
if (process.env.NODE_ENV === 'production' && (!SOLO_ID || !PRO_ID)) {
  throw new Error('[Configuration Error] Dodo Payments Plan IDs are missing in production environment. Set NEXT_PUBLIC_DODO_SOLO_ID and NEXT_PUBLIC_DODO_PRO_ID.');
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
    id: SOLO_ID || 'solo_dev_fallback',
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
    id: PRO_ID || 'pro_dev_fallback',
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
