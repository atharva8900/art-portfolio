import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const demoReferralCode = 'DEMO_TEST_123';
        const referrerEmail = 'demo_referrer@example.com';

        // 1. Create a demo referral record if it doesn't exist
        const { data: existingReferral } = await supabaseAdmin
            .from('referrals')
            .select('*')
            .eq('code', demoReferralCode)
            .maybeSingle();

        if (!existingReferral) {
            await supabaseAdmin.from('referrals').insert([{
                code: demoReferralCode,
                referrer_email: referrerEmail,
                referrer_name: 'Demo Referrer',
                successful_referrals_count: 1,
                created_at: new Date().toISOString(),
                ip_hash: 'demo_hash'
            }]);
        }

        // 2. Create a COMPLETED commission linked to this code
        const demoCommission = {
            client_name: 'Demo Client',
            client_email: 'demo_client@example.com',
            phone: '+919876543210',
            size: 'A4',
            number_of_people: '1 person',
            address: '123 Demo St, Mumbai',
            status: 'completed',
            payment_status: 'fully_paid',
            referral_code: demoReferralCode,
            referrer_info: {
                name: 'Demo Referrer',
                email: referrerEmail,
                phone: '+910000000000'
            },
            commission_amount: 500, // 20% of 2500
            base_price: 2000,
            extras_total: 500,
            submitted_at: new Date().toISOString(),
            payout_status: 'requested',
            payout_details: JSON.stringify({
                type: 'upi',
                vpa: 'demo_payout@upi'
            })
        };

        const { data: commission, error: commError } = await supabaseAdmin
            .from('commissions')
            .insert([demoCommission])
            .select()
            .single();

        if (commError) throw commError;

        return NextResponse.json({
            success: true,
            message: 'Demo referral data seeded successfully!',
            referralCode: demoReferralCode,
            commissionId: commission.id
        });
    } catch (error: unknown) {
        console.error('Seed Error:', error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
