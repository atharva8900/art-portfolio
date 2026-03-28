import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the base URL of the application.
 * Priority: NEXT_PUBLIC_BASE_URL → VERCEL_URL (auto-injected) → localhost
 *
 * To switch domains, just update NEXT_PUBLIC_BASE_URL in your Vercel
 * Dashboard environment variables. No code changes needed.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}
