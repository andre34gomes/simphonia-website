import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MotionProvider } from "@/components/motion/motion-provider";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Simphonia — Global eSIM Connectivity for Modern Travelers",
    template: "%s — Simphonia",
  },
  description:
    "Stay connected in 200+ countries with Simphonia's instant eSIM activation. Transparent pricing, AI-powered support, and secure checkout — no physical SIM required.",
  keywords: [
    "eSIM",
    "travel eSIM",
    "international data",
    "mobile data plans",
    "Simphonia",
    "global connectivity",
  ],
  openGraph: {
    title: "Simphonia — Global eSIM Connectivity for Modern Travelers",
    description:
      "Stay connected in 200+ countries with instant eSIM activation, transparent pricing, and AI-powered support.",
    url: SITE_URL,
    siteName: "Simphonia",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Simphonia — Global eSIM Connectivity for Modern Travelers",
    description:
      "Stay connected in 200+ countries with instant eSIM activation, transparent pricing, and AI-powered support.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <MotionProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </MotionProvider>
      </body>
    </html>
  );
}
