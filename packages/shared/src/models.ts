// AI Model configurations
export const AI_MODELS = {
  CLAUDE_SONNET_4_5: {
    id: 'claude-sonnet-4-5-20250929',
    provider: 'ANTHROPIC',
    name: 'Claude Sonnet 4.5',
    description: 'Fast and capable, great for most tasks',
    maxOutputTokens: 8192,
    contextWindow: 200000,
  },
  CLAUDE_OPUS_4_5: {
    id: 'claude-opus-4-5-20251101',
    provider: 'ANTHROPIC',
    name: 'Claude Opus 4.5',
    description: 'Most capable model for complex tasks',
    maxOutputTokens: 8192,
    contextWindow: 200000,
  },
  GPT_5: {
    id: 'gpt-5',
    provider: 'OPENAI',
    name: 'GPT-5',
    description: 'OpenAI\'s flagship model',
    maxOutputTokens: 16384,
    contextWindow: 128000,
  },
  GEMINI_3_PRO: {
    id: 'gemini-3-pro-preview',
    provider: 'GOOGLE',
    name: 'Gemini 3 Pro',
    description: 'Google\'s advanced multimodal model',
    maxOutputTokens: 8192,
    contextWindow: 1000000,
  },
  GROK_4_1_FAST: {
    id: 'grok-4.1-fast-non-reasoning',
    provider: 'XAI',
    name: 'Grok 4.1 Fast',
    description: 'Fast and cost-effective',
    maxOutputTokens: 8192,
    contextWindow: 131072,
  },
} as const;

// Provider configurations
export const AI_PROVIDERS = {
  ANTHROPIC: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
  },
  OPENAI: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
  },
  GOOGLE: {
    name: 'Google AI',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  XAI: {
    name: 'xAI',
    baseUrl: 'https://api.x.ai/v1',
  },
} as const;

export type AIModelKey = keyof typeof AI_MODELS;
export type AIProviderKey = keyof typeof AI_PROVIDERS;
