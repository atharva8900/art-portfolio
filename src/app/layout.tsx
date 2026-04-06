import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google"; // Using Cinzel for that premium/artist feel, or could use Playfair Display
import "./globals.css";
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import AuthProvider from '@/components/auth/AuthProvider';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { GoogleAnalytics } from '@next/third-parties/google';
import dynamic from 'next/dynamic';

const SmoothScroll = dynamic(() => import('@/components/layout/SmoothScroll'), { ssr: false });
const CustomCursor = dynamic(() => import('@/components/features/CustomCursor'), { ssr: false });
const ChatWidget = dynamic(() => import('@/components/features/ChatWidget'), { ssr: false });
const TurnstileScript = dynamic(() => import('@/components/shared/TurnstileScript'), { ssr: false });
import DeviceGuard from '@/components/shared/DeviceGuard';

import { getBaseUrl } from '@/lib/utils/utils';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: 'swap', preload: true });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", display: 'swap', preload: true });

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: {
    template: '%s | Atharva Sherlekar Art',
    default: 'Atharva Sherlekar Art - Realistic Graphite Portrait Artist',
  },
  description: "Turn your photos into hyper-realistic hand-drawn graphite portraits. Custom artwork commissions by Atharva Sherlekar Art.",
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: '/',
  },
  verification: {
    google: "ASoU69R0hNMIj9upMwU-aDekM-VwyNFSPcMfFm0WIp0",
  },
  keywords: ["graphite portrait", "pencil sketch", "custom artwork", "hand drawn portrait", "commission artist", "realistic drawing", "portrait artist india"],
  authors: [{ name: "Atharva Sherlekar Art" }],
  creator: "Atharva Sherlekar Art",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Atharva Sherlekar Art",
    title: "Atharva Sherlekar Art - Realistic Graphite Portrait Artist",
    description: "Turn your photos into hyper-realistic hand-drawn graphite portraits.",
    images: [
      {
        url: "/images/spiderman_andrew_final.jpg",
        width: 1200,
        height: 630,
        alt: "Tobey Maguire Portrait by Atharva Sherlekar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Atharva Sherlekar Art - Realistic Graphite Portrait Artist",
    description: "Turn your photos into hyper-realistic hand-drawn graphite portraits.",
    images: ["/images/spiderman_andrew_final.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${cinzel.variable} font-sans bg-background text-foreground antialiased selection:bg-accent selection:text-background`}>

        <ThemeProvider attribute="class" defaultTheme="dark">
          <AuthProvider>
            {/* 
              PERFORMANCE NOTE: We only wrap CustomCursor in DeviceGuard. 
              If DeviceGuard wraps the main {children}, it returns `null` on hydration 
              which completely deletes the page DOM and causes massive LCP/INP (7s+) penalties on mobile.
              DeviceGuard is kept exclusively for CustomCursor to ensure it stays fully disabled on 
              mobile devices even if they request "Desktop Site" (since touch is still detected).
            */}
            <DeviceGuard disableOnTouch={true} minWidth={1024}>
              <CustomCursor />
            </DeviceGuard>

            {/* 
              PERFORMANCE NOTE: SmoothScroll wraps {children} directly, passing them through on SSR. 
              We do NOT wrap it in DeviceGuard to preserve fast hydration. 
              It already internally guards against "Desktop Site" touch devices by checking 
              `navigator.maxTouchPoints` inside its own useEffect, safely bailing out without unmounting.
            */}
            <SmoothScroll>
              {children}
            </SmoothScroll>
            <Analytics />
            <SpeedInsights />
            <GoogleAnalytics gaId="G-00470JC3GM" />
            {process.env.NEXT_PUBLIC_ENABLE_CHATBOT === 'true' && <ChatWidget />}
            <TurnstileScript />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "WebSite",
                  "name": "Atharva Sherlekar Art",
                  "alternateName": ["Atharva Sherlekar", "Atharva's Art"],
                  "url": baseUrl,
                }),
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

