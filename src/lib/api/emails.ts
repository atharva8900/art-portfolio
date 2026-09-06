import { sendEmail } from '@/lib/api/email';
import { CommissionData } from '@/lib/db/commissions';
import { sendDiscordNotification } from '@/lib/api/discord';
import { escapeHtml, stripHtmlTags } from '@/lib/utils/security';
import { getBaseUrl } from '@/lib/utils/utils';



function stripHtml(html: string): string {
    return stripHtmlTags(html);
}

export async function sendCommissionStatusEmail(commission: CommissionData, status: string) {
    let subject = '';
    let htmlContent = '';

    const baseUrl = getBaseUrl();

    switch (status) {
        case 'pending':
            subject = 'Your Commission is under review! – Atharva Sherlekar Art';
            htmlContent = `
                <h1>Reviewing your request</h1>
                <p>Hi ${commission.client_name},</p>
                <p>Your commission request has been moved to the <strong>Review Queue</strong>.</p>
                <p>Atharva will review your details within 48 hours and contact you if any further information is needed or to confirm acceptance.</p>
                <br/>
                <p>Check your order status anytime on the <a href="${baseUrl}/client/dashboard">Commission Page</a>.</p>
                <p>Best regards,</p>
                <p><strong>Atharva Sherlekar</strong></p>
            `;
            break;
        case 'accepted':
            subject = 'Your Commission Slot is Ready! – Atharva Sherlekar Art';
            const hasLink = !!commission.razorpay_payment_link_url;
            htmlContent = `
                <h1>Good news—your slot is ready!</h1>
                <p>Hi ${commission.client_name},</p>
                <p>A slot has opened up for you!</p>
                <p>To begin the artwork, please pay the <strong>50% advance deposit</strong>. Add-ons and delivery will be charged in the final invoice.</p>
                
                ${hasLink ? `
                <div style="margin: 25px 0; padding: 25px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center;">
                    <p style="margin: 0 0 15px; font-weight: bold; color: #0f172a;">Complete your deposit to secure your slot:</p>
                    <a href="${commission.razorpay_payment_link_url}" style="display: inline-block; background: #D4AF37; color: black; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">PAY DEPOSIT SECURELY →</a>
                    <p style="margin: 15px 0 0; font-size: 12px; color: #64748b;">Link powered by Razorpay. Secure and encrypted.</p>
                </div>
                ` : `
                <p>Atharva will reach out to you shortly via DM or Email with your custom payment link to officially start your commission.</p>
                `}
                
                <br/>
                <p>Check your order status anytime on the <a href="${baseUrl}/client/dashboard">Commission Page</a>.</p>
                <p>Best regards,</p>
                <p><strong>Atharva Sherlekar</strong></p>
            `;
            break;
        case 'in_progress':
            subject = 'Drawing Started! – Atharva Sherlekar Art';
            htmlContent = `
                <h1>Payment Received</h1>
                <p>Hi ${commission.client_name},</p>
                <p>Your payment has been received and Atharva has officially <strong>started drawing</strong> your commission!</p>
                <p>I'm excited to bring your vision to life. I will keep you updated if I have any questions during the process.</p>
                <br/>
                <p>Check progress anytime on the <a href="${baseUrl}/client/dashboard">Commission Page</a>.</p>
                <p>Best regards,</p>
                <p><strong>Atharva Sherlekar</strong></p>
            `;
            break;
        case 'redrawing':
            subject = 'Your Redraw has Started! (70% Discount Applied) – Atharva Sherlekar Art';
            const hasRedrawLink = !!commission.razorpay_payment_link_url;
            htmlContent = `
                <h1>Redraw in Progress</h1>
                <p>Hi ${commission.client_name},</p>
                <p>Atharva has officially approved and queued your <strong>portrait redraw</strong> with a 70% discount applied to the total value of your artwork (you only pay 30% of the total value).</p>
                
                ${hasRedrawLink ? `
                <div style="margin: 25px 0; padding: 25px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; text-align: center;">
                    <p style="margin: 0 0 15px; font-weight: bold; color: #92400e;">Complete your 70% discounted redraw payment:</p>
                    <a href="${commission.razorpay_payment_link_url}" style="display: inline-block; background: #D4AF37; color: black; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">PAY REDRAW BALANCE (70% OFF) →</a>
                    <p style="margin: 15px 0 0; font-size: 12px; color: #64748b;">Link powered by Razorpay. Secure and encrypted.</p>
                </div>
                ` : `
                <p>You can view your commission status and payment details anytime on your <a href="${baseUrl}/client/dashboard">Commission Dashboard</a>.</p>
                `}
                
                <p>I will share work-in-progress (WIP) updates as your new piece comes to life.</p>
                <br/>
                <p>Best regards,</p>
                <p><strong>Atharva Sherlekar</strong></p>
            `;
            break;
        case 'finished':
            subject = 'Your Artwork is Finished! Final Approval & Invoice – Atharva Sherlekar Art';
            const hasFinalLink = !!commission.final_payment_link_url;
            htmlContent = `
                <h1>Your Artwork is Ready!</h1>
                <p>Hi ${commission.client_name},</p>
                <p>Great news! The drawing is <strong>officially complete</strong>.</p>
                <p>Atharva will be sending you a picture of the final sketch for your <strong>approval</strong> shortly. Please check your email or DM for the image.</p>
                <p>Your <strong>final invoice</strong> is now ready. It includes:</p>
                <ul>
                    <li>The remaining 50% of the portrait price</li>
                    <li>Any add-ons (Detailed background/Timelapse)</li>
                    <li>Actual Delivery/Shipping costs via DTDC</li>
                </ul>
                
                ${hasFinalLink ? `
                <div style="margin: 25px 0; padding: 25px; background: #fdf9f0; border: 1px solid #eee1c1; border-radius: 12px; text-align: center;">
                    <p style="margin: 0 0 15px; font-weight: bold; color: #856404;">Complete your final payment to ship your artwork:</p>
                    <a href="${commission.final_payment_link_url}" style="display: inline-block; background: #D4AF37; color: black; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">PAY FINAL BALANCE →</a>
                    <p style="margin: 15px 0 0; font-size: 12px; color: #64748b;">Link powered by Razorpay. Secure and encrypted.</p>
                </div>
                ` : `
                <p>You can view the invoice and pay the final balance securely via your <a href="${baseUrl}/client/dashboard">Client Dashboard</a>.</p>
                `}
                
                <p>Once the final payment is cleared, I will ship your artwork immediately!</p>
                <br/>
                <p>Best regards,</p>
                <p><strong>Atharva Sherlekar</strong></p>
            `;
            break;
        case 'on_delivery':
            subject = 'Your Artwork has been Shipped! 🚚 – Atharva Sherlekar Art';
            htmlContent = `
                <h1>It\'s on the way!</h1>
                <p>Hi ${commission.client_name},</p>
                <p>Your artwork has been carefully packed and <strong>handed over to DTDC for delivery</strong>.</p>
                <p><strong>Please do let me know once the artwork reaches you!</strong></p>
                <p>Thank you for your patience and for letting me create this for you!</p>
                <br/>
                <p>Best regards,</p>
                <p><strong>Atharva Sherlekar</strong></p>
            `;
            break;
        case 'completed':
            subject = 'Your Artwork has Arrived! 🎨📦 (Important Unboxing Instructions) – Atharva Sherlekar Art';
            const basePrice = Number(commission.base_price || 0);
            const extrasTotal = Number(commission.extras_total || 0);
            const rushFee = Number(commission.rush_fee || 0);
            const shippingCost = Number(commission.shipping_cost || 0);
            const subtotal = (basePrice + extrasTotal + rushFee) || Number(commission.commission_amount || 0);
            const totalPaid = subtotal + shippingCost;

            const extrasList: string[] = [];
            if (commission.framing) extrasList.push('Frame & Mount Protection');
            if (commission.detailed_background) extrasList.push('Detailed Background');
            if (commission.timelapse_recording) extrasList.push('Timelapse Video Recording');
            if (commission.rush_fee && commission.rush_fee > 0) extrasList.push(`Rush Order Processing (₹${commission.rush_fee.toLocaleString('en-IN')})`);

            const isFramed = !!commission.framing;

            htmlContent = `
                <h1>Your Artwork has Arrived!</h1>
                <p>Hi ${escapeHtml(commission.client_name)},</p>
                <p>Your hand-drawn commission has officially arrived! Thank you so much for commissioning me, I truly hope you love the final ${isFramed ? 'framed ' : ''}piece.</p>
                
                <div style="margin: 25px 0; padding: 22px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <h2 style="margin: 0 0 12px; font-size: 16px; color: #0f172a; display: flex; align-items: center;">
                        📦 Before You Open: Please Record a Continuous Unboxing Video
                    </h2>
                    <p style="margin: 0 0 14px; font-size: 14px; line-height: 1.5; color: #334155;">
                        Because each artwork is an original, delicate hand-drawn piece, <strong>I require a continuous, uncut unboxing video</strong> to verify any transit claims:
                    </p>
                    <ol style="margin: 0 0 16px; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #334155;">
                        <li style="margin-bottom: 6px;"><strong>Take a photo of the parcel:</strong> Snap a quick photo of the sealed package and send it to me in my DMs or email.</li>
                        <li style="margin-bottom: 6px;"><strong>Record Continuous Unboxing:</strong> Record a single, uncut video from start to finish as you unwrap the package. (You can prop your phone on a stand, place it overhead, or have someone record for you so everything is clearly in frame).</li>
                        <li style="margin-bottom: 6px;"><strong>Inspect the Piece:</strong> Show the ${isFramed ? 'artwork and frame' : 'drawing'} clearly on camera under good lighting.</li>
                    </ol>

                    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-top: 10px;">
                        <p style="margin: 0 0 8px; font-weight: 700; font-size: 13px; color: #0f172a;">My Transit Guarantee:</p>
                        <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.6; color: #475569;">
                            ${isFramed ? `
                            <li style="margin-bottom: 4px;"><strong>Framed Artwork:</strong> If the frame or glass arrived damaged during transit, send me the video and <strong>I will promptly refund your full framing charges</strong> so you can have it reframed locally.</li>
                            ` : ''}
                            <li style="margin-bottom: 4px;"><strong>Water / Rain Damage:</strong> In the rare event that rain or liquid leaked into the package during transit and ruined the drawing, <strong>I will issue a 100% full refund</strong>, and if you want the artwork redrawn, <strong>I will offer a complete redraw at a 70% discount of its total value</strong> (you only pay 30%).</li>
                            <li style="margin-bottom: 4px;"><strong>Please Note:</strong> Drawings are packed between rigid protective boards, so folds or creases cannot occur in transit and are not eligible for refunds. If you choose not to record an unboxing video, I cannot verify that damage occurred during transit and will not be able to offer any refunds or redraws.</li>
                        </ul>
                    </div>
                </div>

                <div style="margin: 25px 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <div style="background-color: #0f172a; color: #ffffff; padding: 18px 24px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td>
                                    <h3 style="margin: 0; font-size: 15px; font-weight: 700; letter-spacing: 0.5px; color: #ffffff;">FINAL INVOICE & RECEIPT</h3>
                                    <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">Order ID: #${escapeHtml(commission.id.slice(0, 8).toUpperCase())}</p>
                                </td>
                                <td style="text-align: right;">
                                    <span style="display: inline-block; background-color: #10b981; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">Paid in Full</span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div style="padding: 20px 24px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
                            <tbody>
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 10px 0; font-weight: 500;">
                                        Custom Portrait (${escapeHtml(commission.size || 'Standard')}, ${escapeHtml(commission.number_of_people || '1')} Person${Number(commission.number_of_people) > 1 ? 's' : ''})
                                    </td>
                                    <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #0f172a;">
                                        ₹${basePrice > 0 ? basePrice.toLocaleString('en-IN') : subtotal.toLocaleString('en-IN')}
                                    </td>
                                </tr>
                                ${extrasList.map(extra => `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 8px 0; color: #64748b; font-size: 13px;">+ ${escapeHtml(extra)}</td>
                                    <td style="padding: 8px 0; text-align: right; font-size: 13px; color: #64748b;">Included</td>
                                </tr>
                                `).join('')}
                                ${shippingCost > 0 ? `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 10px 0; color: #475569;">Delivery / Shipping (DTDC Express)</td>
                                    <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #0f172a;">₹${shippingCost.toLocaleString('en-IN')}</td>
                                </tr>
                                ` : `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 10px 0; color: #475569;">Delivery / Shipping (DTDC Express)</td>
                                    <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #10b981;">FREE</td>
                                </tr>
                                `}
                                <tr>
                                    <td style="padding: 14px 0 6px; font-size: 16px; font-weight: 700; color: #0f172a;">Total Amount Paid</td>
                                    <td style="padding: 14px 0 6px; text-align: right; font-size: 18px; font-weight: 800; color: #0f172a;">₹${totalPaid.toLocaleString('en-IN')}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div style="margin-top: 18px; padding-top: 15px; border-top: 1px dashed #cbd5e1; text-align: center;">
                            <p style="margin: 0 0 10px; font-size: 12px; color: #64748b;">You can also view your full commission history & download the official PDF invoice anytime from your dashboard.</p>
                            <a href="${baseUrl}/client/dashboard" style="display: inline-block; background-color: #D4AF37; color: #000000; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 700; letter-spacing: 0.3px;">VIEW DASHBOARD & INVOICE →</a>
                        </div>
                    </div>
                </div>

                <p>Best regards,</p>
                <p><strong>Atharva Sherlekar</strong></p>
            `;
            break;
        case 'rejected':
            subject = 'Update regarding your commission request – Atharva Sherlekar Art';
            htmlContent = `
                <h1>Update on your request</h1>
                <p>Hi ${commission.client_name},</p>
                <p>Thank you for your interest in my work. After reviewing your request, I'm unable to take on this commission at this time.</p>
                
                ${commission.admin_note ? `
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #991b1b; font-weight: bold;">Note from the Artist:</p>
                    <p style="margin: 5px 0 0; color: #b91c1c;">${escapeHtml(commission.admin_note)}</p>
                </div>
                ` : ''}

                <p>I appreciate your understanding. Feel free to check back in the future when slots reopen!</p>
                <br/>
                <p>Best regards,</p>
                <p><strong>Atharva Sherlekar</strong></p>
            `;
            break;
        case 'cancelled':
            subject = 'Commission Cancelled & Refund Refined – Atharva Sherlekar Art';
            htmlContent = `
                <h1>Commission Cancelled</h1>
                <p>Hi ${commission.client_name},</p>
                <p>Your commission has been <strong>cancelled</strong> and a full refund has been initiated to your original payment method.</p>
                <p>Refunds typically take <strong>5-7 business days</strong> to reflect in your account, depending on your bank.</p>
                <p>Thank you for your interest, and I hope to work with you again in the future!</p>
                <br/>
                <p>Best regards,</p>
                <p><strong>Atharva Sherlekar</strong></p>
            `;
            break;
        case 'payment_fully_paid':
            subject = 'Full Payment Received! – Atharva Sherlekar Art';
            htmlContent = `
                <h1>Payment Received!</h1>
                <p>Hi ${commission.client_name},</p>
                <p>I've successfully received the <strong>final payment</strong> for your commission.</p>
                <p>Thank you so much! I'm now preparing your artwork for shipment. I'll notify you once it's on the way!</p>
                <br/>
                <p>Check status anytime on the <a href="${baseUrl}/client/dashboard">Commission Page</a>.</p>
                <p>Best regards,</p>
                <p><strong>Atharva Sherlekar</strong></p>
            `;
            break;
        default:
            return null;
    }

    // Push to Discord first (Manual Fallback)
    await sendDiscordNotification({
        content: `**Action Required: Manual Email Send**\nClient: **${commission.client_name}** (<${commission.client_email}>)\nStatus Update: **${status.toUpperCase()}**`,
        embeds: [{
            title: `Subject: ${subject}`,
            description: `\`\`\`\n${stripHtml(htmlContent)}\n\`\`\``,
            color: 0x00ff00,
            footer: { text: 'Copy the content above and send it to the client.' }
        }]
    });

    // Attempt automated send via Gmail SMTP
    try {
        const { data, error } = await sendEmail({
            to: commission.client_email,
            bcc: status === 'cancelled' ? process.env.NEXT_PUBLIC_ARTIST_EMAIL : undefined,
            subject,
            html: htmlContent,
        });
        return { data, error };
    } catch (e) {
        console.error('Email send failed:', e);
        return { error: e };
    }
}
