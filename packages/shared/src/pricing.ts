// Pricing tiers and token allocations
export const PRICING_TIERS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: null,
    tokensPerMonth: 100,
    dailyClaimTokens: 10,
    maxPrivateProjects: 1,
    maxImports: 5,
    allowedModels: ['GROK_4_1_FAST'],
    priorityQueue: false,
    features: [
      '100 tokens/month',
      '10 daily claim tokens',
      '1 private project',
      'Basic models only',
      'Community support',
    ],
  },
  STARTER: {
    name: 'Starter',
    price: 999, // cents
    priceId: 'price_starter_monthly',
    tokensPerMonth: 1000,
    dailyClaimTokens: 25,
    maxPrivateProjects: 5,
    maxImports: 25,
    allowedModels: ['GROK_4_1_FAST', 'GEMINI_3_PRO', 'CLAUDE_SONNET_4_5'],
    priorityQueue: false,
    features: [
      '1,000 tokens/month',
      '25 daily claim tokens',
      '5 private projects',
      'Standard models',
      'Email support',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 2999, // cents
    priceId: 'price_pro_monthly',
    tokensPerMonth: 5000,
    dailyClaimTokens: 50,
    maxPrivateProjects: 25,
    maxImports: 100,
    allowedModels: ['GROK_4_1_FAST', 'GEMINI_3_PRO', 'CLAUDE_SONNET_4_5', 'GPT_5'],
    priorityQueue: true,
    features: [
      '5,000 tokens/month',
      '50 daily claim tokens',
      '25 private projects',
      'All standard models',
      'Priority queue',
      'Priority support',
    ],
  },
  ELITE: {
    name: 'Elite',
    price: 9999, // cents
    priceId: 'price_elite_monthly',
    tokensPerMonth: 25000,
    dailyClaimTokens: 100,
    maxPrivateProjects: -1, // unlimited
    maxImports: -1, // unlimited
    allowedModels: ['GROK_4_1_FAST', 'GEMINI_3_PRO', 'CLAUDE_SONNET_4_5', 'GPT_5', 'CLAUDE_OPUS_4_5'],
    priorityQueue: true,
    features: [
      '25,000 tokens/month',
      '100 daily claim tokens',
      'Unlimited private projects',
      'All models including Opus',
      'Priority queue',
      'Dedicated support',
      'Custom integrations',
    ],
  },
} as const;

// Token packs for one-time purchase
export const TOKEN_PACKS = {
  SMALL: {
    name: 'Small Pack',
    tokens: 500,
    price: 499, // cents
    priceId: 'price_tokens_500',
  },
  MEDIUM: {
    name: 'Medium Pack',
    tokens: 2000,
    price: 1499, // cents
    priceId: 'price_tokens_2000',
    bonus: 200,
  },
  LARGE: {
    name: 'Large Pack',
    tokens: 5000,
    price: 2999, // cents
    priceId: 'price_tokens_5000',
    bonus: 750,
  },
  MEGA: {
    name: 'Mega Pack',
    tokens: 15000,
    price: 7999, // cents
    priceId: 'price_tokens_15000',
    bonus: 3000,
  },
} as const;

// Token costs for various operations
export const TOKEN_COSTS = {
  GENERATION: {
    CLAUDE_SONNET_4_5: { base: 10, perKToken: 5 },
    CLAUDE_OPUS_4_5: { base: 25, perKToken: 15 },
    GPT_5: { base: 15, perKToken: 8 },
    GEMINI_3_PRO: { base: 8, perKToken: 4 },
    GROK_4_1_FAST: { base: 5, perKToken: 2 },
  },
  CHECKPOINT: 2,
  BUILD: 5,
  DEPLOY: 10,
  REFERRAL_BONUS: 50,
  WELCOME_BONUS: 100,
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;
export type TokenPack = keyof typeof TOKEN_PACKS;
