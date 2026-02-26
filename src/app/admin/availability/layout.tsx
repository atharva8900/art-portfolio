import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Availability Settings',
};

export default function AvailabilityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
