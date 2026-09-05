import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const vazirmatn = localFont({
  src: "../fonts/vazirmatn-variable.woff2",
  display: "swap",
  variable: "--font-vazirmatn",
});

export const metadata: Metadata = {
  title: {
    default: "هم‌بهورز",
    template: "%s | هم‌بهورز",
  },
  description:
    "شبکه حرفه‌ای، یادگیری و هم‌افزایی بهورزان و مراقبین سلامت؛ جایی که مسئله را کشف می‌کنیم، با هم حل می‌کنیم و تجربه میدانی را به دانش ملی تبدیل می‌کنیم.",
  applicationName: "هم‌بهورز",
};

export const viewport: Viewport = {
  themeColor: "#1d7f58",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" data-scroll-behavior="smooth">
      <body className={`${vazirmatn.variable} min-h-dvh font-sans`}>
        {children}
      </body>
    </html>
  );
}
