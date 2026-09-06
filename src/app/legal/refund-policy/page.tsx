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
                        I understand that circumstances can change. The cancellation grace period applies <strong>only to your very first (initial) payment</strong> (whether that is the 50% active deposit or the 25% waitlist reservation fee).
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li><strong>Within 48 Hours of Initial Payment:</strong> If you decide to cancel within exactly 48 hours of making your first payment, you are entitled to a <strong>100% full refund</strong> of that amount. The slot will be released.</li>
                        <li><strong>After 48 Hours of Initial Payment:</strong> Once this window has passed, the initial payment becomes <strong>completely non-refundable</strong>. Your reservation or slot is locked in.</li>
                        <li><strong>Subsequent Payments (Waitlist Clients Only):</strong> When your waitlist slot is confirmed and you make the second 25% payment to begin work, this authorises the artist to start drawing immediately. <strong>This payment and all previously made payments are non-refundable from the moment of transfer.</strong> No new cancellation window is opened. By paying, you are confirming your full commitment to the commission.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">3. Completed Artworks &amp; Strict No-Returns Policy</h2>
                    <p className="leading-relaxed">
                        Because every custom portrait is a deeply personal, hand-drawn original artwork created specifically for you:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li><strong>All Sales &amp; Deliveries Are Final:</strong> Once the final artwork has been approved by you and dispatched, <strong>under no circumstances are physical returns accepted</strong>.</li>
                        <li><strong>Risk of Transit Damage:</strong> Delicate hand-drawn artwork requires specialized packaging. Returning an artwork carries a high risk of damage during return transit.</li>
                        <li><strong>Non-Resalable Labor:</strong> Custom artwork cannot be restocked or resold. The extensive time, labor, and delivery costs invested into creating your piece cannot be recovered.</li>
                        <li><strong>Digital Resolution Policy:</strong> If your package suffers genuine transit damage (verified through your continuous unboxing video), <strong>you do not need to return the artwork</strong>. Resolutions are handled directly via framing fee refunds or water damage compensation as outlined in Section 5.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">4. Liability &amp; Circumstances During Creation</h2>
                    <p className="leading-relaxed">
                        If, for any unforeseen reason or due to an error during the drawing process, I (Atharva Sherlekar) accidentally compromise, ruin, or am entirely unable to fulfill your commission after work has begun:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li>You will be notified immediately.</li>
                        <li>You will receive a <strong>100% full refund</strong> of all advance payments made (whether the 50% active deposit or the 25% reservation fee plus any additional advance collected), as the failure to deliver stems entirely from an artist-side default.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">5. Damaged in Transit &amp; Unboxing Proof Policy</h2>
                    <p className="leading-relaxed">
                        I take great personal care in packing every portrait with rigid backing boards, bubble wrap, and heavy-duty protective packaging. However, because hand-drawn artworks are delicate, the following verification and resolution protocol applies:
                    </p>
                    
                    <h3 className="text-lg font-serif text-foreground mt-6 mb-2">Mandatory Continuous Unboxing Video:</h3>
                    <p className="leading-relaxed">
                        To claim any resolution for transit damage, <strong>you must record a single, continuous, unedited video from start to finish</strong>.
                    </p>
                    <ol className="list-decimal pl-6 mt-2 space-y-2">
                        <li>Take a photo of the sealed outer box showing the shipping label and send it to me via DM or email.</li>
                        <li>Record the unboxing process continuously without cuts or pauses (placing your camera on a stand or having someone record for you).</li>
                        <li>Inspect the artwork and frame clearly on camera under good lighting.</li>
                        <li>Contact me with the video within <strong>48 hours of marked delivery</strong>.</li>
                    </ol>
                    <p className="leading-relaxed mt-3 text-sm opacity-80">
                        * Please note: If you choose not to record an unboxing video, I cannot verify whether the damage occurred during transit or after delivery, and no refunds or redraws can be provided.
                    </p>

                    <h3 className="text-lg font-serif text-foreground mt-6 mb-2">Transit Resolution Guidelines:</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Framed Artworks (Broken Glass or Frame):</strong> If the frame or glass arrives damaged during transit but the core drawing is intact, <strong>I will promptly refund the full framing charges</strong> you paid so you can have it reframed locally. The original artwork is retained by you.</li>
                        <li><strong>Severe Water or Liquid Damage:</strong> If the package suffers catastrophic water or rain damage during transit that irrecoverably ruins the drawing, <strong>I will issue a 100% full refund</strong>, and if you wish to have the piece redrawn, <strong>I will offer a complete redraw at a 70% discount of the total value</strong> of the original commission (meaning you only pay 30% of the total value).</li>
                        <li><strong>Folds, Creases, and Accidental Bends:</strong> Because all portraits are dispatched inside rigid, unbendable protective packaging, claims for folded or creased drawings are not eligible for refunds or free redraws once delivered.</li>
                    </ul>
                </div>
            </section>
        </article>
    );
}
