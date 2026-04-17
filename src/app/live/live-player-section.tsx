"use client";

import { useState } from "react";
import TwitchPlayer from "./twitch-player";
import LiveStatusBadge, { type LiveStatus } from "./live-status-badge";
import { Tv } from "lucide-react";

interface LivePlayerSectionProps {
  channel: string;
}

export default function LivePlayerSection({ channel }: LivePlayerSectionProps) {
  const [status, setStatus] = useState<LiveStatus>("checking");

  function handleStatusChange(isLive: boolean) {
    setStatus(isLive ? "live" : "offline");
  }

  return (
    <>
      {/* ── Topo: status + link Twitch ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <LiveStatusBadge status={status} />
          <div>
            <span className="text-sm font-bold text-[var(--foreground)]">BlueStrike</span>
            <span className="text-sm text-[var(--muted-foreground)]"> · CS2 · Twitch</span>
          </div>
        </div>

        <a
          href={`https://twitch.tv/${channel}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-100 self-start sm:self-auto"
          style={{
            borderColor: "rgba(145,71,255,0.35)",
            backgroundColor: "rgba(145,71,255,0.10)",
            color: "#bf94ff",
          }}
        >
          <Tv className="w-4 h-4" />
          Seguir na Twitch
        </a>
      </div>

      {/* ── Player ───────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden mb-2"
        style={{
          border: status === "live"
            ? "1px solid rgba(239,68,68,0.25)"
            : "1px solid rgba(255,255,255,0.06)",
          boxShadow: status === "live"
            ? "0 0 80px rgba(239,68,68,0.09)"
            : "none",
          transition: "border-color 0.5s, box-shadow 0.5s",
        }}
      >
        <TwitchPlayer channel={channel} onStatusChange={handleStatusChange} />
      </div>

      {status === "offline" && (
        <p className="text-xs text-[var(--muted-foreground)] text-center mb-10">
          Canal offline — confira a próxima programação abaixo.
        </p>
      )}
      {status !== "offline" && <div className="mb-10" />}
    </>
  );
}
