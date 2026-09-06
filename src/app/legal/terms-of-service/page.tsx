export const metadata = {
    title: "Terms of Service | Atharva Sherlekar Art",
    description: "Terms and conditions for commissioning custom artwork from Atharva Sherlekar.",
};

export default function TermsOfService() {
    return (
        <article>
            <h1 className="text-4xl font-serif mb-8">Terms of Service</h1>
            <p className="mb-8 opacity-60">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

            <section className="space-y-6">
                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">1. Acceptance of Terms</h2>
                    <p className="leading-relaxed">
                        By placing a commission request or making any advance payment (whether the 50% active deposit or the 25% waitlist reservation fee) through this website, you agree to be bound by these Terms of Service. Please read them carefully before confirming your order.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">2. The Commission Process</h2>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li><strong>Reference Quality & Custom Poses:</strong> The hyper-realistic outcome relies heavily on the quality and angle of the reference photograph provided. Blurry, heavily filtered, or low-resolution images will be rejected. If you request a custom pose, composite artwork, or reimagined scene without a single direct reference photo in that exact pose (requiring the artist to extrapolate from multiple photos), exact 100% photographic accuracy cannot be guaranteed, and you agree to accept artistic interpretation based on observational drawing.</li>
                        <li><strong>Updates & Revision Limits:</strong> You will receive progress updates during the creation of your portrait. Minor adjustments can be made during early stages. However, because traditional hand-drawn artwork on physical paper suffers structural damage from repeated friction, a maximum of 2 to 3 minor revisions per area is permitted. Repeated erasing or redrawing on the same section beyond 3 to 4 attempts will not be accommodated, as excessive erasing degrades paper quality, surface tooth, and final rendering.</li>
                        <li><strong>Timeline & Deadlines:</strong> Standard portrait creation typically requires 15 to 30 days. Requesting a target delivery deadline between 15 and 19 days from the booking date is classified as a Rush Order and is subject to a +30% Artist Rush Fee to prioritize artwork creation, packaging, and handling. Direct online bookings for deadlines under 15 days are disabled; clients requiring emergency turnaround (&lt; 15 days) must contact the artist via Instagram DM (@atharva_sherlekar_art) to check custom slot availability.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">3. Copyright & Intellectual Property</h2>
                    <p className="leading-relaxed">
                        Understanding the distinction between physical ownership and copyright is crucial:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li><strong>Physical Ownership & No-Returns:</strong> Upon full payment of the balance and shipping fees, you own the physical original artwork. You may display it in your home or privately gift it. Because each portrait is custom-made by hand and physical repackaging risks severe damage in transit, all delivered artworks are strictly non-returnable and non-exchangeable.</li>
                        <li><strong>Artist Copyright:</strong> The artist, Atharva Sherlekar, retains full copyright and all underlying reproductive rights to the image itself. <strong>You may not reproduce, print, copy, distribute, or use the artwork for any commercial or monetary gaining purpose.</strong></li>
                        <li><strong>Portfolio Rights:</strong> The artist retains the right to display photographs or scans of the completed artwork in their electronic portfolio, on social media platforms, or in promotional materials. However, if the portrait is a surprise gift, the artist will gladly hold off on posting it publicly until the designated date of the event. (Client reference photos remain strictly private as per my Privacy Policy).</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">4. Payment Terms</h2>
                    <p className="leading-relaxed">
                        All payments are processed securely via third-party gateways (e.g., Razorpay). Prices are listed in INR (Indian Rupees), and international clients may be subject to standard currency conversion rates applied by their bank or card issuer at the time of checkout.
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li><strong>Active Slots:</strong> A 50% advance is required to confirm your commission and begin the drawing process. The remaining 50% plus shipping is due on completion.</li>
                        <li><strong>Waitlist Reservations:</strong> A 25% Slot Reservation Fee is required to hold your place. When a slot opens up, you will be contacted for the remaining 25% advance before work begins. The final 50% plus shipping is due on completion.</li>
                        <li><strong>Artist Rush Fees:</strong> For rush commissions (15 to 19 days turnaround), a 30% Artist Rush Fee is calculated on the portrait base price (including additional face/person counts) and added to the total commission subtotal prior to deposit calculation.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">5. Referral Program & Payouts</h2>
                    <p className="leading-relaxed">
                        My referral program is open to users worldwide. By participating, you agree to the following:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li><strong>Global Participation:</strong> Anyone can generate a referral link, regardless of their location.</li>
                        <li><strong>Payout Methods:</strong> I process referral commission payouts via UPI or Indian Bank Transfers for domestic users. For international referrers, payouts are securely processed via Wise.</li>
                        <li><strong>Payment Details:</strong> You are responsible for providing accurate payout information (e.g., UPI ID, bank details, or Wise email) when requesting a withdrawal.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">6. User Conduct & Moderation</h2>
                    <p className="leading-relaxed">
                        To maintain the integrity of my commission process, I enforce strict rules regarding user conduct:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li><strong>Prohibited Activity:</strong> Submitting spam, test, or intentionally misleading commission requests is strictly prohibited. This includes providing false contact information or multiple &quot;false form submissions.&quot;</li>
                        <li><strong>Moderation:</strong> Failure to comply with these rules may result in the temporary or permanent restriction of your account and device. Moderation actions include mutes (24 hours to 1 month) or permanent bans.</li>
                        <li><strong>Appeals:</strong> If you believe a restriction has been placed in error, you must contact me via <strong>Instagram DM (@atharva_sherlekar_art)</strong>. Direct communication is required for all restriction-related appeals.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">7. Revisions to Terms</h2>
                    <p className="leading-relaxed">
                        Atharva Sherlekar Art reserves the right, at my sole discretion, to modify or replace these Terms at any time. Significant changes will be communicated via top-level website announcements.
                    </p>
                </div>

            </section>
        </article>
    );
}
