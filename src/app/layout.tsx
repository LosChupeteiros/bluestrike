import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { getIntegrationBaseUrl } from "@/lib/api-auth";
import "./globals.css";
import Header from "@/components/layout/header";
import HeaderWithUser from "@/components/layout/header-with-user";
import Footer from "@/components/layout/footer";
import RevealProvider from "@/components/motion/reveal-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Sem metadataBase, URLs de Open Graph e canonical saem relativas e o
  // compartilhamento em WhatsApp/Discord/X não resolve a imagem.
  metadataBase: new URL(getIntegrationBaseUrl()),
  title: {
    default: "BlueStrike — Campeonatos de CS2",
    template: "%s | BlueStrike",
  },
  description:
    "A maior plataforma de campeonatos de Counter-Strike 2 do Brasil. Compita, vença e domine o cenário competitivo.",
  keywords: ["cs2", "counter-strike", "campeonato", "esports", "brasil", "torneio"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "BlueStrike Esports",
    url: "/",
    title: "BlueStrike — Campeonatos de CS2",
    description: "A maior plataforma de campeonatos de CS2 do Brasil.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlueStrike — Campeonatos de CS2",
    description: "A maior plataforma de campeonatos de CS2 do Brasil.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
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
            __html: `(function(){try{var s=localStorage.getItem('bluestrike-theme');var t=s==='light'||s==='dark'?s:'dark';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--canvas)] text-[var(--foreground)]">
        <Suspense fallback={<Header user={null} authState="loading" />}>
          <HeaderWithUser />
        </Suspense>
        {/* Sentinela de rolagem do header.
            Fica no topo do documento e é observada por IntersectionObserver em
            `header.tsx`: quando sai da tela, o header vira o estado compacto.
            Precisa ser JSX de verdade — no App Router o React é dono dos filhos
            de <body>, então um nó inserido por `document.body.prepend()` é
            removido na primeira reconciliação. */}
        <div id="bs-scroll-sentinel" aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-5" />
        <main className="relative flex-1">{children}</main>
        <RevealProvider />
        <Footer />
      </body>
    </html>
  );
}
