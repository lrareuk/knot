import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import Analytics from "@/app/components/layout/Analytics";
import CookieConsent from "@/app/components/layout/CookieConsent";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const fallbackUrl = "http://localhost:3000";
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? fallbackUrl;

const metadataBase = (() => {
  try {
    return new URL(configuredSiteUrl);
  } catch {
    return new URL(fallbackUrl);
  }
})();

export const metadata: Metadata = {
  metadataBase,
  title: "Untie — Clarity before change",
  description: "Private financial modelling for people considering separation.",
  openGraph: {
    title: "Untie — Clarity before change",
    description: "Private financial modelling for people considering separation.",
    type: "website",
    siteName: "Untie",
    url: metadataBase,
  },
};

export const viewport: Viewport = {
  themeColor: "#121212",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.className} ${manrope.variable} ${spaceGrotesk.variable} antialiased`}>
        {children}
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
