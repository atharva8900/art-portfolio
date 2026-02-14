'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ReferralTrackerContent() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) {
            localStorage.setItem('referrer_code', ref);
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
