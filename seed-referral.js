const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    try {
        const demoReferralCode = 'DEMO_TEST_123';
        const referrerEmail = 'demo_referrer@example.com';
        const commissionId = `COM_DEMO_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        console.log('--- Seeding Demo Data ---');

        // 1. Create a demo referral record if it doesn't exist
        const { data: existingReferral } = await supabase
            .from('referrals')
            .select('*')
            .eq('code', demoReferralCode)
            .maybeSingle();

        if (!existingReferral) {
            console.log('Creating demo referral record...');
            const { error: refError } = await supabase.from('referrals').insert([{
                code: demoReferralCode,
                referrer_email: referrerEmail,
                referrer_name: 'Demo Referrer',
                referrer_phone: '+910000000000',
                referrer_instagram: '@demo_referrer',
                successful_referrals_count: 1,
                created_at: new Date().toISOString(),
                ip_hash: 'demo_hash'
            }]);
            if (refError) throw refError;
        } else {
            console.log('Referral record already exists.');
        }

        // 2. Create a COMPLETED commission linked to this code
        console.log('Creating demo completed commission...');
        const demoCommission = {
            id: commissionId,
            client_name: 'Atharva (Demo)',
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
            commission_amount: 500,
            base_price: 2000,
            extras_total: 500,
            submitted_at: new Date().toISOString(),
            payout_status: 'requested',
            payout_details: JSON.stringify({
                type: 'upi',
                vpa: 'demo_payout@upi'
            })
        };

        const { data: commission, error: commError } = await supabase
            .from('commissions')
            .insert([demoCommission])
            .select()
            .single();

        if (commError) throw commError;

        console.log('--- Seed Successful ---');
        console.log('Referral Code:', demoReferralCode);
        console.log('Commission ID:', commission.id);

    } catch (error) {
        console.error('Seed Error:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
}

seed();
