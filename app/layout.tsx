import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0f",
};

export const metadata: Metadata = {
  title: "Lumina — Send Money Anywhere, Instantly",
  description:
    "The fastest, cheapest way to send money internationally. No hidden fees, no waiting. Powered by invisible blockchain technology.",
  keywords: ["remittance", "money transfer", "international", "lumina", "crypto"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lumina",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Lumina — Send Money Anywhere, Instantly",
    description: "The fastest, cheapest way to send money internationally.",
    type: "website",
  },
};

import ParticleProvider from "./providers/ParticleProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className="font-sans min-h-dvh flex flex-col bg-surface-900 text-text-primary antialiased">
        <ParticleProvider>{children}</ParticleProvider>
      </body>
    </html>
  );
}
