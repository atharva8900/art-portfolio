export const metadata = {
    title: "Refund & Cancellation Policy | Atharva Sherlekar Art",
    description: "Refund, cancellation, and damage policy for custom portrait commissions by Atharva Sherlekar.",
};

export default function RefundPolicy() {
    return (
        <article>
            <h1 className="text-4xl font-serif mb-8">Refund &amp; Cancellation Policy</h1>
            <p className="mb-8 opacity-60">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

            <section className="space-y-6">
                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">1. Booking Guidelines &amp; Advance Payment</h2>
                    <h3 className="text-lg font-serif text-foreground mt-4 mb-2">Active Commission Slots:</h3>
                    <p className="leading-relaxed">
                        To secure an active commission slot and commence the drawing process, a non-refundable advance payment of <strong>50% of the total portrait price</strong> is strictly required. Your slot is not confirmed until this advance is received. The remaining 50% balance, plus shipping costs, becomes due upon the final completion of the portrait, prior to dispatch.
                    </p>
                    <h3 className="text-lg font-serif text-foreground mt-6 mb-2">Waitlist Slot Reservations:</h3>
                    <p className="leading-relaxed">
                        When all active slots are full, you may reserve a waitlist slot by paying a <strong>25% Slot Reservation Fee</strong> (deducted from the total portrait price). This fee holds your place in the queue for the next available batch. When a slot opens up and the artist is ready to begin your piece, you will be contacted to pay the <strong>remaining 25% advance</strong>. The final 50% balance, plus shipping costs, is due upon completion.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">2. The 48-Hour Cancellation Window</h2>
                    <p className="leading-relaxed">
                        We understand that circumstances can change. The cancellation grace period applies <strong>only to your very first (initial) payment</strong> — whether that is the 50% active deposit or the 25% waitlist reservation fee.
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li><strong>Within 48 Hours of Initial Payment:</strong> If you decide to cancel within exactly 48 hours of making your first payment, you are entitled to a <strong>100% full refund</strong> of that amount. The slot will be released.</li>
                        <li><strong>After 48 Hours of Initial Payment:</strong> Once this window has passed, the initial payment becomes <strong>completely non-refundable</strong>. Your reservation or slot is locked in.</li>
                        <li><strong>Subsequent Payments (Waitlist Clients Only):</strong> When your waitlist slot is confirmed and you make the second 25% payment to begin work, this authorises the artist to start drawing immediately. <strong>This payment and all previously made payments are non-refundable from the moment of transfer.</strong> No new cancellation window is opened. By paying, you are confirming your full commitment to the commission.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">3. Completed Artworks</h2>
                    <p className="leading-relaxed">
                        Due to the deeply personal and custom-made nature of hand-drawn portraits, <strong>no refunds, returns, or exchanges are accepted once the final artwork has been completed</strong>, approved by the client via photograph, and prepared for shipping or dispatched.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">4. Liability &amp; Circumstances During Creation</h2>
                    <p className="leading-relaxed">
                        If, for any unforeseen reason or due to an error during the drawing process, the artist (Atharva Sherlekar) accidentally compromises, ruins, or is entirely unable to fulfill your commission after work has begun:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li>You will be notified immediately.</li>
                        <li>You will receive a <strong>100% full refund</strong> of all advance payments made (whether the 50% active deposit or the 25% reservation fee plus any additional advance collected), as the failure to deliver stems entirely from an artist-side default.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">5. Damaged in Transit (Courier Liability)</h2>
                    <p className="leading-relaxed">
                        Considerable care and high-quality packaging materials are used to ensure your portrait arrives safely. However, we cannot directly control the handling practices of third-party shipping carriers (e.g., DTDC, DHL, postal services).
                    </p>
                    <p className="leading-relaxed mt-4">
                        If your package arrives visibly damaged, you must:
                    </p>
                    <ol className="list-decimal pl-6 mt-2 space-y-2">
                        <li>Contact us via email within <strong>48 hours of delivery</strong>.</li>
                        <li>Provide clear, well-lit photographs detailing the damage to both the external packaging and the artwork itself.</li>
                    </ol>

                    <h3 className="text-lg font-serif text-foreground mt-6 mb-2">Resolution Process for Transit Damage:</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Framed Artworks:</strong> If the glass, matting, or frame is damaged, but the core artwork is intact, the client will be asked to ship the piece back. The frame will be repaired or replaced at no extra structural cost, and shipped back.</li>
                        <li><strong>Unframed / Rolled Artworks:</strong> Hand-drawn charcoal and graphite are delicate mediums. If an unframed drawing is severely crushed, folded, or irrecoverably smudged by the courier, it cannot be simply &quot;repaired.&quot; Because the artist fundamentally completed the labor, <strong>full refunds cannot be issued for courier-inflicted damage</strong>. However, to ensure you receive the art you desired, the artist will offer to create a brand new redraw of the piece for a heavily discounted rate, decided on a case-by-case basis considering the size and original complexity of the portrait.</li>
                    </ul>
                    <p className="leading-relaxed mt-4 italic text-sm opacity-70">
                        * Note: Minor smudging that naturally occurs despite fixative spray during extended transit is common for dry mediums and does not constitute &quot;damage&quot; warranting a redraw.
                    </p>
                </div>
            </section>
        </article>
    );
}
