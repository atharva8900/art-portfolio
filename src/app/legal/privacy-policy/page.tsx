export const metadata = {
    title: "Privacy Policy | Atharva Sherlekar Art",
    description: "Privacy Policy for Atharva Sherlekar Art regarding personal information and client reference photos.",
};

export default function PrivacyPolicy() {
    return (
        <article>
            <h1 className="text-4xl font-serif mb-8">Privacy Policy</h1>
            <p className="mb-8 opacity-60">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

            <section className="space-y-6">
                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">1. Information We Collect</h2>
                    <p className="leading-relaxed">
                        To fulfill your custom portrait commission and provide access to your dashboard, the following information is securely handled:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li><strong>Commission Details:</strong> When you fill out our order forms, we collect and use your <strong>Name, Email Address, and Phone Number</strong> to manage your request.</li>
                        <li><strong>Secure Authentication:</strong> We use safe, industry-standard methods for login. For Google Sign-In, we use <strong>NextAuth</strong> which securely authenticates you. For <strong>Magic Link</strong> sign-ins, we use <strong>Supabase</strong> to verify your email and provide access.</li>
                        <li><strong>Shipping Details:</strong> Postal address provided by you for delivering the physical artwork.</li>
                        <li><strong>Reference Materials:</strong> Photographs provided by you to be used as drawing references.</li>
                        <li><strong>Payout Details:</strong> For the referral program, we may collect your payout information, which securely handles your UPI ID, Indian Bank Account details, or Wise Email address, depending on your location and selected payout method.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">2. How We Use Your Information</h2>
                    <p className="leading-relaxed">
                        Your information is strictly used for the execution and fulfillment of your commission:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li><strong>Client Dashboard:</strong> To provide a personal space where you can track your commissions and manage your profile.</li>
                        <li><strong>Communication:</strong> To discuss order details, send work-in-progress updates, and provide tracking information.</li>
                        <li><strong>Fulfillment:</strong> To draw the portrait based on your provided reference photos.</li>
                        <li><strong>Shipping:</strong> Providing your necessary details to our trusted courier partners (e.g., DTDC, DHL, India Post) solely for delivery.</li>
                        <li><strong>Referral Payouts:</strong> Processing your earned commissions via your selected payout method (UPI, Bank, or Wise).</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">3. Strict Confidentiality of Reference Photos</h2>
                    <p className="leading-relaxed">
                        We understand the deeply personal nature of portrait commissions.
                        <strong> Your reference photos are treated with the highest level of confidentiality.</strong> They are stored securely and are only accessed by the artist for the purpose of creating the artwork. Reference photos are permanently deleted once the artwork is completed and delivered.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">4. Third-Party Sharing</h2>
                    <p className="leading-relaxed">
                        We do not sell, trade, or rent your personal identification information to others. We only use trusted third-party services to complete your transaction and secure your account:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li><strong>Payment Gateways (Razorpay):</strong> To process your payments securely. We do not store your financial data on our servers.</li>
                        <li><strong>Authentication Providers (NextAuth/Google & Supabase):</strong> To manage secure login sessions and protect your access.</li>
                        <li><strong>Shipping Couriers:</strong> To deliver the physical artwork to your address.</li>
                        <li><strong>Payout Processors (Wise):</strong> To securely process international referral commission payouts.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">5. Cookies and Web Tracking</h2>
                    <p className="leading-relaxed">
                        This website uses essential security cookies provided by NextAuth and Supabase to maintain your secure session. These cookies allow you to stay logged into your dashboard and are strictly for site functionality. We do not use intrusive third-party tracking or advertising cookies.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-4">6. Contact Us</h2>
                    <p className="leading-relaxed">
                        If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please contact us at <strong>atharvasherlekarart@gmail.com</strong>.
                    </p>
                </div>
            </section>
        </article>
    );
}
