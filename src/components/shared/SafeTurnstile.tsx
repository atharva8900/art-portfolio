"use client";

/**
 * components/shared/SafeTurnstile.tsx
 *
 * A StrictMode-safe, lazy-loading Cloudflare Turnstile widget.
 * Merged Claude's architectural fix with premium visual collapse & 5s success timer.
 */

import { useCallback, useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle } from "react";
import { onTurnstileReady } from "@/lib/turnstile-loader";
import { motion } from "framer-motion";

// ─── Cloudflare Turnstile global type declaration ─────────────────────────────

interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: (code?: string) => void;
  "expired-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  appearance?: "always" | "execute" | "interaction-only";
  size?: "normal" | "compact" | "flexible";
  retry?: "auto" | "never";
  "refresh-expired"?: "auto" | "manual" | "never";
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: TurnstileRenderOptions
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SafeTurnstileProps {
  siteKey?: string;
  onSuccess: (token: string) => void;
  onError?: (code?: string) => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  appearance?: "always" | "execute" | "interaction-only";
  size?: "normal" | "compact" | "flexible";
  rootMargin?: string;
  className?: string;
  autoHide?: boolean;
  autoRemoveOnSuccess?: boolean;
}

export interface SafeTurnstileHandle {
  reset(): void;
}

// ─── Hook: IntersectionObserver ──────────────────────────────────────────────

function useIsNearViewport(
  ref: React.RefObject<HTMLDivElement>,
  rootMargin: string
): boolean {
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || isNear) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNear(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, isNear]);

  return isNear;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SafeTurnstile = forwardRef<SafeTurnstileHandle, SafeTurnstileProps>(
  function SafeTurnstile({
    siteKey: propSiteKey,
    onSuccess,
    onError,
    onExpire,
    theme = "auto",
    appearance = "always",
    size = "normal",
    rootMargin = "300px",
    className,
    autoHide = true,
    autoRemoveOnSuccess = true,
  }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const isNear = useIsNearViewport(containerRef, rootMargin);
  const [renderGeneration, setRenderGeneration] = useState(0);

  // Use test key in localhost if none provided
  const siteKey = useMemo(() => {
    if (propSiteKey) return propSiteKey;
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return '1x00000000000000000000AA'; // Standard Turnstile testing key (Always passes)
    }
    return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
  }, [propSiteKey]);

  // ── Callback refs for stability ───────────────────────────────────────────
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);

  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  onExpireRef.current = onExpire;

  const removeWidget = useCallback(() => {
    if (widgetIdRef.current !== null) {
      try { window.turnstile?.remove(widgetIdRef.current); } catch {}
      widgetIdRef.current = null;
    }
  }, []);

  const stableOnSuccess = useCallback((token: string) => {
    onSuccessRef.current(token);
    if (autoHide) {
      setTimeout(() => {
        setIsSolved(true);
        if (autoRemoveOnSuccess) {
          removeWidget();
        }
      }, 3000);
    } else if (autoRemoveOnSuccess) {
      removeWidget();
    }
  }, [autoHide, autoRemoveOnSuccess, removeWidget]);

  const stableOnError = useCallback((code?: string) => onErrorRef.current?.(code), []);
  const stableOnExpire = useCallback(() => onExpireRef.current?.(), []);

  useImperativeHandle(ref, () => ({
    reset() {
      removeWidget();
      setRenderGeneration((g) => g + 1);
      setIsSolved(false);
    },
  }), [removeWidget]);

  // ── Render / cleanup ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isNear || !siteKey) return;

    let cancelled = false;

    const renderWidget = () => {
      if (cancelled) return;
      const container = containerRef.current;
      if (!container || !window.turnstile) return;

      // Clean up any stale widget (StrictMode path)
      if (widgetIdRef.current !== null) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }

      try {
        widgetIdRef.current = window.turnstile.render(container, {
          sitekey: siteKey,
          callback: stableOnSuccess,
          "error-callback": stableOnError,
          "expired-callback": stableOnExpire,
          theme,
          appearance,
          size,
          "refresh-expired": "never",
        });
      } catch (err) {
        console.warn("[SafeTurnstile] Render failed:", err);
      }
    };

    const unsubscribe = onTurnstileReady(renderWidget);

    return () => {
      cancelled = true;
      unsubscribe();
      if (widgetIdRef.current !== null) {
        try { window.turnstile?.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [isNear, renderGeneration, siteKey, theme, appearance, size, stableOnSuccess, stableOnError, stableOnExpire, removeWidget]);

  return (
    <motion.div 
        ref={containerRef} 
        onMouseEnter={() => window.dispatchEvent(new CustomEvent('cursor-hide'))}
        onMouseLeave={() => window.dispatchEvent(new CustomEvent('cursor-show'))}
        className={`turnstile-lazy-wrapper flex items-center justify-center overflow-hidden ${className || ''}`}
        initial={false}
        animate={{
            height: isSolved ? 0 : 'auto',
            opacity: isSolved ? 0 : 1,
            marginTop: isSolved ? 0 : 16,
            marginBottom: isSolved ? 0 : 16,
        }}
        transition={{ 
            duration: 0.8, 
            ease: [0.4, 0, 0.2, 1] 
        }}
        style={{
            pointerEvents: isSolved ? 'none' : 'auto',
        }}
    />
  );
});

SafeTurnstile.displayName = "SafeTurnstile";
export default SafeTurnstile;

