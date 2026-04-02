"use client";

import { ReactNode, useEffect, useState } from "react";

interface DeviceGuardProps {
    children: ReactNode;
    fallback?: ReactNode;
    minWidth?: number;
    disableOnTouch?: boolean;
}

/**
 * DeviceGuard: A Performance-focused wrapper that only renders its children
 * if specific device/browser criteria are met. 
 * Useful for stripping heavy JS (Custom Cursors, Smooth Scroll) from mobile/touch.
 */
export default function DeviceGuard({
    children,
    fallback = null,
    minWidth = 1024,
    disableOnTouch = true,
}: DeviceGuardProps) {
    const [shouldRender, setShouldRender] = useState<boolean | null>(null);

    useEffect(() => {
        const checkDevice = () => {
            const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            const isWideEnough = window.innerWidth >= minWidth;

            if (disableOnTouch && isTouchDevice) {
                setShouldRender(false);
                return;
            }

            setShouldRender(isWideEnough);
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, [minWidth, disableOnTouch]);

    // During SSR or before check, render nothing to prevent hydration flicker
    if (shouldRender === null) return null;

    return shouldRender ? <>{children}</> : <>{fallback}</>;
}
