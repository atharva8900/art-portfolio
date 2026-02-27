import { Resend } from 'resend';
import { CommissionData } from './commissions';

const resend = new Resend(process.env.RESEND_API_KEY);

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
                <p>Check your order status anytime on the <a href="https://atharvasherlekar.com/commission text-neutral-400">Commission Page</a>.</p>
                <p>Best regards,</p>
                <p><strong>Atharva Sherlekar</strong></p>
            `;
            break;
        case 'accepted':
            // subject and content for accepted status
            subject = 'Your Commission Slot is Ready! – Atharva Sherlekar Art';
            htmlContent = `
                <h1>Good news—your slot is ready!</h1>
                <p>Hi ${commission.client_name},</p>
                <p>A slot has opened up for you!</p>
                <p>To begin the artwork, please pay the <strong>remaining advance</strong> (to hit 50% total). Add-ons and delivery will be charged in the final invoice.</p>
                <p>Atharva will reach out to you shortly via DM or Email with the payment link to officially start your commission.</p>
                <br/>
                <p>Check your order status anytime on the <a href="https://atharvasherlekar.com/commission text-neutral-400">Commission Page</a>.</p>
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
                <p>Check progress anytime on the <a href="https://atharvasherlekar.com/commission text-neutral-400">Commission Page</a>.</p>
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
        default:
            return null;
    }

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
