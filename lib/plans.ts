export type PlanType = 'free' | 'solo' | 'pro' | 'lifetime';

export interface PlanDetails {
  id: PlanType;
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
    credits: 10,
    resolution: '1K',
    identities: 1,
    features: [
      "10 Credits / month",
      "1K Standard Resolution",
      "1 Identity Slot",
      "Basic Photoshoots",
      "Watermarked Exports"
    ]
  },
  solo: {
    id: 'solo',
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
    id: 'pro',
    name: "Pro",
    price: 89,
    credits: 1000,
    resolution: '4K',
    identities: 999, // Unlimited
    features: [
      "1,000 Credits / month",
      "4K Ultra-HD Resolution",
      "Unlimited Identity Slots",
      "Campaign Batch Mode",
      "Grounded Generation (Live Search)",
      "Dedicated Support"
    ]
  },
  lifetime: {
    id: 'lifetime',
    name: "Lifetime Founder",
    price: 499,
    credits: 150, // per month for life
    resolution: '4K',
    identities: 999,
    features: [
      "One-time payment",
      "150 Credits / month (Life reset)",
      "4K Resolution Forever",
      "Exclusive Founder Badge",
      "All future features included"
    ]
  }
};
