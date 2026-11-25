import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Providers } from "@/components/Providers";
import { buildGlobalMetadata } from "@/lib/seo";

// Use the Vazirmatn font self-hosted under /public/fonts so the build does
// NOT depend on a network fetch to Google Fonts at build time (which was
// failing in restricted sandboxes). The .woff2 files are shipped with the
// project so the build is fully offline-friendly.
const vazirmatn = localFont({
  src: [
    {
      path: "../../public/fonts/Vazirmatn-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Vazirmatn-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-vazirmatn",
  display: "swap",
});

// Dynamic metadata: merges the admin-configured SEO settings (from the
// SiteSetting table) with sane defaults, so the homepage always has correct
// title / description / OpenGraph / Twitter / canonical. Per-page metadata
// (article, video, category) is generated in their respective server routes
// via generateMetadata and overrides these.
export async function generateMetadata(): Promise<Metadata> {
  return buildGlobalMetadata();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} antialiased bg-background text-foreground font-vazirmatn`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster />
        <Sonner position="top-center" />
      </body>
    </html>
  );
}
