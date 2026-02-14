import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google"; // Using Cinzel for that premium/artist feel, or could use Playfair Display
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });

export const metadata: Metadata = {
  title: "Atharva Sherlekar | Photorealistic Graphite Artist",
  description: "Commission hyper-realistic graphite portraits by Atharva Sherlekar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${cinzel.variable} font-sans bg-background text-foreground antialiased selection:bg-accent selection:text-background`}>
        {children}
      </body>
    </html>
  );
}
