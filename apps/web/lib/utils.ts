import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a platform name for display (e.g., "MINECRAFT_PAPER" -> "Minecraft Paper")
 */
export function formatPlatformName(platform: string): string {
  return platform
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Placeholder image URL for image errors
 */
export const PLACEHOLDER_IMAGE_URL = 'https://via.placeholder.com/400x300?text=Image+Error';
