/**
 * lib/turnstile-loader.ts
 *
 * A module-level singleton that tracks whether the Cloudflare Turnstile
 * script (loaded globally via next/script in layout.tsx) has finished
 * initialising. SafeTurnstile widgets subscribe here instead of each
 * trying to load the script themselves.
 */

type ReadyCallback = () => void;

let scriptReady = false;
const subscribers = new Set<ReadyCallback>();

/**
 * Called by the `onLoad` prop of the <Script> tag in layout.tsx.
 * Marks the script as ready and drains the subscriber queue.
 */
export function notifyTurnstileReady(): void {
  if (scriptReady) return;
  scriptReady = true;

  const pending = Array.from(subscribers);
  subscribers.clear();
  for (const cb of pending) cb();
}

/**
 * Subscribe to be called once Turnstile is ready. If the script is
 * already loaded when you call this, `cb` is invoked synchronously on
 * the next microtask.
 *
 * Returns an unsubscribe function.
 */
export function onTurnstileReady(cb: ReadyCallback): () => void {
  if (scriptReady) {
    queueMicrotask(cb);
    return () => {};
  }

  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

/**
 * Synchronous check — useful for SSR guards.
 */
export function isTurnstileReady(): boolean {
  return scriptReady && typeof window !== "undefined" && !!window.turnstile;
}
