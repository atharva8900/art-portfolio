import { Resend } from 'resend';
import { CommissionData } from './commissions';
import { sendDiscordNotification } from './discord';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    switch (status) {
        case 'pending':
            subject = 'Your Commission is under review! – Atharva Sherlekar Art';
            htmlContent = `
                <h1>Reviewing your request</h1>
                <p>Hi ${commission.client_name},</p>
                <p>Your commission request has been moved to the <strong>Review Queue</strong>.</p>
                <p>Atharva will review your details within 48 hours and contact you if any further information is needed or to confirm acceptance.</p>
                <br/>
                <p>Check your order status anytime on the <a href="https://atharvasherlekar.com/commission">Commission Page</a>.</p>
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
                <p>Check your order status anytime on the <a href="https://atharvasherlekar.com/commission">Commission Page</a>.</p>
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
                <p>We're excited to bring your vision to life. We will keep you updated if we have any questions during the process.</p>
                <br/>
                <p>Check progress anytime on the <a href="https://atharvasherlekar.com/commission">Commission Page</a>.</p>
                <p>Best regards,</p>
                <p><strong>Atharva Sherlekar</strong></p>
            `;
            break;
        case 'on_delivery':
            subject = 'Your Artwork is Finished! Final Details – Atharva Sherlekar Art';
            htmlContent = `
                <h1>Your Artwork is Ready!</h1>
                <p>Hi ${commission.client_name},</p>
                <p>The drawing is <strong>complete</strong>! We are now preparing it for delivery.</p>
                <p>Atharva has sent you the <strong>final invoice</strong> via our previous communication channel, which includes:</p>
                <ul>
                    <li>The remaining 50% of the portrait price</li>
                    <li>Add-ons (Detailed background/Timelapse)</li>
                    <li>Delivery/Shipping costs</li>
                </ul>
                <p>Once the final payment is cleared, we will ship your artwork and update you with the tracking details.</p>
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
                <p>Thank you so much for choosing Atharva's art. We hope you love the final result.</p>
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

    // Attempt automated send via Resend (might fail if domain unverified)
    try {
        const { data, error } = await resend.emails.send({
            from: 'Atharva Sherlekar Art <onboarding@resend.dev>',
            to: commission.client_email,
            subject,
            html: htmlContent,
        });
        return { data, error };
    } catch (e) {
        console.error('Email send failed:', e);
        return { error: e };
    }
}
