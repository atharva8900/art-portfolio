import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            email,
            phone,
            instagram_id,
            size,
            number_of_people,
            background_detail,
            address,
            notes,
            referral_code,
        } = body;

        // Validate required fields
        if (!name || !email || !size || !number_of_people || !address) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let validReferralCode = null;

        // Referral Logic
        if (referral_code) {
            const { data: referralData } = await supabase
                .from('referrals')
                .select('code, is_used')
                .eq('code', referral_code)
                .single();

            // If found and not used, it is valid
            if (referralData && !referralData.is_used) {
                validReferralCode = referral_code;
            }
            // If error or used, we ignore it safely and proceed without it
        }

        // Insert Commission
        const { data: commission, error: commissionError } = await supabase
            .from('commissions')
            .insert({
                name,
                email,
                phone,
                instagram_id,
                size,
                number_of_people,
                background_detail,
                address,
                notes,
                referral_code: validReferralCode, // attach only if valid
            })
            .select()
            .single();

        if (commissionError) {
            console.error('Commission Insert Error:', commissionError);
            return NextResponse.json({ error: 'Failed to submit commission' }, { status: 500 });
        }

        // Mark Referral as Used (if valid)
        if (validReferralCode) {
            await supabase
                .from('referrals')
                .update({ is_used: true })
                .eq('code', validReferralCode);
        }

        // Send Email
        try {
            await resend.emails.send({
                from: 'Atharva Sherlekar Art <onboarding@resend.dev>', // User will need to verify domain
                to: 'atharvasherlekarart@gmail.com',
                subject: 'New Commission Request – Atharva Sherlekar Art',
                html: `
            <h1>New Commission Request</h1>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            <p><strong>Instagram:</strong> ${instagram_id || 'N/A'}</p>
            <hr />
            <p><strong>Size:</strong> ${size}</p>
            <p><strong>People:</strong> ${number_of_people}</p>
            <p><strong>Background:</strong> ${background_detail || 'None'}</p>
            <p><strong>Address:</strong> ${address}</p>
            <p><strong>Notes:</strong> ${notes || 'None'}</p>
            <hr />
            <p><strong>Referral Code Used:</strong> ${validReferralCode || 'None'}</p>
          `,
            });
        } catch (emailError) {
            console.error('Email Sending Error:', emailError);
            // We don't fail the request if email fails, as commission is saved in DB.
        }

        return NextResponse.json({ success: true, commission });

    } catch (err) {
        console.error('Handler Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
