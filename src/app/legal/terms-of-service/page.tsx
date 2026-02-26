export const metadata = {
    title: "Terms of Service | Atharva Sherlekar Art",
    description: "Terms and conditions for commissioning custom artwork from Atharva Sherlekar.",
};

export default function TermsOfService() {
    return (
        <article>
            <h1 className="text-4xl font-serif mb-8">Terms of Service</h1>
            <p className="text-neutral-400 mb-8">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

            <section className="space-y-6">
                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">1. Acceptance of Terms</h2>
                    <p className="text-neutral-400 leading-relaxed">
                        By placing a commission request or making any advance payment (whether the 50% active deposit or the 25% waitlist reservation fee) through this website, you agree to be bound by these Terms of Service. Please read them carefully before confirming your order.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">2. The Commission Process</h2>
                    <ul className="list-disc pl-6 mt-4 text-neutral-400 space-y-2">
                        <li><strong>Reference Quality:</strong> The final hyper-realistic outcome is heavily dependent on the quality of the reference photograph provided. Blurry, heavily filtered, or low-resolution images will be rejected. The artist reserves the right to decline a commission if a suitable reference cannot be provided.</li>
                        <li><strong>Updates:</strong> You will receive general updates on the progress of your portrait. Revisions are generally not accommodated once shading and detailing have commenced, as graphite and charcoal are difficult to completely erase or fundamentally alter mid-process.</li>
                        <li><strong>Timeline:</strong> Estimated completion times provided (e.g., 2-4 weeks) are approximations and not hard deadlines. Creation time may vary based on complexity, size, and current workload.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">3. Copyright & Intellectual Property</h2>
                    <p className="text-neutral-400 leading-relaxed">
                        Understanding the distinction between physical ownership and copyright is crucial:
                    </p>
                    <ul className="list-disc pl-6 mt-4 text-neutral-400 space-y-2">
                        <li><strong>Physical Ownership:</strong> Upon full payment of the balance and shipping fees, you own the physical original artwork. You may display it in your home or privately gift it.</li>
                        <li><strong>Artist Copyright:</strong> The artist, Atharva Sherlekar, retains full copyright and all underlying reproductive rights to the image itself. <strong>You may not reproduce, print, copy, distribute, or use the artwork for any commercial or monetary gaining purpose.</strong></li>
                        <li><strong>Portfolio Rights:</strong> The artist retains the right to display photographs or scans of the completed artwork in their electronic portfolio, on social media platforms, or in promotional materials. However, if the portrait is a surprise gift, the artist will gladly hold off on posting it publicly until the designated date of the event. (Client reference photos remain strictly private as per our Privacy Policy).</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">4. Payment Terms</h2>
                    <p className="text-neutral-400 leading-relaxed">
                        All payments are processed securely via third-party gateways (e.g., Razorpay). Prices are listed in INR (Indian Rupees), and international clients may be subject to standard currency conversion rates applied by their bank or card issuer at the time of checkout.
                    </p>
                    <ul className="list-disc pl-6 mt-4 text-neutral-400 space-y-2">
                        <li><strong>Active Slots:</strong> A 50% advance is required to confirm your commission and begin the drawing process. The remaining 50% plus shipping is due on completion.</li>
                        <li><strong>Waitlist Reservations:</strong> A 25% Slot Reservation Fee is required to hold your place. When a slot opens up, you will be contacted for the remaining 25% advance before work begins. The final 50% plus shipping is due on completion.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">5. Revisions to Terms</h2>
                    <p className="text-neutral-400 leading-relaxed">
                        Atharva Sherlekar Art reserves the right, at our sole discretion, to modify or replace these Terms at any time. Significant changes will be communicated via top-level website announcements.
                    </p>
                </div>

            </section>
        </article>
    );
}
