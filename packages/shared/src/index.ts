export * from './pricing';
export * from './models';
export * from './templates';

// Common types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatar: string | null;
  role: string;
  subscriptionTier: string;
  tokenBalance: number;
  referralCode: string;
  createdAt: Date;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  platform: string;
  language: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerationRequest {
  projectId: string;
  prompt: string;
  model: string;
  context?: {
    files?: string[];
    docs?: string[];
    settings?: Record<string, unknown>;
  };
}

export interface CheckpointSummary {
  id: string;
  summary: string;
  createdAt: Date;
}

export interface CommunityPostSummary {
  id: string;
  name: string;
  description: string;
  tags: string[];
  platform: string;
  downloads: number;
  likesCount: number;
  isFeatured: boolean;
  createdAt: Date;
  author: {
    displayName: string;
    avatar: string | null;
  };
}

// Validation helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

export const sanitizePrompt = (prompt: string): string => {
  // Basic prompt injection mitigation
  const sanitized = prompt
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks that might contain injections
    .replace(/\$\{.*?\}/g, '') // Remove template literals
    .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .trim();
  
  return sanitized.substring(0, 5000); // Limit length
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
