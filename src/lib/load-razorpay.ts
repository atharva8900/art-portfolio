/**
 * lib/load-razorpay.ts
 *
 * Injects Razorpay's checkout.js exactly once, on demand, resolving
 * a typed Promise when the SDK is ready to use.
 *
 * ── Why not next/script or <RazorpayScript /> in layout.tsx? ─────────────
 *
 * checkout.js (~350 KB) immediately starts prefetching its modal chunk
 * split points (checkout-static-next.razorpay.com/build/chunks/...) the
 * moment it's parsed. Those chunks are large, non-critical at page load,
 * and each fetch emits a <link rel="preload"> hint that the browser flags
 * as "unused" if the modal isn't opened within ~5 seconds.
 *
 * Loading it JIT (when the user initiates checkout) means:
 *   1. Preloads are consumed immediately — the modal opens right after
 *      the script loads, within the browser's warning window.
 *   2. Users who never pay never download the SDK.
 *   3. Page TTI is completely unaffected.
 *
 * ── Singleton pattern ─────────────────────────────────────────────────────
 *
 * The module-level _promise cache means the script is only appended to
 * the DOM once, even if loadRazorpay() is called concurrently. All
 * callers share the same Promise. On failure the cache is cleared so
 * the next call can retry (transient network error recovery).
 */

export interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency?: string;
  name?: string;
  description?: string;
  order_id?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler?: (response: RazorpayPaymentResponse) => void;
  modal?: { ondismiss?: () => void; confirm_close?: boolean };
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayInstance {
  open(): void;
  close(): void;
  on(event: string, callback: (...args: unknown[]) => void): void;
}

export interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

declare global {
  interface Window { Razorpay?: RazorpayConstructor; }
}

const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const SCRIPT_ID    = "razorpay-checkout-js";

let _promise: Promise<RazorpayConstructor> | null = null;

/**
 * Resolves with the Razorpay constructor, injecting checkout.js on first call.
 * Subsequent calls return the cached promise — no duplicate script tags.
 *
 * @example
 *   const Razorpay = await loadRazorpay();
 *   new Razorpay({ key, amount, handler }).open();
 */
export function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadRazorpay() must be called in the browser"));
  }

  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (_promise) return _promise;

  _promise = new Promise<RazorpayConstructor>((resolve, reject) => {
    // HMR guard — script tag may already exist without window.Razorpay set yet
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () =>
        window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Razorpay not defined after load"))
      );
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed")));
      return;
    }

    const script = document.createElement("script");
    script.id    = SCRIPT_ID;
    script.src   = RAZORPAY_SRC;
    script.async = true;

    script.onload = () => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
      } else {
        _promise = null;
        reject(new Error("Razorpay SDK loaded but window.Razorpay is undefined"));
      }
    };

    script.onerror = () => {
      _promise = null; // allow retry on next call
      script.remove();
      reject(new Error("Failed to load Razorpay checkout.js — check network and CSP"));
    };

    document.head.appendChild(script);
  });

  return _promise;
}

/** Synchronous check — useful for disabling the pay button during SDK init. */
export function isRazorpayLoaded(): boolean {
  return typeof window !== "undefined" && typeof window.Razorpay === "function";
}
