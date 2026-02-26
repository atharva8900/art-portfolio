import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Manage Commissions',
};

export default function CommissionsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
