"use client";

import { useEffect, useId, useRef, useState } from "react";
import Script from "next/script";

// ── tipos mínimos do SDK ──────────────────────────────────────────────────────

interface TwitchPlayerInstance {
  addEventListener(event: string, callback: () => void): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
}

interface TwitchPlayerConstructor {
  new (
    elementId: string,
    options: {
      width: number | string;
      height: number | string;
      channel: string;
      parent: string[];
      autoplay: boolean;
      muted: boolean;
    }
  ): TwitchPlayerInstance;
  ONLINE?: string;
  OFFLINE?: string;
  READY?: string;
  PLAYBACK_BLOCKED?: string;
}

declare global {
  interface Window {
    Twitch?: { Player: TwitchPlayerConstructor };
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolve a lista de parents válidos para o embed Twitch.
 * Prioridade: NEXT_PUBLIC_TWITCH_PARENT → hostname (se domínio, não IP) → "localhost"
 * IPs nunca são aceitos pela Twitch. Apenas localhost funciona sem HTTPS.
 */
function resolveParents(): string[] {
  const parents: string[] = [];

  const envRaw = process.env.NEXT_PUBLIC_TWITCH_PARENT ?? "";
  for (const p of envRaw.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (!parents.includes(p)) parents.push(p);
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase().trim();
    const isIp =
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) ||
      host === "::1" ||
      host === "[::1]" ||
      host === "0.0.0.0";

    if (host && !isIp && !parents.includes(host)) {
      parents.push(host);
    }
  }

  return parents.length ? parents : ["localhost"];
}

// ── component ─────────────────────────────────────────────────────────────────

interface TwitchPlayerProps {
  channel: string;
  onStatusChange?: (isLive: boolean) => void;
}

const TWITCH_SDK = "https://player.twitch.tv/js/embed/v1.js";

export default function TwitchPlayer({ channel, onStatusChange }: TwitchPlayerProps) {
  const onStatusChangeRef = useRef(onStatusChange);
  useEffect(() => { onStatusChangeRef.current = onStatusChange; }, [onStatusChange]);

  const uid = useId().replace(/:/g, "");
  const ghostId = `twitch-ghost-${uid}`;

  const [sdkReady, setSdkReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.Twitch?.Player)
  );

  // ── iframe src ──────────────────────────────────────────────────────────────
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  useEffect(() => {
    const parents = resolveParents();
    const params = new URLSearchParams({ channel, autoplay: "false" });
    parents.forEach((p) => params.append("parent", p));
    setIframeSrc(`https://player.twitch.tv/?${params.toString()}`);
  }, [channel]);

  // ── SDK invisível apenas para eventos ONLINE / OFFLINE ──────────────────────
  useEffect(() => {
    if (!sdkReady || !window.Twitch?.Player) return;

    const playerApi = window.Twitch.Player;
    const ghost = document.getElementById(ghostId);
    if (!ghost) return;

    let disposed = false;

    const player = new playerApi(ghostId, {
      width: 1,
      height: 1,
      channel,
      parent: resolveParents(),
      autoplay: false,
      muted: true,
    });

    const ev = (key: "ONLINE" | "OFFLINE" | "READY" | "PLAYBACK_BLOCKED") =>
      playerApi[key] ?? key;

    player.addEventListener(ev("ONLINE"), () => {
      if (!disposed) onStatusChangeRef.current?.(true);
    });

    player.addEventListener(ev("OFFLINE"), () => {
      if (!disposed) onStatusChangeRef.current?.(false);
    });

    player.addEventListener(ev("PLAYBACK_BLOCKED"), () => {
      if (!disposed) player.setMuted(true);
    });

    return () => {
      disposed = true;
      // limpa o ghost player
      if (ghost) ghost.innerHTML = "";
    };
  }, [sdkReady, channel, ghostId]);

  return (
    <>
      {/* Player visível — iframe sem problemas de parent */}
      <div className="relative w-full aspect-video min-h-[300px] bg-black">
        {iframeSrc && (
          <iframe
            key={iframeSrc}
            src={iframeSrc}
            allowFullScreen
            allow="autoplay; fullscreen"
            className="absolute inset-0 h-full w-full border-0"
            title={`${channel} ao vivo — Twitch`}
          />
        )}
      </div>

      {/* Ghost player — invisível, só para capturar eventos ONLINE/OFFLINE */}
      <div
        id={ghostId}
        aria-hidden="true"
        style={{ position: "fixed", top: "-9999px", left: "-9999px", width: 1, height: 1, pointerEvents: "none" }}
      />

      <Script
        id="twitch-sdk"
        src={TWITCH_SDK}
        strategy="afterInteractive"
        onReady={() => setSdkReady(true)}
      />
    </>
  );
}
