import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Research Agent",
  description: "AI-powered multi-agent research with X-402 micro-payments",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-6 py-3">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <a href="/" className="flex items-center gap-2 group"></a>