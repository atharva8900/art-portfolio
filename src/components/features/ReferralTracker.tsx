'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ReferralTrackerContent() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get('ref');
        const data = searchParams.get('d');

        // Cleanup legacy localStorage (fix for user's issue)
        localStorage.removeItem('referrer_code');
        localStorage.removeItem('referrer_name');
        localStorage.removeItem('referrer_email');
        localStorage.removeItem('referrer_phone');

        if (ref) {
            sessionStorage.setItem('referrer_code', ref);
        }

        if (data) {
            try {
                const decoded = JSON.parse(atob(data));
                if (decoded.name) sessionStorage.setItem('referrer_name', decoded.name);
                if (decoded.email) sessionStorage.setItem('referrer_email', decoded.email);
                if (decoded.phone) sessionStorage.setItem('referrer_phone', decoded.phone);
            } catch {
                console.error('Failed to parse referrer data');
            }
        }

        // Notify other components (CommissionForm) that data is ready
        if (ref || data) {
            window.dispatchEvent(new Event('referral-updated'));
        }
    }, [searchParams]);

    return null;
}

export default function ReferralTracker() {
    return (
        <Suspense fallback={null}>
            <ReferralTrackerContent />
        </Suspense>
    );
}
