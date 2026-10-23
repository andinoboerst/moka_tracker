import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { LanguageProvider } from "@/lib/LanguageContext";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ChatAssistant from "@/components/ChatAssistant";
import Footer from "@/components/Footer";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Moka Tracker - Track and Perfect your Moka Pot Brews",
  description: "A free, simple tool for coffee enthusiasts to log, track, and improve their stovetop Moka pot brews.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Moka Tracker", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#17110d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-canvas text-ink">
        <LanguageProvider>
          <AuthProvider>
            {children}
            <ChatAssistant />
            <Footer />
          </AuthProvider>
        </LanguageProvider>
        <ServiceWorkerRegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
