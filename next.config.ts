import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["bluestrike.vercel.app", "bluestrike.com.br", "bluestrike-git-dev-isacvietros-projects.vercel.app", "26.81.84.77"],
  output: "standalone",
  experimental: {
    workerThreads: true,
    cpus: 1,
  },
  serverExternalPackages: ["sharp"],
  images: {
    // Avatares da Steam vêm em 184x184; o reencode precisa de qualidade alta
    // para não somar perda em cima de uma origem já pequena.
    qualities: [75, 95],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // Supabase Storage — banners de campeonatos e outros assets
      {
        protocol: "https",
        hostname: "noctpgqdmutfslbnjrts.supabase.co",
      },
      // Steam CDN — avatares dos jogadores
      {
        protocol: "https",
        hostname: "avatars.steamstatic.com",
      },
      {
        protocol: "https",
        hostname: "avatars.fastly.steamstatic.com",
      },
      {
        protocol: "https",
        hostname: "avatars.akamai.steamstatic.com",
      },
      {
        protocol: "https",
        hostname: "avatars.cloudflare.steamstatic.com",
      },
      {
        protocol: "https",
        hostname: "steamcdn-a.akamaihd.net",
      },
      {
        protocol: "https",
        hostname: "cdn.cloudflare.steamstatic.com",
      },
      // Faceit CDN — avatares e assets dos jogadores Faceit
      {
        protocol: "https",
        hostname: "assets.faceit-cdn.net",
      },
      {
        protocol: "https",
        hostname: "distribution.faceit-cdn.net",
      },
      // WeaponPaints — imagens de skins do CS2
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
