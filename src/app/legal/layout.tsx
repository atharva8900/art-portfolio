import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background text-foreground pt-16 md:pt-32 pb-16 md:pb-24">
            <div className="max-w-3xl mx-auto px-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-foreground transition-colors mb-12"
                >
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>
                <div className="prose dark:prose-invert prose-neutral max-w-none prose-p:text-foreground/90 prose-headings:text-foreground prose-li:text-foreground/90">
                    {children}
                </div>
            </div>
        </div>
    );
}
