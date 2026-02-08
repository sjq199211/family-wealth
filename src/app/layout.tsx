import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "家庭财富",
  description: "家庭研报分享与交易记录",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="antialiased font-sans bg-[var(--bg-page)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
