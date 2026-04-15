import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["26.69.145.194"],
  images: {
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
        hostname: "steamcdn-a.akamaihd.net",
      },
      {
        protocol: "https",
        hostname: "cdn.cloudflare.steamstatic.com",
      },
    ],
  },
};

export default nextConfig;
