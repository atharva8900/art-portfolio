export const metadata = {
    title: "Privacy Policy | Atharva Sherlekar Art",
    description: "Privacy Policy for Atharva Sherlekar Art regarding personal information and client reference photos.",
};

export default function PrivacyPolicy() {
    return (
        <article>
            <h1 className="text-4xl font-serif mb-8">Privacy Policy</h1>
            <p className="text-neutral-400 mb-8">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

            <section className="space-y-6">
                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">1. Information We Collect</h2>
                    <p className="text-neutral-400 leading-relaxed">
                        To fulfill your custom portrait commission, we collect the following personal information:
                    </p>
                    <ul className="list-disc pl-6 mt-4 text-neutral-400 space-y-2">
                        <li><strong>Contact Information:</strong> Name, Email Address, and Phone Number.</li>
                        <li><strong>Shipping Details:</strong> Postal address for delivering the physical artwork.</li>
                        <li><strong>Reference Materials:</strong> Photographs provided by you to be used as drawing references.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">2. How We Use Your Information</h2>
                    <p className="text-neutral-400 leading-relaxed">
                        Your information is strictly used for the execution and fulfillment of your commission:
                    </p>
                    <ul className="list-disc pl-6 mt-4 text-neutral-400 space-y-2">
                        <li><strong>Communication:</strong> To discuss order details, send work-in-progress updates, and provide tracking information.</li>
                        <li><strong>Fulfillment:</strong> To draw the portrait based on your provided reference photos.</li>
                        <li><strong>Shipping:</strong> Providing your name, address, and phone number to our trusted courier partners (e.g., DTDC, DHL, India Post) solely for the purpose of delivering the package.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">3. Strict Confidentiality of Reference Photos</h2>
                    <p className="text-neutral-400 leading-relaxed">
                        We understand the deeply personal nature of portrait commissions.
                        <strong> Your reference photos are treated with the highest level of confidentiality.</strong> They are stored securely and are only accessed by the artist for the purpose of creating the artwork.
                    </p>
                    <p className="text-neutral-400 leading-relaxed mt-4">
                        We will <strong>never</strong> share your reference photos publicly, post them on social media, or use them for marketing purposes without your explicit, written consent. After the artwork is completed and delivered, reference photos are permanently deleted from our primary working devices.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">4. Third-Party Sharing</h2>
                    <p className="text-neutral-400 leading-relaxed">
                        We do not sell, trade, or rent your personal identification information to others. We only share necessary information with trusted third parties exclusively for completing your transaction:
                    </p>
                    <ul className="list-disc pl-6 mt-4 text-neutral-400 space-y-2">
                        <li><strong>Payment Gateways (Razorpay):</strong> To process your payments securely. We do not store your credit card or sensitive financial data on our servers.</li>
                        <li><strong>Shipping Couriers:</strong> To deliver the physical artwork to your address.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">5. Cookies and Web Tracking</h2>
                    <p className="text-neutral-400 leading-relaxed">
                        This website may use essential cookies to enhance user experience, such as keeping you logged in if applicable, or ensuring the secure processing of forms. We do not use intrusive third-party tracking or advertising cookies.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">6. Contact Us</h2>
                    <p className="text-neutral-400 leading-relaxed">
                        If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please contact us at <strong>atharvasherlekarart@gmail.com</strong>.
                    </p>
                </div>
            </section>
        </article>
    );
}
