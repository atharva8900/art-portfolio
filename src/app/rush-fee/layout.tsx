import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Why I Charge a Rush Fee & How My 7-Day Delivery Buffer Works | Atharva Sherlekar Art',
    description: 'Learn why rush orders require a 30% rush fee, how the 7-day framing and delivery buffer works, and why to guarantee delivery by your date, drawing must finish 7 days earlier.',
};

export default function RushFeeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
