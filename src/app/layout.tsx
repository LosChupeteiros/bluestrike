import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/header";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
