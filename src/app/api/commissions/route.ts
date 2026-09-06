import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/api/email';
import crypto from 'crypto';
import {
    validateNotSelfReferral,
    getReferralByCode,
    hashIP,
    hasClientUsedCode,
    incrementReferralCount,
    hasReachedCommissionCap,
    isReferralExpired
} from '@/lib/db/referrals';
import { saveCommission, generateCommissionId, getActiveWorkloadCount, getPendingReviewCount, hasActiveCommission, getActiveCommissionCount, CommissionData } from '@/lib/db/commissions';
import { getAvailability } from '@/lib/db/availability';
import { getPriceForSize, calculatePortraitPrice, FRAMING_PRICES } from '@/lib/utils/pricing';
import { SIZE_MIN_LEAD_DAYS, SIZE_RUSH_WINDOWS, parseLocalDate, formatLocalDate, calculateDetailedBackgroundPrice, calculateDetailedClothesPrice } from '@/lib/utils/pricing-shared';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { sendDiscordNotification } from '@/lib/api/discord';
import { getOfferById, incrementOfferUsage, OfferData } from '@/lib/db/offers';
import { commissionSchema } from '@/lib/utils/schemas';
import { checkDeviceBanStatus } from '@/lib/db/rate-limits';
import { getBaseUrl } from '@/lib/utils/utils';




// Helper to extract IP from request
function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');

    if (forwarded) return forwarded.split(',')[0].trim();
    if (cfConnectingIP) return cfConnectingIP;
    if (realIP) return realIP;

    return 'unknown';
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const submitterEmail = session?.user?.email || null;

        const jsonBody = await request.json();
        const result = commissionSchema.safeParse(jsonBody);

        if (!result.success) {
            console.error('Validation error:', result.error.issues);
            return NextResponse.json({ 
                error: 'Invalid input data', 
                details: result.error.issues.map((e: { message: string }) => e.message).join(', ') 
            }, { status: 400 });
        }

        const {
            name,
            email,
            phone,
            instagram_id,
            size,
            number_of_people,
            address,
            detailed_background,
            detailed_clothes,
            timelapse_recording,
            framing,
            consent,
            notes,
            referral_code,
            referrer_name,
            referrer_email,
            needed_by,
            frame_style,
            frame_size,
            frame_matting_color,
            frame_matting_size,
            frame_width,
            frame_image,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            attachment_urls,
            attachment_base64,
            frame_image_base64,
            promo_ids,
            turnstile_token,
            referral_locked_browser,
            fingerprint_hash,
            submitted_at,
        } = result.data;

        // Verify Razorpay Payment if provided
        if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
            const text = razorpay_order_id + "|" + razorpay_payment_id;
            const generated_signature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
                .update(text)
                .digest("hex");

            if (generated_signature !== razorpay_signature) {
                return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
            }
        }

        // --- Turnstile Verification ---
        if (!turnstile_token) {
            return NextResponse.json({ error: 'CAPTCHA token missing' }, { status: 403 });
        }

        const verifyResponse = await fetch(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${encodeURIComponent(process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA')}&response=${encodeURIComponent(turnstile_token)}`,
            }
        );

        const verifyData = await verifyResponse.json();
        if (!verifyData.success) {
            console.error('Turnstile verification failed:', verifyData);
            return NextResponse.json({ error: 'Invalid CAPTCHA' }, { status: 403 });
        }
        // ------------------------------

        // ... existing validation code ...

        // Calculation Logic
        // const backgroundCost = detailed_background ? 500 : 0;
        // const timelapseCost = timelapse_recording ? 500 : 0;
        // const extrasTotal = backgroundCost + timelapseCost; // Unused here, calculated later for saving

        // Required fields are now handled by Zod

        // --- Mute / Ban Check ---
        const banStatus = await checkDeviceBanStatus(fingerprint_hash || '', submitterEmail);
        if (banStatus.isBlocked) {
            return NextResponse.json({
                error: banStatus.reason || 'Your device or account is restricted from submitting commissions.'
            }, { status: 403 });
        }
        // ------------------------

        if (await hasActiveCommission(email)) {
            return NextResponse.json({
                error: 'You already have an active commission request. Please wait for it to be completed or cancelled before submitting another.'
            }, { status: 400 });
        }

        // --- Workload Check & Routing ---
        const activeWorkload = await getActiveWorkloadCount();
        if (activeWorkload >= 4) {
            return NextResponse.json({
                error: 'Commissions are currently fully booked. Please check back later.'
            }, { status: 403 });
        }

        const pendingReviewCount = await getPendingReviewCount();
        const activeCount = await getActiveCommissionCount();
        const isWaitlist = (pendingReviewCount + activeCount) >= 2;
        const commissionStatus = isWaitlist ? 'waitlist' : 'pending';

        // Check 3-Day Submission Cooldown for Active Slots (Waitlist slots are exempt)
        const availabilityData = await getAvailability();
        if (!isWaitlist && availabilityData.cooldown_active) {
            return NextResponse.json({
                error: 'Commission submissions are temporarily paused for 3 days while the artist reviews a recent inquiry.'
            }, { status: 403 });
        }

        // Enforcement of 25% Deposit for Waitlist Slots 3 & 4
        if (isWaitlist) {
            if (!razorpay_payment_id || !razorpay_signature || !razorpay_order_id) {
                return NextResponse.json({
                    error: 'A 25% reservation fee is required for waitlist slots 3 & 4. Please complete the payment to submit your request.'
                }, { status: 402 }); // 402 Payment Required
            }
            // Signature verification already happened at line 70
        }
        // ----------------------

        let validReferralCode = null;
        let referralInfo = null;
        let commissionEligible = false; // Whether referrer earns commission
        let justExpired = false; // Track if link just expired on this submission
        let isSelfReferralFlag = false;
        let flagReason = null;

        // Referral Logic with Multi-Layer Anti-Abuse Protection
        if (referral_code) {
            try {
                // LAYER 0: Check if referral link has expired
                if (await isReferralExpired(referral_code)) {
                    return NextResponse.json({
                        error: 'This referral link has expired. Please ask the referrer to generate a new link.'
                    }, { status: 400 });
                }

                // LAYER 1: IP Rate Limiting (Tracking only, limit removed per user request)
                const clientIP = getClientIP(request);
                const ipHash = hashIP(clientIP);

                // if (hasIPExceededLimit(ipHash, referral_code)) { ... }

                // LAYER 2: Duplicate Submission Protection
                if (await hasClientUsedCode(email, referral_code)) {
                    return NextResponse.json({
                        error: 'You have already submitted a commission with this referral code.'
                    }, { status: 400 });
                }

                // Get current user ID if authenticated via NextAuth
                let currentUserId: string | undefined;
                try {
                    const session = await getServerSession(authOptions);
                    currentUserId = session?.user?.email || undefined;
                } catch {
                    currentUserId = undefined;
                }

                // Get referral information first for comparison
                referralInfo = await getReferralByCode(referral_code);

                const isValidReferral = await validateNotSelfReferral(email, phone, instagram_id || undefined, referral_code, currentUserId);

                if (!isValidReferral) {
                    // HYBRID LOGIC: 
                    // If exact email match: Hard Block (Obvious)
                    if (referralInfo?.referrer_email?.toLowerCase() === email.toLowerCase() || 
                        currentUserId?.toLowerCase() === referralInfo?.referrer_email?.toLowerCase()) {
                        return NextResponse.json({
                            error: 'You cannot use your own referral code.'
                        }, { status: 400 });
                    }
                    
                    // If different email but Phone/Insta/User ID match: Silent Flag (Sting)
                    isSelfReferralFlag = true;
                    flagReason = 'Identity Match (Phone/Instagram/User ID matched referrer)';
                }

                if (referralInfo) {
                    validReferralCode = referral_code;

                    // LAYER 4: Commission Cap Check
                    commissionEligible = !(await hasReachedCommissionCap(referral_code));

                    // LAYER 5: "Sting" Flagging (Anti-Self-Referral) — all checks run independently

                    // A: Browser Lock (Most reliable for same device switching)
                    if (referral_locked_browser) {
                        isSelfReferralFlag = true;
                        flagReason = flagReason
                            ? `${flagReason} + Browser Lock Match (Detected via device storage)`
                            : 'Browser Lock Match (Detected via device storage)';
                    }

                    // B: IP Match (Device/Network overlap) — runs independently of A
                    if (referralInfo.ip_hash === ipHash) {
                        isSelfReferralFlag = true;
                        flagReason = flagReason
                            ? `${flagReason} + IP Match (Same network as referrer)`
                            : 'IP Match (Same network as referrer)';
                    }

                    // C: Device Fingerprint Match (Strongest signal)
                    if (
                        fingerprint_hash &&
                        referralInfo.fingerprint_hash &&
                        fingerprint_hash === referralInfo.fingerprint_hash
                    ) {
                        isSelfReferralFlag = true;
                        flagReason = flagReason
                            ? `${flagReason} + Fingerprint Match (Same device detected)`
                            : 'Fingerprint Match (Same device detected)';
                    }

                    // Transactional tracking moved to after successful commission save
                    // to prevent "burning" a referral if the database save fails.
                }
                // Backwards compatibility with legacy codes
                else if (referrer_name || referrer_email) {
                    validReferralCode = null; // Don't save to the FK column if it doesn't exist in referrals table
                    commissionEligible = true; // Legacy codes always count for commission
                }

            } catch (referralError) {
                // Fail-safe: If referral validation fails, continue without referral
                console.error('Referral validation error:', referralError);
                validReferralCode = null;
                referralInfo = null;
                commissionEligible = false;
            }
        }

        // Build email attachments from base64 fallbacks (used when Supabase upload failed)
        const emailAttachments: { filename: string; content: string }[] = [];
        if (Array.isArray(attachment_base64)) {
            for (const att of attachment_base64 as { name: string; content: string }[]) {
                if (att.content && att.content.startsWith('data:')) {
                    const base64Data = att.content.split(',')[1];
                    if (base64Data) {
                        emailAttachments.push({ filename: att.name, content: base64Data });
                    }
                }
            }
        }
        if (frame_image_base64 && typeof frame_image_base64 === 'string' && frame_image_base64.startsWith('data:')) {
            const base64Data = frame_image_base64.split(',')[1];
            if (base64Data) {
                emailAttachments.push({ filename: 'frame-design.jpg', content: base64Data });
            }
        }

        // Pre-calculate prices for notifications and storage
        const basePriceStr = await getPriceForSize(size as 'A5' | 'A4' | 'A3' | 'A2');
        const basePriceForOne = basePriceStr ? parseInt(basePriceStr.replace('₹', '').replace(',', ''), 10) : 0;
        const totalBasePriceOriginal = calculatePortraitPrice(basePriceForOne, Number(number_of_people), size as 'A5' | 'A4' | 'A3' | 'A2');
        let totalBasePrice = totalBasePriceOriginal;
        const additionalPeopleCost = totalBasePriceOriginal - basePriceForOne;

        // Calculate Artist Rush Fee & Validate Lead Times based on size & queue_start_date
        let rushFee = 0;
        if (needed_by) {
            const queueStartDate = parseLocalDate(availabilityData.queue_start_date || formatLocalDate(new Date()));
            const targetDate = parseLocalDate(needed_by);

            const diffTime = targetDate.getTime() - queueStartDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            const minLead = SIZE_MIN_LEAD_DAYS[size as 'A5' | 'A4' | 'A3' | 'A2'] || 14;
            const rushWindow = SIZE_RUSH_WINDOWS[size as 'A5' | 'A4' | 'A3' | 'A2'];

            // Validate that requested date meets minimum lead time
            if (diffDays < minLead) {
                return NextResponse.json({
                    error: `The requested delivery date is earlier than the minimum ${minLead}-day lead time required for ${size} portraits.`
                }, { status: 400 });
            }

            if (rushWindow && diffDays >= rushWindow.min && diffDays <= rushWindow.max) {
                rushFee = Math.ceil(totalBasePriceOriginal * 0.30);
            }
        }

        // Fetch Offers for server-side validation and pricing
        const validOffers: OfferData[] = [];
        let hasFreeBackground = false;
        let hasFreeTimelapse = false;
        let hasFreeFraming = false;
        let appliedOffersEmailDraft = '';

        if (promo_ids && Array.isArray(promo_ids)) {
            const { searchParams } = new URL(request.url);
            const countryParam = searchParams.get('country');
            const country = countryParam || request.headers.get('x-vercel-ip-country') || 'IN'; // priority: param > header > default
            
            for (const pid of promo_ids) {
                const offer = await getOfferById(pid);
                if (offer && (offer.usage_limit - offer.usage_count) > 0) {
                    
                    // Regional Restriction Logic
                    if (country !== 'IN' && offer.only_india_delivery) {
                        if (offer.free_extras) {
                            offer.free_extras.delivery = false;
                        }
                    }

                    validOffers.push(offer);

                    // Apply compounding discount to base price
                    if (offer.discount_percent) {
                        totalBasePrice = totalBasePrice * (1 - offer.discount_percent / 100);
                        appliedOffersEmailDraft += `- Applied Offer (${offer.code}): -${offer.discount_percent}%\n`;
                    }
                    if (offer.free_extras?.background) hasFreeBackground = true;
                    if (offer.free_extras?.timelapse) hasFreeTimelapse = true;
                    if (offer.free_extras?.framing) hasFreeFraming = true;
                }
            }
        }

        const backgroundCostOriginal = detailed_background ? calculateDetailedBackgroundPrice(basePriceForOne) : 0;
        const clothesCostOriginal = detailed_clothes ? calculateDetailedClothesPrice(totalBasePriceOriginal) : 0;
        const timelapseCostOriginal = timelapse_recording ? 500 : 0;
        const framingCostOriginal = framing ? FRAMING_PRICES[size as 'A5' | 'A4' | 'A3' | 'A2'] : 0;
        const totalAmountOriginal = Math.round(totalBasePriceOriginal + backgroundCostOriginal + clothesCostOriginal + timelapseCostOriginal + framingCostOriginal + rushFee);

        const backgroundCost = (detailed_background && !hasFreeBackground) ? calculateDetailedBackgroundPrice(basePriceForOne) : 0;
        const clothesCost = detailed_clothes ? calculateDetailedClothesPrice(totalBasePriceOriginal) : 0;
        const timelapseCost = (timelapse_recording && !hasFreeTimelapse) ? 500 : 0;
        const framingCost = (framing && !hasFreeFraming) ? FRAMING_PRICES[size as 'A5' | 'A4' | 'A3' | 'A2'] : 0;

        const totalAmount = Math.round(totalBasePrice + backgroundCost + clothesCost + timelapseCost + framingCost + rushFee);
        const totalSavings = totalAmountOriginal - totalAmount;

        // Increment Offer Usages if valid
        for (const offer of validOffers) {
            await incrementOfferUsage(offer.id);
        }

        // Construct Email Draft for Artist (to copy-paste to client)
        let emailDraft = '';
        const firstName = name.split(' ')[0];
        const pluralPeople = Number(number_of_people) > 1 ? 's' : '';

        const priceBreakdownDraft =
            `- Base Price (${size}, ${number_of_people} people): ₹${totalBasePriceOriginal}\n` +
            (detailed_background ? `- Detailed Background: ₹${backgroundCostOriginal} ${hasFreeBackground ? '(FREE)' : ''}\n` : '') +
            (detailed_clothes ? `- Detailed Clothes: ₹${clothesCostOriginal}\n` : '') +
            (timelapse_recording ? `- Timelapse Recording: ₹500 ${hasFreeTimelapse ? '(FREE)' : ''}\n` : '') +
            (framing ? `- Professional Framing: ₹${framingCostOriginal} ${hasFreeFraming ? '(FREE)' : ''}\n` : '') +
            (rushFee > 0 ? `- Artist Rush Fee (15–19 Days): ₹${rushFee}\n` : '') +
            appliedOffersEmailDraft +
            (totalSavings > 0 ? `**Total Savings: ₹${totalSavings}**\n` : '') +
            `**Final Total: ₹${totalAmount}**`;

        if (isWaitlist) {
            emailDraft = `Hi ${firstName},\n\n` +
                `Thank you for reaching out! I've received your request for a ${size} portrait of ${number_of_people} person${pluralPeople}.\n\n` +
                `**Waitlist Status:**\n` +
                `Currently, all my review slots are full, so your request has been placed on the waitlist. I'll be able to start working on your piece next month!\n\n` +
                `**Price Breakdown:**\n` +
                priceBreakdownDraft + `\n\n` +
                `**Waitlist Reservation Confirmed:**\n` +
                `- Reservation Fee Paid (25%): ₹${Math.round(totalAmount * 0.25)}\n\n` +
                `**Next Steps:**\n` +
                `1. You are now officially on the waitlist (Slot 3 or 4).\n` +
                `2. Once I'm ready to begin, I'll notify you to pay the remaining 25% to complete your 50% deposit.\n` +
                `3. After the full deposit is received, I'll start working on your portrait!`;
        } else {
            emailDraft = `Hi ${firstName},\n\n` +
                `Thank you for reaching out! I've received your request for a ${size} portrait of ${number_of_people} person${pluralPeople}.\n\n` +
                `**Price Breakdown:**\n` +
                priceBreakdownDraft + `\n\n` +
                `**Next Steps:**\n` +
                `1. I've received your reference photo(s) and I'm reviewing the quality now.\n` +
                `2. Once confirmed, you can pay a 50% advance (₹${Math.round(totalAmount / 2)}) to officially book your slot.\n\n` +
                `Looking forward to working on this!`;
        }

        // 1. Save commission to storage FIRST (Guarantees data is persisted before notification)
        try {
            const commissionId = generateCommissionId();
            const extrasTotal = backgroundCost + clothesCost + timelapseCost + framingCost + rushFee;
            const commissionableAmount = totalBasePrice + backgroundCost + clothesCost;
            const referrersShare = commissionEligible ? (commissionableAmount * 0.20) : 0;

            const commissionData: CommissionData = {
                id: commissionId,
                client_name: name,
                client_email: email,
                phone: phone,
                instagram_id: instagram_id || undefined,
                size: size,
                number_of_people: number_of_people,
                detailed_background: !!detailed_background,
                detailed_clothes: !!detailed_clothes,
                timelapse_recording: !!timelapse_recording,
                framing: !!framing,
                consent: !!consent,
                address: address,
                referral_code: validReferralCode,
                referrer_info: referralInfo ? {
                    name: referralInfo.referrer_name,
                    email: referralInfo.referrer_email,
                    phone: referralInfo.referrer_phone,
                    instagram: referralInfo.referrer_instagram,
                } : null,
                status: commissionStatus,
                submitted_at: (submitted_at && submitterEmail && ['atharva8900@gmail.com', 'atharvasherlekarart@gmail.com'].includes(submitterEmail.toLowerCase())) ? new Date(submitted_at).toISOString() : new Date().toISOString(),
                needed_by: needed_by || undefined,
                base_price: totalBasePrice,
                extras_total: extrasTotal,
                rush_fee: rushFee > 0 ? rushFee : undefined,
                commission_amount: referrersShare,
                promo_ids: validOffers.length > 0 ? validOffers.map(o => o.id) : null,
                promotion_codes: validOffers.length > 0 ? validOffers.map(o => o.code) : null,
                frame_image: frame_image || undefined,
                razorpay_order_id: razorpay_order_id || undefined,
                razorpay_payment_id: razorpay_payment_id || undefined,
                payment_status: isWaitlist ? 'reservation_paid' : 'pending',
                is_self_referral_flag: isSelfReferralFlag,
                flag_reason: flagReason,
            };

            await saveCommission({
                ...commissionData,
                fingerprint_hash: fingerprint_hash || null,
                submitter_email: submitterEmail
            });

            // Post-Save Referral Tracking
            if (validReferralCode) {
                const ipHash = hashIP(getClientIP(request));
                await incrementReferralCount(validReferralCode, email, ipHash);
                justExpired = await isReferralExpired(validReferralCode);
            }
        } catch (storageError) {
            console.error('Failed to save commission data:', storageError);
            return NextResponse.json({
                error: 'We encountered an error saving your commission request. Please try again or contact support.'
            }, { status: 500 });
        }

        // 2. Send Email & Discord Notifications (Non-fatal if email service is delayed)
        try {
            // Instant Discord Alert
            await sendDiscordNotification({
                content: isWaitlist ? '⚠️ **New Waitlist Reservation Received (25% Paid)**' : '🔔 **New Commission Request Received!**',
                embeds: [{
                    title: `Request from ${name}`,
                    description: isWaitlist
                        ? `A new waitlist request has been submitted with a **25% reservation payment**. Check the Admin Dashboard to review.`
                        : `A new commission request has been submitted. Check the Admin Dashboard for details.`,
                    color: isWaitlist ? 0xFFA500 : 0x00FF00,
                    fields: [
                        { name: 'Client', value: `${name} (${email})`, inline: true },
                        { name: 'Instagram', value: instagram_id || 'N/A', inline: true },
                        { name: 'Size', value: size, inline: true },
                        { name: 'Status', value: isWaitlist ? 'Waitlist' : 'Pending Review', inline: true },
                        ...(validReferralCode ? [
                            { name: 'Referral Code', value: validReferralCode, inline: true },
                            { name: 'Referrer Email (Manual Notify)', value: referralInfo ? referralInfo.referrer_email : (referrer_email || 'N/A'), inline: false },
                            { name: 'Referrer Name', value: referralInfo ? referralInfo.referrer_name : (referrer_name || 'N/A'), inline: true },
                            { name: 'Commission Eligible', value: commissionEligible ? 'Yes (20%)' : 'No (Cap Reached)', inline: true }
                        ] : []),
                        { name: 'Email Draft (Copy-Paste)', value: `\`\`\`\n${emailDraft}\n\`\`\`` }
                    ],
                    timestamp: new Date().toISOString()
                }]
            });

            // Artist notification via Gmail SMTP
            await sendEmail({
                to: process.env.NEXT_PUBLIC_ARTIST_EMAIL || 'atharvasherlekarart@gmail.com',
                subject: isWaitlist ? 'New Waitlist Joiner – Atharva Sherlekar Art' : 'New Commission Request – Atharva Sherlekar Art',
                attachments: emailAttachments,
                html: `
                    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;line-height:1.5;">
                        <h1 style="margin:0 0 16px;font-size:24px;">${isWaitlist ? 'New Waitlist Joiner' : 'New Commission Request'}</h1>
                        ${isWaitlist ? '<p style="background:#fff3e0;padding:10px;border-left:4px solid #ff9800;margin:0 0 16px;"><strong>Note:</strong> This user joined the waitlist (Slots Full).</p>' : ''}
                        
                        <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin-bottom:20px;">
                            <p style="margin:4px 0;"><strong>Name:</strong> ${name}</p>
                            <p style="margin:4px 0;"><strong>Email:</strong> ${email}</p>
                            <p style="margin:4px 0;"><strong>Phone:</strong> ${phone || 'N/A'}</p>
                            <p style="margin:4px 0;"><strong>Instagram:</strong> ${instagram_id || 'N/A'}</p>
                        </div>
                        
                        ${Array.isArray(attachment_urls) && attachment_urls.length > 0 ? `
                        <div style="margin:20px 0;padding:20px;background:#f0f7ff;border:1px solid #c2e0ff;border-radius:8px;text-align:center;">
                            <p style="margin:0 0 12px;font-size:14px;color:#0056b3;font-weight:bold;">📸 REFERENCE PHOTOS (${attachment_urls.length})</p>
                            ${attachment_urls.map((url: string, idx: number) => `
                                <a href="${url}" style="display:inline-block;background:#007bff;color:white;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:bold;font-size:12px;margin:4px;">DOWNLOAD PHOTO ${attachment_urls.length > 1 ? idx + 1 : ''}</a>
                            `).join('')}
                        </div>
                        ` : ''}

                        ${Array.isArray(attachment_base64) && (attachment_base64 as { name: string; content: string }[]).length > 0 ? `
                        <div style="margin:20px 0;padding:16px;background:#fff8e1;border:1px solid #f9a825;border-radius:8px;text-align:center;">
                            <p style="margin:0 0 6px;font-size:14px;color:#e65100;font-weight:bold;">📎 ATTACHED TO EMAIL (${(attachment_base64 as { name: string; content: string }[]).length} file${(attachment_base64 as { name: string; content: string }[]).length > 1 ? 's' : ''})</p>
                            <p style="margin:0;font-size:12px;color:#795548;">(Uploaded to email attachments because Supabase was unavailable)</p>
                        </div>
                        ` : ''}

                        <div style="border-top:1px solid #ddd;padding-top:20px;margin-top:20px;">
                            <p style="margin:6px 0;"><strong>Size:</strong> ${size}</p>
                            <p style="margin:6px 0;"><strong>People:</strong> ${number_of_people}</p>
                            ${detailed_background ? `<p style="margin:6px 0;"><strong>Add-on:</strong> Detailed Background (+₹${backgroundCostOriginal})</p>` : ''}
                            ${detailed_clothes ? `<p style="margin:6px 0;"><strong>Add-on:</strong> Detailed Clothes (+₹${clothesCostOriginal})</p>` : ''}
                            ${timelapse_recording ? '<p style="margin:6px 0;"><strong>Add-on:</strong> Timelapse Recording (+₹500)</p>' : ''}
                            
                            ${framing ? `
                            <div style="background:#fdf9f0;border:1px solid #eee1c1;border-radius:8px;padding:16px;margin:16px 0;">
                                <p style="margin:0 0 10px;color:#856404;font-size:14px;font-weight:bold;">🖼️ FRAMING DESIGN DETAILS</p>
                                <p style="margin:4px 0;font-size:13px;"><strong>Size:</strong> ${frame_size || size}</p>
                                <p style="margin:4px 0;font-size:13px;"><strong>Frame Style:</strong> ${frame_style}</p>
                                <p style="margin:4px 0;font-size:13px;"><strong>Matting:</strong> <span style="display:inline-block;width:12px;height:12px;background:${frame_matting_color};border:1px solid #999;border-radius:2px;vertical-align:middle;"></span> ${frame_matting_color}</p>
                                <p style="margin:4px 0;font-size:13px;"><strong>Matting Size:</strong> ${frame_matting_size}px / <strong>Width:</strong> ${frame_width}px</p>
                                
                                ${frame_image && frame_image.startsWith('http') ? `
                                <div style="margin-top:12px;border-top:1px solid #eee1c1;padding-top:12px;text-align:center;">
                                    <a href="${frame_image}" style="display:inline-block;background:#D4AF37;color:black;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:bold;font-size:12px;">VIEW HIGH-RES MOCKUP →</a>
                                </div>` : frame_image_base64 ? `
                                <div style="margin-top:12px;border-top:1px solid #eee1c1;padding-top:12px;text-align:center;">
                                    <p style="margin:0;color:#e65100;font-size:12px;font-weight:bold;">📎 MOCKUP ATTACHED TO EMAIL</p>
                                </div>` : ''}
                            </div>` : ''}
                        </div>

                        <div style="background:#fafafa;padding:16px;border-radius:8px;margin-top:20px;">
                            <p style="margin:4px 0;"><strong>Address:</strong> ${address}</p>
                            <p style="margin:4px 0;"><strong>Needed By:</strong> ${needed_by ? new Date(needed_by).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Flexible'}</p>
                            <p style="margin:4px 0;"><strong>Notes:</strong> ${notes || 'None'}</p>
                            <p style="margin:4px 0;"><strong>Insta Consent:</strong> ${consent ? 'Granted ✅' : 'Denied ❌'}</p>
                        </div>

                        <hr style="border:none;border-top:1px solid #ddd;margin:25px 0;"/>

                        <div style="background:#f0fff4;padding:16px;border-radius:8px;border:1px solid #c6f6d5;">
                            <p style="margin:4px 0;"><strong>Referral Code:</strong> ${validReferralCode || 'None'}</p>
                            ${validReferralCode && referralInfo ? `
                                <p style="margin:4px 0;"><strong>Referred By:</strong> ${referralInfo.referrer_name} (${referralInfo.referrer_email})</p>
                                <p style="margin:4px 0;color: ${commissionEligible ? '#2f855a' : '#c05621'}; font-weight:bold;">
                                    Status: ${commissionEligible ? '✅ ELIGIBLE (Earn 20%)' : '⚠️ CAP REACHED (No payment)'}
                                </p>
                            ` : ''}
                            ${validReferralCode && !referralInfo && referrer_name ? `
                                <p style="margin:4px 0;"><strong>Referred By (Legacy):</strong> ${referrer_name} (${referrer_email || 'N/A'})</p>
                            ` : ''}
                        </div>
                    </div>
                `,
            });

            // Send Confirmation to Client
            const clientSubject = isWaitlist
                ? 'You\'re on the waitlist! – Atharva Sherlekar Art'
                : 'Commission Request Received – Atharva Sherlekar Art';

            const pricingHtml = `
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
                    <h3 style="margin-top: 0; font-size: 16px;">Price Breakdown</h3>
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px;">
                        <li style="margin-bottom: 5px;">Base Price (${size}): <strong>₹${basePriceForOne}</strong></li>
                        ${Number(number_of_people) > 1 ? `<li style="margin-bottom: 5px;">Additional People: <strong>₹${additionalPeopleCost}</strong></li>` : ''}
                        ${detailed_background ? '<li style="margin-bottom: 5px;">Detailed Background: <strong>₹500</strong></li>' : ''}
                        ${timelapse_recording ? '<li style="margin-bottom: 5px;">Timelapse Recording: <strong>₹500</strong></li>' : ''}
                        ${framing ? `<li style="margin-bottom: 5px;">Professional Framing: <strong>₹${framingCost}</strong></li>` : ''}
                        ${rushFee > 0 ? `<li style="margin-bottom: 5px; color: #d97706; font-weight: bold;">Artist Rush Fee (15–19 Days): <strong>+₹${rushFee}</strong></li>` : ''}
                        <li style="margin-top: 10px; border-top: 1px solid #ddd; pt: 10px; font-size: 18px;">Total: <strong>₹${totalAmount}</strong></li>
                    </ul>
                </div>
            `;

            const clientHtml = isWaitlist ? `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;line-height:1.5;">
                    <h1>You're on the waitlist!</h1>
                    <p>Hi ${name},</p>
                    <p>Thank you for joining the waitlist! My current review slots are full, but I have received your request and reserved a spot for you in line.</p>
                    
                    ${pricingHtml}

                    <p><strong>Reservation Details:</strong></p>
                    <ul>
                        <li><strong>Reservation Fee:</strong> ₹${Math.round(totalAmount * 0.25)} (25% Deposit to hold your slot)</li>
                        <li><strong>Reference Photo:</strong> I have received your attachment(s). I will review the quality and confirm if they work for the portrait!</li>
                        <li><strong>Next Steps:</strong> I will contact you within 48 hours to confirm your spot.</li>
                    </ul>
                    <p>I estimate I will be able to begin working on your piece next month. I will contact you to collect the remaining 25% advance when it's your turn!</p>
                    <br />
                    <p>Best regards,</p>
                    <p><strong>Atharva Sherlekar Art</strong></p>
                </div>
            ` : `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;line-height:1.5;">
                    <h1>Request Received</h1>
                    <p>Hi ${name},</p>
                    <p>Thank you for your commission request!</p>
                    <p>I have received your details for a <strong>${size}</strong> portrait of <strong>${number_of_people} people</strong>.</p>
                    
                    ${pricingHtml}

                    <p><strong>Next Steps:</strong></p>
                    <ul>
                        <li><strong>Photo Review:</strong> I have received your reference photo(s). I will review the quality and discussion the timeline shortly!</li>
                        <li><strong>Acceptance & Payment:</strong> Once accepted, a <strong>50% deposit payment link</strong> (₹${Math.round(totalAmount * 0.5)}) will be generated for you.</li>
                        <li><strong>Notification:</strong> You will receive an email with the payment link once your request is approved. It will also be available on your dashboard below.</li>
                    </ul>
                    <div style="margin-top: 20px; padding: 15px; background: #f0f7ff; border-radius: 8px; border: 1px solid #c2e0ff; text-align: center;">
                        <p style="margin: 0 0 10px; font-size: 14px; color: #0052cc;"><strong>TRACK YOUR ORDER ANYTIME</strong></p>
                        <a href="${getBaseUrl()}/client/dashboard" style="display: inline-block; background: #007bff; color: white; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold;">GO TO CLIENT DASHBOARD →</a>
                    </div>
                    <br />
                    <p>Best regards,</p>
                    <p><strong>Atharva Sherlekar Art</strong></p>
                </div>
            `;

            // Client confirmation via Gmail SMTP
            await sendEmail({
                to: email,
                subject: clientSubject,
                html: clientHtml,
            });

            // Send Initial Notification to Referrer
            if (validReferralCode && commissionEligible && (referralInfo || referrer_email)) {
                try {
                    const toEmail = referralInfo ? referralInfo.referrer_email : referrer_email;
                    const rName = referralInfo ? referralInfo.referrer_name : referrer_name;

                    const estimatedBasePriceStr = await getPriceForSize(size as 'A5' | 'A4' | 'A3' | 'A2');
                    const estimatedBasePrice = estimatedBasePriceStr ? parseInt(estimatedBasePriceStr.replace('₹', '').replace(',', ''), 10) : 0;
                    const estimatedTotalPrice = calculatePortraitPrice(estimatedBasePrice, Number(number_of_people), size as 'A5' | 'A4' | 'A3' | 'A2');
                    const estimatedCommissionableAmt = estimatedTotalPrice + (detailed_background ? 500 : 0);
                    const estimatedCommission = estimatedCommissionableAmt > 0 ? (estimatedCommissionableAmt * 0.20) : 0;

                    await sendEmail({
                        to: toEmail as string,
                        subject: 'Someone used your referral link! 👀 – Atharva Sherlekar Art',
                        html: `
                            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;line-height:1.5;">
                                <h1>Great news, ${rName}!</h1>
                                <p><strong>${name}</strong> just submitted a commission request using your referral link!</p>
                                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin-top: 0;"><strong>⚠️ Important Note:</strong></p>
                                    <p style="margin-bottom: 0;">This request is currently pending the artist's review. Once the portrait is accepted, completed, and fully paid for, your 20% commission (estimated at roughly <strong>₹${estimatedCommission}</strong>) will be unlocked and available in your dashboard!</p>
                                </div>
                                <p>You can track the status of this referral anytime by logging into your dashboard on the website.</p>
                                <br />
                                <p>Thank you for helping spread the word!</p>
                                <p>Best regards,</p>
                                <p><strong>Atharva Sherlekar Art</strong></p>
                            </div>
                        `,
                    });
                } catch (referrerNotifyError) {
                    console.warn('Initial referrer notification failed (non-fatal):', referrerNotifyError);
                }
            }

            // Send Expiration Notification if link just expired
            if (validReferralCode && referralInfo && justExpired) {
                try {
                    await sendEmail({
                        to: referralInfo.referrer_email,
                        subject: 'Referral Link Expired – Atharva Sherlekar Art',
                        html: `
                            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;line-height:1.5;">
                                <h1>Referral Link Expired</h1>
                                <p>Hi ${referralInfo.referrer_name},</p>
                                <p>Your referral link has reached its maximum limit of 3 successful commissions and is now expired.</p>
                                <p><strong>Generate a new referral link to continue earning commission.</strong></p>
                                <p>Visit the website to create a new link anytime.</p>
                                <br />
                                <p>Thank you for helping spread the word!</p>
                                <p>Best regards,</p>
                                <p><strong>Atharva Sherlekar Art</strong></p>
                            </div>
                        `,
                    });
                } catch (expirationEmailError) {
                    console.warn('Expiration notification failed (non-fatal):', expirationEmailError);
                }
            }
        } catch (emailError: unknown) {
            console.error('Email Sending Error (Non-fatal since commission is saved):', emailError);
        }

        return NextResponse.json({ success: true, status: commissionStatus });

    } catch (err) {
        console.error('Handler Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
