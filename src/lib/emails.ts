import { sendEmail } from './email';
import { CommissionData } from './commissions';
import { sendDiscordNotification } from './discord';



function stripHtml(html: string): string {
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export async function sendCommissionStatusEmail(commission: CommissionData, status: string) {
    let subject = '';
    let htmlContent = '';

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
        (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000');

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
            htmlContent = `
                <h1>Good news—your slot is ready!</h1>
                <p>Hi ${commission.client_name},</p>
                <p>A slot has opened up for you!</p>
                <p>To begin the artwork, please pay the <strong>remaining advance</strong> (to hit 50% total). Add-ons and delivery will be charged in the final invoice.</p>
                <p>Atharva will reach out to you shortly via DM or Email with the payment link to officially start your commission.</p>
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
        case 'finished':
            subject = 'Your Artwork is Finished! Final Approval & Invoice – Atharva Sherlekar Art';
            htmlContent = `
                <h1>Your Artwork is Ready!</h1>
                <p>Hi ${commission.client_name},</p>
                <p>Great news! The drawing is <strong>officially complete</strong>.</p>
                <p>Atharva will be sending you a picture of the final sketch for your <strong>approval</strong> shortly. Please check your email or DM for the image.</p>
                <p>Your <strong>final invoice</strong> is now ready on your dashboard. It includes:</p>
                <ul>
                    <li>The remaining 50% of the portrait price</li>
                    <li>Any add-ons (Detailed background/Timelapse)</li>
                    <li>Actual Delivery/Shipping costs via DTDC</li>
                </ul>
                <p>You can view the invoice and pay the final balance securely via your <a href="${baseUrl}/client/dashboard">Client Dashboard</a>.</p>
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
            subject = 'Enjoy your artwork! – Atharva Sherlekar Art';
            htmlContent = `
                <h1>Commission Completed</h1>
                <p>Hi ${commission.client_name},</p>
                <p>Your commission has been marked as <strong>completed</strong>!</p>
                <p>Thank you so much for choosing my art. I hope you love the final result.</p>
                <br/>
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
                    <p style="margin: 5px 0 0; color: #b91c1c;">${commission.admin_note}</p>
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

    // Inject artist note into other templates if present (except rejected which already has it)
    if (status !== 'rejected' && commission.admin_note && !htmlContent.includes(commission.admin_note)) {
        const noteHtml = `
            <div style="background-color: #f8fafc; border-left: 4px solid #64748b; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #334155; font-weight: bold;">Note from the Artist:</p>
                <p style="margin: 5px 0 0; color: #475569;">${commission.admin_note}</p>
            </div>
        `;
        // Insert before "Best regards"
        htmlContent = htmlContent.replace('<p>Best regards,</p>', noteHtml + '<p>Best regards,</p>');
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
