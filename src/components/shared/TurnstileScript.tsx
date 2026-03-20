"use client";

/**
 * components/shared/TurnstileScript.tsx
 *
 * One-shot global script loader. Put this in your root layout.tsx.
 */

import Script from "next/script";
import { notifyTurnstileReady } from "@/lib/turnstile-loader";

export default function TurnstileScript() {
  return (
    <Script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      strategy="lazyOnload"
      onLoad={notifyTurnstileReady}
    />
  );
}
