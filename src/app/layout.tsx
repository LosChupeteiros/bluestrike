import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/header";
import HeaderWithUser from "@/components/layout/header-with-user";
import Footer from "@/components/layout/footer";

/**
 * Display: Archivo variable — an industrial grotesque with a width axis.
 * Chosen for the broadcast-graphics voice (machined, precise, built for
 * scoreboards) rather than the usual geometric-sans reflex.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BlueStrike — Campeonatos de CS2",
    template: "%s | BlueStrike",
  },
  description:
    "A plataforma brasileira de Counter-Strike 2. Monte seu time, dispute campeonatos com premiação em PIX e suba no ranking.",
  keywords: ["cs2", "counter-strike", "campeonato", "esports", "brasil", "torneio", "faceit", "pix"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "BlueStrike Esports",
    title: "BlueStrike — Campeonatos de CS2",
    description: "A plataforma brasileira de CS2. Desafie. Supere. Domine.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e14",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${archivo.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="grain flex min-h-full flex-col overflow-x-clip bg-void text-ink">
        <Suspense fallback={<Header user={null} authState="loading" />}>
          <HeaderWithUser />
        </Suspense>
        <main className="w-full max-w-full flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
