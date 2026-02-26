import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google"; // Using Cinzel for that premium/artist feel, or could use Playfair Display
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthProvider from "@/components/AuthProvider";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });

export const metadata: Metadata = {
  title: {
    template: '%s | Atharva Sherlekar Art',
    default: 'Atharva Sherlekar Art - Realistic Graphite Portrait Artist',
  },
  description: "Turn your photos into hyper-realistic hand-drawn graphite portraits. Custom artwork commissions by Atharva Sherlekar Art.",
  keywords: ["graphite portrait", "pencil sketch", "custom artwork", "hand drawn portrait", "commission artist", "realistic drawing", "portrait artist india"],
  authors: [{ name: "Atharva Sherlekar Art" }],
  creator: "Atharva Sherlekar Art",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://atharvasherlekar.art",
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
            <CustomCursor />
            <SmoothScroll>
              {children}
            </SmoothScroll>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
