import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const iransansx = localFont({
  src: [
    { path: "../fonts/IRANSansX-Thin.woff2", weight: "100", style: "normal" },
    { path: "../fonts/IRANSansX-UltraLight.woff2", weight: "200", style: "normal" },
    { path: "../fonts/IRANSansX-Light.woff2", weight: "300", style: "normal" },
    { path: "../fonts/IRANSansX-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/IRANSansX-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/IRANSansX-DemiBold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/IRANSansX-Bold.woff2", weight: "700", style: "normal" },
    { path: "../fonts/IRANSansX-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "../fonts/IRANSansX-Black.woff2", weight: "900", style: "normal" },
  ],
  display: "swap",
  variable: "--font-iransansx",
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
      <body className={`${iransansx.variable} min-h-dvh font-sans`}>
        {children}
      </body>
    </html>
  );
}
