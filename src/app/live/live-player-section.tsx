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
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <LiveStatusBadge status={status} />
          <div>
            <span className="text-sm font-bold text-[var(--foreground)]">BlueStrike</span>
            <span className="text-sm text-[var(--muted-foreground)]"> | CS2 | Twitch</span>
          </div>
        </div>

        <a
          href={`https://twitch.tv/${channel}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 self-start rounded-lg border border-[var(--border-strong)] bg-white px-4 py-2 text-sm font-semibold transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] sm:self-auto"
        >
          <Tv className="w-4 h-4" />
          Seguir na Twitch
        </a>
      </div>

      {/* ── Player ───────────────────────────────────────────────────────── */}
      <div className={`mb-2 overflow-hidden rounded-2xl border bg-[#05080d] ${status === "live" ? "border-red-300" : "border-slate-800"}`}>
        <TwitchPlayer channel={channel} onStatusChange={handleStatusChange} />
      </div>

      {status === "offline" && (
        <p className="text-xs text-[var(--muted-foreground)] text-center mb-10">
          Canal offline. Confira a próxima programação abaixo.
        </p>
      )}
      {status !== "offline" && <div className="mb-10" />}
    </>
  );
}
