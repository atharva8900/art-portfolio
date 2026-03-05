import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { removeReferralFromCommission, getCommissionById } from '@/lib/commissions';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const ALLOWED_EMAILS = ['atharva8900@gmail.com', 'atharvasherlekarart@gmail.com'];

async function checkAdminAuth() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        return false;
    }

    return ALLOWED_EMAILS.includes(session.user.email.toLowerCase());
}

// POST: Remove referral from a commission
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const commissionId = params.id;
        if (!commissionId) {
            return NextResponse.json({ error: 'Commission ID is required' }, { status: 400 });
        }

        // Check if commission exists
        const existingCommission = await getCommissionById(commissionId);
        if (!existingCommission) {
            return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
        }

        // Perform removal
        const success = await removeReferralFromCommission(commissionId);

        if (!success) {
            return NextResponse.json({ error: 'Failed to remove referral from commission in database' }, { status: 500 });
        }

        // Get the updated commission
        const updatedCommission = await getCommissionById(commissionId);

        return NextResponse.json({
            success: true,
            commission: updatedCommission
        });

    } catch (error) {
        console.error('Error removing referral from commission:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
