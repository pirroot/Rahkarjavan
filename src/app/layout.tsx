import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Providers } from "@/components/Providers";

export const dynamic = "force-dynamic";
const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "پایگاه خبری راهکار جوان | رسانه تصویری و مجله",
  description:
    "پایگاه خبری راهکار جوان، رسانه‌ای مستقل با تمرکز بر اخبار و مسائل جوانان ایران و جهان. ویدیوهای خبری، مصاحبه، گزارش‌های تصویری و مجله تخصصی.",
  keywords: [
    "راهکار جوان",
    "اخبار جوانان",
    "رسانه تصویری",
    "مجله خبری",
    "اخبار ایران",
    "ویدیو خبری",
    "Rahkar Javan",
  ],
  authors: [{ name: "Rahkar Javan" }],
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "پایگاه خبری راهکار جوان",
    description: "رسانه‌ای مستقل با تمرکز بر اخبار و مسائل جوانان",
    url: "https://rahkarjavan.ir",
    siteName: "راهکار جوان",
    locale: "fa_IR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "پایگاه خبری راهکار جوان",
    description: "رسانه‌ای مستقل با تمرکز بر اخبار و مسائل جوانان",
  },
};

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
        <Providers>{children}</Providers>
        <Toaster />
        <Sonner position="top-center" />
      </body>
    </html>
  );
}
