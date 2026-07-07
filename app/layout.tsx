import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { meta } from "@/lib/copy";
import "./globals.css";
import ParticleProvider from "./providers/ParticleProvider";
import MagicWalletProvider from "./providers/MagicWalletProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#E8EBE6",
};

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Lumina" },
  icons: {
    icon: [{ url: "/icons/lumina-192.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/lumina-192.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="font-sans min-h-dvh bg-canvas-soft text-ink antialiased">
        <MagicWalletProvider>
          <ParticleProvider>{children}</ParticleProvider>
        </MagicWalletProvider>
      </body>
    </html>
  );
}