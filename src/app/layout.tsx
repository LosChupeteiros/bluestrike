import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/header";
import HeaderWithUser from "@/components/layout/header-with-user";
import Footer from "@/components/layout/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BlueStrike — Campeonatos de CS2",
    template: "%s | BlueStrike",
  },
  description:
    "A maior plataforma de campeonatos de Counter-Strike 2 do Brasil. Compita, vença e domine o cenário competitivo.",
  keywords: ["cs2", "counter-strike", "campeonato", "esports", "brasil", "torneio"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "BlueStrike Esports",
    title: "BlueStrike — Campeonatos de CS2",
    description: "A maior plataforma de campeonatos de CS2 do Brasil.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('bluestrike-theme');var t=s==='light'||s==='dark'?s:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--canvas)] text-[var(--foreground)]">
        <Suspense fallback={<Header user={null} authState="loading" />}>
          <HeaderWithUser />
        </Suspense>
        <main className="relative flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
