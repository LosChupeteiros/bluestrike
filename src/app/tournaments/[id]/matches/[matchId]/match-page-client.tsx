"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Trophy, Crown, Swords, Clock, Check, Copy, Wifi,
  Loader2, AlertTriangle, Server, X, Star, Eye, EyeOff,
  ChevronDown, ChevronUp, Terminal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FullMatchDetail } from "@/lib/matches";
import { CS2_MAP_POOL, getVetoSequence, type MapPresentation } from "@/lib/maps";
import { playReadyOne, playReadyBoth, playVeto, playVetoDone, playServerReady } from "@/lib/sounds";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  detail: FullMatchDetail;
  tournamentId: string;
  roundLabel: string;
  isFinal: boolean;
  currentProfileId: string | null;
  userTeamId: string | null;
  isCaptain: boolean;
  isPlayer: boolean;
  isAdmin: boolean;
}

interface PollData {
  status: string;
  readyTeam1: boolean;
  readyTeam2: boolean;
  server: ServerInfo | null;
}

interface ServerInfo {
  status: string;
  rawIp: string | null;
  ip: string;
  port: number;
  gotvPort: number | null;
  connectString: string | null;
  password: string | null;
}

type VetoEntry = FullMatchDetail["vetoes"][0];

const STATUS_LABEL: Record<string, string> = {
  pending:   "Aguardando",
  veto:      "Veto de mapa",
  pre_live:  "Confirmando início",
  live:      "Iniciando",
  finished:  "Finalizado",
  walkover:  "W.O.",
  cancelled: "Cancelado",
};

const STATUS_VARIANT: Record<string, "open" | "ongoing" | "finished" | "upcoming" | "live"> = {
  pending:   "upcoming",
  veto:      "upcoming",
  pre_live:  "ongoing",
  live:      "live",
  finished:  "finished",
  walkover:  "finished",
  cancelled: "finished",
};

// ── Small utilities ────────────────────────────────────────────────────────────

function useCopyStr(value: string) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return { copied, copy };
}

function SmallAvatar({ nickname, avatarUrl }: { nickname: string; avatarUrl: string | null }) {
  return (
    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-[var(--border)]">
      {avatarUrl ? (
        <Image src={avatarUrl} alt={nickname} fill className="object-cover" unoptimized />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[var(--secondary)] text-[9px] font-bold text-[var(--muted-foreground)]">
          {nickname[0]?.toUpperCase()}
        </div>
      )}
    </div>
  );
}

// ── Ready panel ────────────────────────────────────────────────────────────────

function ReadyPanel({
  matchId, phase, isCaptain, readyTeam1, readyTeam2,
  userIsTeam1, team1Tag, team2Tag, team1Name, team2Name,
}: {
  matchId: string; phase: "pre_veto" | "pre_live"; isCaptain: boolean;
  readyTeam1: boolean; readyTeam2: boolean; userIsTeam1: boolean | null;
  team1Tag: string; team2Tag: string; team1Name: string; team2Name: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localReady, setLocalReady] = useState(false);
  const prevR1 = useRef(readyTeam1);
  const prevR2 = useRef(readyTeam2);

  useEffect(() => {
    if (readyTeam1 !== prevR1.current || readyTeam2 !== prevR2.current) {
      if (readyTeam1 && readyTeam2) playReadyBoth();
      else playReadyOne();
      prevR1.current = readyTeam1;
      prevR2.current = readyTeam2;
    }
  }, [readyTeam1, readyTeam2]);

  const myReady = localReady || (userIsTeam1 === true ? readyTeam1 : userIsTeam1 === false ? readyTeam2 : false);
  const bothReady = readyTeam1 && readyTeam2;

  async function ready() {
    setError(null); setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/ready`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erro.");
      else { setLocalReady(true); playReadyOne(); }
    } catch { setError("Erro de rede."); }
    finally { setLoading(false); }
  }

  const title = phase === "pre_veto" ? "Check-in" : "Confirmar início";
  const subtitle = phase === "pre_veto"
    ? "Ambos os times devem confirmar para iniciar o veto"
    : "Veto concluído — confirmem para iniciar o servidor";

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] bg-[var(--secondary)]/40 px-5 py-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">{title}</div>
        <div className="text-[10px] text-[var(--muted-foreground)]">{subtitle}</div>
      </div>

      <div className="grid grid-cols-[1fr_48px_1fr] items-center gap-2 px-5 py-5">
        {/* Team 1 */}
        <div className="flex flex-col items-center gap-2">
          <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl border-2 text-base font-black transition-all ${
            readyTeam1
              ? "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_16px_rgba(34,197,94,0.2)]"
              : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]"
          }`}>
            {team1Tag}
            {readyTeam1 && (
              <div className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-[var(--foreground)] truncate max-w-[90px]">{team1Name}</div>
            <div className={`text-[10px] font-semibold ${readyTeam1 ? "text-green-400" : "text-[var(--muted-foreground)]"}`}>
              {readyTeam1 ? "✓ READY" : "Aguardando"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Swords className={`h-5 w-5 transition-all ${bothReady ? "text-[var(--primary)] drop-shadow-[0_0_6px_var(--primary)]" : "text-[var(--muted-foreground)]"}`} />
        </div>

        {/* Team 2 */}
        <div className="flex flex-col items-center gap-2">
          <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl border-2 text-base font-black transition-all ${
            readyTeam2
              ? "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_16px_rgba(34,197,94,0.2)]"
              : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]"
          }`}>
            {team2Tag}
            {readyTeam2 && (
              <div className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-[var(--foreground)] truncate max-w-[90px]">{team2Name}</div>
            <div className={`text-[10px] font-semibold ${readyTeam2 ? "text-green-400" : "text-[var(--muted-foreground)]"}`}>
              {readyTeam2 ? "✓ READY" : "Aguardando"}
            </div>
          </div>
        </div>
      </div>

      {isCaptain && !myReady && !bothReady && (
        <div className="border-t border-[var(--border)] px-5 py-3">
          <button type="button" onClick={ready} disabled={loading}
            className="w-full rounded-xl bg-[var(--primary)] py-2.5 text-xs font-black uppercase tracking-widest text-black transition-all hover:brightness-110 active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : "Confirmar Ready"}
          </button>
          {error && <p className="mt-1.5 text-center text-[10px] text-red-400">{error}</p>}
        </div>
      )}
      {isCaptain && myReady && !bothReady && (
        <div className="border-t border-[var(--border)] px-5 py-2.5 text-center text-[10px] text-green-400">
          <Check className="mr-1 inline h-3 w-3" />Confirmado. Aguardando adversário…
        </div>
      )}
    </div>
  );
}

// ── Veto panel ─────────────────────────────────────────────────────────────────

function VetoPanel({
  matchId, boType, existingVetoes, team1Id, team2Id,
  team1Name, team2Name, team1Tag, team2Tag,
  userTeamId, isPlayer, isVetoActive, onVetoDone,
}: {
  matchId: string; boType: 1 | 3 | 5; existingVetoes: VetoEntry[];
  team1Id: string | null; team2Id: string | null;
  team1Name: string; team2Name: string; team1Tag: string; team2Tag: string;
  userTeamId: string | null; isPlayer: boolean; isVetoActive: boolean;
  onVetoDone?: () => void;
}) {
  const sequence = getVetoSequence(boType);
  const [vetoes, setVetoes] = useState(existingVetoes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevCount = useRef(existingVetoes.length);

  useEffect(() => {
    if (existingVetoes.length > vetoes.length) setVetoes(existingVetoes);
  }, [existingVetoes, vetoes.length]);

  useEffect(() => {
    if (vetoes.length > prevCount.current) {
      if (vetoes.length >= sequence.length) playVetoDone();
      else playVeto();
      prevCount.current = vetoes.length;
    }
  }, [vetoes.length, sequence.length]);

  const currentStep = vetoes.length;
  const isDone = currentStep >= sequence.length;
  const currentSlot = isDone ? null : sequence[currentStep];
  const myTurn = isVetoActive && !isDone && userTeamId !== null && (
    (currentSlot!.turn === "team1" && userTeamId === team1Id) ||
    (currentSlot!.turn === "team2" && userTeamId === team2Id)
  );

  const usedMaps = new Set(vetoes.map((v) => v.mapName));
  const picks = vetoes.filter((v) => v.action === "pick").map((v) => v.mapName);
  const bans = new Set(vetoes.filter((v) => v.action === "ban").map((v) => v.mapName));
  const decider = isDone
    ? CS2_MAP_POOL.find((m) => !picks.includes(m.name) && !bans.has(m.name))?.name ?? null
    : null;

  const activeTeamName = currentSlot ? (currentSlot.turn === "team1" ? team1Name : team2Name) : null;
  const activeTeamTag = currentSlot ? (currentSlot.turn === "team1" ? team1Tag : team2Tag) : null;

  async function submitVeto(mapName: string) {
    if (!myTurn || loading) return;
    setError(null); setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/veto`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mapName }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro."); }
      else {
        const newVeto: VetoEntry = {
          id: `tmp-${vetoes.length}`, matchId, teamId: userTeamId!,
          action: currentSlot!.action, mapName, vetoOrder: vetoes.length + 1,
          pickedSide: null, createdAt: new Date().toISOString(),
        };
        const next = [...vetoes, newVeto];
        setVetoes(next);
        if (next.length >= sequence.length) { playVetoDone(); onVetoDone?.(); }
        else playVeto();
        prevCount.current = next.length;
      }
    } catch { setError("Erro de rede."); }
    finally { setLoading(false); }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-2.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Veto — {boType === 1 ? "BO1" : boType === 3 ? "BO3" : "BO5"}
        </span>
        <div className="flex items-center gap-1">
          {sequence.map((slot, i) => {
            const done = i < vetoes.length;
            const active = i === currentStep;
            return (
              <div key={i} className={`h-1.5 w-1.5 rounded-full transition-all ${
                done ? (slot.action === "ban" ? "bg-red-500" : "bg-[var(--primary)]")
                     : active ? "animate-pulse bg-[var(--primary)]/50" : "bg-[var(--border)]"
              }`} />
            );
          })}
          <span className="ml-1.5 text-[10px] font-mono text-[var(--muted-foreground)]">
            {currentStep}/{sequence.length}
          </span>
        </div>
      </div>

      {/* Who's vetoing */}
      {isVetoActive && !isDone && activeTeamName && (
        <div className="flex items-center gap-3 border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/5 to-transparent px-5 py-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-sm font-black text-[var(--primary)]">
            {activeTeamTag}
          </div>
          <div>
            <div className="text-base font-black text-[var(--foreground)]">{activeTeamName}</div>
            <div className="text-[11px] text-[var(--muted-foreground)]">
              está escolhendo um mapa para{" "}
              <span className={`font-bold ${currentSlot?.action === "ban" ? "text-red-400" : "text-[var(--primary)]"}`}>
                {currentSlot?.action === "ban" ? "vetar" : "escolher"}
              </span>
            </div>
          </div>
          {myTurn && (
            <span className="ml-auto animate-pulse rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">
              Sua vez
            </span>
          )}
        </div>
      )}

      {isDone && (
        <div className="flex flex-wrap items-center gap-2.5 border-b border-[var(--border)] bg-[var(--primary)]/5 px-5 py-3">
          <Check className="h-4 w-4 shrink-0 text-[var(--primary)]" />
          <span className="text-sm font-bold text-[var(--primary)]">Veto concluído</span>
          <div className="flex flex-wrap gap-1.5">
            {picks.map((m) => (
              <span key={m} className="rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">{m}</span>
            ))}
            {decider && (
              <span className="rounded-full border border-[var(--primary)]/40 bg-[var(--primary)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                {decider} <span className="opacity-60">(decider)</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Map grid */}
      <div className="grid grid-cols-4 gap-1.5 p-3 sm:grid-cols-5 lg:grid-cols-7">
        {CS2_MAP_POOL.map((map) => {
          const vetoEntry = vetoes.find((v) => v.mapName === map.name);
          const isBanned = vetoEntry?.action === "ban";
          const isPicked = vetoEntry?.action === "pick";
          const isDecider = isDone && map.name === decider;
          const isSelectable = myTurn && !usedMaps.has(map.name) && !loading;
          return (
            <button key={map.name} type="button" disabled={!isSelectable}
              onClick={() => isSelectable && submitVeto(map.name)}
              className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                isBanned ? "border-red-900/30 opacity-25"
                : isPicked || isDecider ? "border-[var(--primary)] shadow-[0_0_12px_rgba(0,200,255,0.18)]"
                : isSelectable ? "cursor-pointer border-[var(--border)] hover:border-[var(--primary)]/60 hover:scale-[1.03]"
                : "cursor-default border-[var(--border)]"
              }`}
            >
              <div className="relative aspect-[3/4]">
                <Image src={map.localImage} alt={map.name} fill sizes="14vw"
                  className={`object-cover transition-transform duration-300 ${isBanned ? "grayscale" : "group-hover:scale-105"}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                {isBanned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <X className="h-6 w-6 text-red-500 drop-shadow-lg" />
                  </div>
                )}
                {(isPicked || isDecider) && (
                  <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)]">
                    <Star className="h-2.5 w-2.5 text-black" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1">
                  <div className="text-[9px] font-black uppercase tracking-wide text-white drop-shadow">{map.name}</div>
                  {isBanned && <div className="text-[8px] font-bold text-red-400">VETADO</div>}
                  {isPicked && <div className="text-[8px] font-bold text-[var(--primary)]">ESCOLHIDO</div>}
                  {isDecider && <div className="text-[8px] font-bold text-[var(--primary)]">DECIDER</div>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mx-3 mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-[11px] text-red-400">{error}</div>
      )}
    </div>
  );
}

// ── Post-veto panel: ready (left) + server/connect (right) ────────────────────

function PostVetoPanel({
  matchId, tournamentId,
  team1Tag, team2Tag, team1Name, team2Name,
  isCaptain, isPlayer, isAdmin,
  readyTeam1, readyTeam2, userIsTeam1,
  server, chosenMap, isPreLive,
}: {
  matchId: string; tournamentId: string;
  team1Tag: string; team2Tag: string; team1Name: string; team2Name: string;
  isCaptain: boolean; isPlayer: boolean; isAdmin: boolean;
  readyTeam1: boolean; readyTeam2: boolean; userIsTeam1: boolean | null;
  server: ServerInfo | null; chosenMap: MapPresentation | null; isPreLive: boolean;
}) {
  const [readyLoading, setReadyLoading] = useState(false);
  const [readyError, setReadyError] = useState<string | null>(null);
  const [localReady, setLocalReady] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const prevR1 = useRef(readyTeam1);
  const prevR2 = useRef(readyTeam2);
  const prevHasConn = useRef(false);

  const isError = server?.status === "error";
  const ip = server?.rawIp ?? server?.ip ?? null;
  const hasConnection = Boolean(server && !isError && ip && server.port > 0 && server.password);
  const isServerLive = server?.status === "live";
  const connectCmd = hasConnection ? `connect ${ip}:${server!.port}; password ${server!.password}` : "";
  const steamUrl = hasConnection
    ? (server!.connectString ?? `steam://connect/${ip}:${server!.port}/${server!.password}`)
    : "#";
  const { copied, copy: copyCmd } = useCopyStr(connectCmd);

  // Sound: ready state change
  useEffect(() => {
    if (readyTeam1 !== prevR1.current || readyTeam2 !== prevR2.current) {
      if (readyTeam1 && readyTeam2) playReadyBoth();
      else playReadyOne();
      prevR1.current = readyTeam1;
      prevR2.current = readyTeam2;
    }
  }, [readyTeam1, readyTeam2]);

  // Sound: server connect info just became available
  useEffect(() => {
    if (hasConnection && !prevHasConn.current) playServerReady();
    prevHasConn.current = hasConnection;
  }, [hasConnection]);

  const myReady = localReady || (userIsTeam1 === true ? readyTeam1 : userIsTeam1 === false ? readyTeam2 : false);
  const bothReady = readyTeam1 && readyTeam2;

  async function confirmReady() {
    setReadyError(null); setReadyLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/ready`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setReadyError(data.error ?? "Erro.");
      else { setLocalReady(true); playReadyOne(); }
    } catch { setReadyError("Erro de rede."); }
    finally { setReadyLoading(false); }
  }

  async function retryProvision() {
    setRetrying(true); setRetryError(null);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/provision`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setRetryError(data.error ?? "Erro.");
    } catch { setRetryError("Erro de rede."); }
    finally { setRetrying(false); }
  }

  const matchUrl = typeof window !== "undefined"
    ? `${window.location.origin}/tournaments/${tournamentId}/matches/${matchId}`
    : "";
  const waText = encodeURIComponent(`⚠️ BlueStrike — Servidor não alocado\nPartida: ${team1Name} vs ${team2Name}\nMatch ID: ${matchId}\nURL: ${matchUrl}`);
  const waUrl = `https://wa.me/5511961223798?text=${waText}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">

        {/* ── LEFT: Confirm ready ── */}
        <div className="flex flex-col gap-4 p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
            Confirmar início
          </div>

          {isPreLive ? (
            <>
              {/* Team ready indicators */}
              <div className="grid grid-cols-[1fr_28px_1fr] items-center gap-2">
                <div className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-300 ${
                  readyTeam1 ? "border-green-500/40 bg-green-500/5 shadow-[0_0_12px_rgba(34,197,94,0.08)]" : "border-[var(--border)] bg-[var(--secondary)]/40"
                }`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-black transition-all duration-300 ${
                    readyTeam1 ? "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]" : "border-[var(--border)] text-[var(--foreground)]"
                  }`}>
                    {readyTeam1 ? <Check className="h-4 w-4" /> : team1Tag}
                  </div>
                  <div className={`text-[10px] font-bold transition-colors ${readyTeam1 ? "text-green-400" : "text-[var(--muted-foreground)]"}`}>
                    {readyTeam1 ? "READY" : "Aguardando"}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <Swords className={`h-3.5 w-3.5 transition-colors duration-300 ${bothReady ? "text-[var(--primary)]" : "text-[var(--border)]"}`} />
                </div>

                <div className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-300 ${
                  readyTeam2 ? "border-green-500/40 bg-green-500/5 shadow-[0_0_12px_rgba(34,197,94,0.08)]" : "border-[var(--border)] bg-[var(--secondary)]/40"
                }`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-black transition-all duration-300 ${
                    readyTeam2 ? "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]" : "border-[var(--border)] text-[var(--foreground)]"
                  }`}>
                    {readyTeam2 ? <Check className="h-4 w-4" /> : team2Tag}
                  </div>
                  <div className={`text-[10px] font-bold transition-colors ${readyTeam2 ? "text-green-400" : "text-[var(--muted-foreground)]"}`}>
                    {readyTeam2 ? "READY" : "Aguardando"}
                  </div>
                </div>
              </div>

              {isCaptain && !myReady && (
                <button type="button" onClick={confirmReady} disabled={readyLoading}
                  className="w-full rounded-xl bg-[var(--primary)] py-2.5 text-xs font-black uppercase tracking-widest text-black shadow-[0_0_16px_rgba(0,200,255,0.2)] transition-all hover:brightness-110 hover:shadow-[0_0_24px_rgba(0,200,255,0.3)] active:scale-[0.98] disabled:opacity-50">
                  {readyLoading ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : "Confirmar Ready"}
                </button>
              )}
              {isCaptain && myReady && !bothReady && (
                <div className="flex items-center justify-center gap-1.5 rounded-xl border border-green-500/20 bg-green-500/5 py-2.5 text-[10px] text-green-400">
                  <Check className="h-3 w-3" /> Confirmado. Aguardando adversário…
                </div>
              )}
              {readyError && <p className="text-center text-[10px] text-red-400">{readyError}</p>}
            </>
          ) : (
            /* Both confirmed — steady green state */
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-green-500 bg-green-500/10 shadow-[0_0_24px_rgba(34,197,94,0.2)]">
                <Check className="h-6 w-6 text-green-400" />
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-green-400">Ambos confirmados</div>
                <div className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">Iniciando servidor CS2…</div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Server / Connect ── */}
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Servidor</div>
            {isServerLive && (
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.9)]" />
                <span className="text-[10px] font-bold text-green-400">Ao vivo</span>
              </div>
            )}
          </div>

          {/* ── Error ── */}
          {isError ? (
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <div>
                  <div className="text-xs font-bold text-red-300">Falha ao alocar servidor</div>
                  <div className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">Ocorreu um erro ao iniciar o CS2.</div>
                </div>
              </div>
              {isAdmin && (
                <button type="button" onClick={retryProvision} disabled={retrying}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 py-2.5 text-xs font-bold text-[var(--primary)] transition-all hover:bg-[var(--primary)]/15 disabled:opacity-50">
                  {retrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Server className="h-3.5 w-3.5" />}
                  {retrying ? "Procurando…" : "Tentar novamente"}
                </button>
              )}
              {retryError && <p className="text-center text-[10px] text-red-400">{retryError}</p>}
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-green-600/25 bg-green-600/8 py-2.5 text-xs font-semibold text-green-400 transition-all hover:bg-green-600/14">
                Chamar administrador
              </a>
            </div>

          ) : !hasConnection ? (
            /* ── Loading / provisioning ── */
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-4">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-[var(--primary)]/8" />
                <div className="absolute inset-0 animate-ping rounded-full bg-[var(--primary)]/5 [animation-delay:0.4s]" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/5">
                  <Server className="h-7 w-7 text-[var(--primary)]/50" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-[var(--foreground)]">
                  {server ? "Servidor iniciando…" : "Aguardando servidor…"}
                </div>
                <div className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                  {server ? "O CS2 está carregando o mapa." : "Alocando servidor dedicado."}
                </div>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--primary)]/40"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>

          ) : (
            /* ── Connect unlocked ── */
            <div className="flex flex-1 flex-col gap-3">
              {/* Map chip */}
              {chosenMap && (
                <div className="relative h-[72px] overflow-hidden rounded-xl">
                  <Image src={chosenMap.localImage} alt={chosenMap.name} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-2 left-2.5">
                    <span className="rounded bg-black/70 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                      {chosenMap.name}
                    </span>
                  </div>
                  <div className="absolute right-2 top-2">
                    <span className="rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/15 px-2 py-0.5 text-[9px] font-bold text-[var(--primary)]">
                      Servidor pronto
                    </span>
                  </div>
                </div>
              )}

              {isPlayer ? (
                <>
                  <a href={steamUrl}
                    className="flex items-center justify-center gap-2.5 rounded-xl bg-[var(--primary)] py-3 text-sm font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(0,200,255,0.25)] transition-all hover:brightness-110 hover:shadow-[0_0_32px_rgba(0,200,255,0.35)] active:scale-[0.98]">
                    <Wifi className="h-4 w-4" /> Entrar no servidor
                  </a>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Comando CS2</span>
                      <button type="button" onClick={() => setRevealed((v) => !v)}
                        className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                        {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {revealed ? "ocultar" : "revelar"}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-black/40 px-3 py-2.5">
                      <code className="flex-1 break-all font-mono text-xs text-[var(--foreground)] select-all">
                        {revealed ? connectCmd : "●".repeat(Math.min(connectCmd.length, 38))}
                      </code>
                      <button type="button" onClick={copyCmd} title="Copiar"
                        className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                        {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-[var(--muted-foreground)]">Conexão disponível apenas para os jogadores da partida.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Admin Dathost logs ─────────────────────────────────────────────────────────

interface DathostLog {
  id: string; method: string; url: string;
  request_body: unknown; response_status: number | null;
  response_body: unknown; error_message: string | null;
  created_at: string;
}

function DathostLogsPanel({ matchId }: { matchId: string }) {
  const [logs, setLogs] = useState<DathostLog[]>([]);
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/dathost-logs`);
      if (res.ok) { const d = await res.json(); setLogs(d.logs ?? []); }
    } finally { setLoading(false); }
  }, [matchId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { const id = setInterval(fetchLogs, 5000); return () => clearInterval(id); }, [fetchLogs]);

  function statusColor(code: number | null) {
    if (!code) return "text-red-400";
    if (code >= 200 && code < 300) return "text-green-400";
    if (code >= 400) return "text-red-400";
    return "text-yellow-400";
  }
  function pathOf(url: string) { try { return new URL(url).pathname; } catch { return url; } }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0a0a0a]">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b border-[var(--border)] px-5 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-[var(--primary)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Dathost API Console</span>
          {logs.length > 0 && (
            <span className="rounded-full bg-[var(--primary)]/10 px-1.5 py-0.5 text-[9px] font-mono text-[var(--primary)]">{logs.length}</span>
          )}
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-[var(--muted-foreground)]" /> : <ChevronDown className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />}
      </button>

      {open && (
        <div className="max-h-[360px] overflow-y-auto font-mono text-xs">
          {loading && <div className="px-5 py-3 text-[var(--muted-foreground)]">Carregando…</div>}
          {!loading && logs.length === 0 && <div className="px-5 py-3 text-[var(--muted-foreground)]">Nenhuma requisição registrada.</div>}
          {logs.map((log, i) => {
            const isExp = expanded[log.id];
            return (
              <div key={log.id} className="border-b border-[#1a1a1a]">
                <button type="button" onClick={() => setExpanded((e) => ({ ...e, [log.id]: !e[log.id] }))}
                  className="flex w-full items-center gap-2.5 px-5 py-2.5 text-left hover:bg-white/[0.02] transition-colors">
                  <span className="w-6 text-[9px] text-[#555]">{logs.length - i}</span>
                  <span className={`w-9 font-bold ${log.method === "GET" ? "text-blue-400" : log.method === "POST" ? "text-green-400" : "text-yellow-400"}`}>{log.method}</span>
                  <span className="flex-1 truncate text-[#ccc]">{pathOf(log.url)}</span>
                  {log.response_status && <span className={`w-9 text-right font-bold ${statusColor(log.response_status)}`}>{log.response_status}</span>}
                  {log.error_message && <span className="text-red-400">✗</span>}
                  <span className="w-16 text-right text-[9px] text-[#555]">
                    {new Date(log.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  {isExp ? <ChevronUp className="h-3 w-3 text-[#555]" /> : <ChevronDown className="h-3 w-3 text-[#555]" />}
                </button>
                {isExp && (
                  <div className="border-t border-[#1a1a1a] bg-[#070707] px-5 py-3 space-y-2.5">
                    <div>
                      <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-[#555]">URL</div>
                      <div className="break-all text-[10px] text-[#aaa]">{log.url}</div>
                    </div>
                    {log.request_body !== null && log.request_body !== undefined && (
                      <div>
                        <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-[#555]">Request</div>
                        <pre className="overflow-x-auto rounded bg-black/60 p-2 text-[10px] leading-relaxed text-[#88c8a8]">
                          {JSON.stringify(log.request_body as Record<string, unknown>, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.response_body !== null && (
                      <div>
                        <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-[#555]">Response</div>
                        <pre className={`overflow-x-auto rounded bg-black/60 p-2 text-[10px] leading-relaxed ${statusColor(log.response_status)}`}>
                          {typeof log.response_body === "string" ? log.response_body : JSON.stringify(log.response_body, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.error_message && (
                      <div>
                        <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-red-400/60">Erro</div>
                        <div className="rounded bg-red-500/10 px-2 py-1.5 text-[10px] text-red-400">{log.error_message}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Deadline ──────────────────────────────────────────────────────────────────

function DeadlinePanel({ teamsAssignedAt }: { teamsAssignedAt: string | null }) {
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick((n) => n + 1), 60_000); return () => clearInterval(id); }, []);
  if (!teamsAssignedAt) return null;
  const msLeft = new Date(teamsAssignedAt).getTime() + 3_600_000 - Date.now();
  if (msLeft <= 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
        <p className="text-[11px] text-red-400/90">Prazo de 1 hora expirado. Times sujeitos a penalidades.</p>
      </div>
    );
  }
  const mins = Math.floor(msLeft / 60_000);
  const label = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}min` : `${mins}min`;
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
      <p className="text-[11px] text-[var(--muted-foreground)]">
        Prazo: <strong className="text-[var(--foreground)]">{label} restantes</strong> — após isso, os times ficam sujeitos a penalidades.
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MatchPageClient({
  detail, tournamentId, roundLabel, isFinal,
  userTeamId, isCaptain, isPlayer, isAdmin,
}: Props) {
  const { match, team1Members, team2Members } = detail;

  const [poll, setPoll] = useState<PollData | null>(null);
  const [polledVetoes, setPolledVetoes] = useState<VetoEntry[] | null>(null);

  const effectiveStatus = poll?.status ?? match.status;
  const effectiveReadyTeam1 = poll?.readyTeam1 ?? match.readyTeam1;
  const effectiveReadyTeam2 = poll?.readyTeam2 ?? match.readyTeam2;
  const effectiveVetoes = polledVetoes ?? detail.vetoes;
  const effectiveServer: ServerInfo | null = poll?.server ?? (detail.server as ServerInfo | null);

  const isFinished = effectiveStatus === "finished" || effectiveStatus === "walkover";
  const isVetoActive = effectiveStatus === "veto";
  const isPreLive = effectiveStatus === "pre_live";
  const sequence = getVetoSequence(match.boType);
  const vetoDone = effectiveVetoes.length >= sequence.length;
  const bothTeamsDefined = Boolean(match.team1Id && match.team2Id);

  // Derive chosen map from veto history for ServerPanel
  const picks = effectiveVetoes.filter((v) => v.action === "pick").map((v) => v.mapName);
  const vetoedBans = new Set(effectiveVetoes.filter((v) => v.action === "ban").map((v) => v.mapName));
  const chosenMap = vetoDone
    ? (CS2_MAP_POOL.find((m) => m.name === picks[0]) ??
       CS2_MAP_POOL.find((m) => !picks.includes(m.name) && !vetoedBans.has(m.name)) ??
       null)
    : null;

  // "Ao vivo" badge only when server confirms match_started (server.status === "live")
  const isMatchLive = effectiveStatus === "live" && effectiveServer?.status === "live";
  const displayStatusLabel = isMatchLive ? "Ao vivo" : (STATUS_LABEL[effectiveStatus] ?? effectiveStatus);
  const displayStatusVariant = isMatchLive ? "live" : (STATUS_VARIANT[effectiveStatus] ?? "upcoming");

  const winner = isFinished
    ? (match.winnerId === match.team1Id ? match.team1 : match.team2)
    : null;

  const t1Name = match.team1?.name ?? "Time 1";
  const t2Name = match.team2?.name ?? "Time 2";
  const t1Tag  = match.team1?.tag ?? "?";
  const t2Tag  = match.team2?.tag ?? "?";
  const userIsTeam1 = userTeamId ? userTeamId === match.team1Id : null;

  const interval = isVetoActive ? 1500 : 3500;
  const shouldPoll = !isFinished && effectiveStatus !== "cancelled";

  const doPoll = useCallback(async () => {
    try {
      const [sRes, vRes] = await Promise.all([
        fetch(`/api/matches/${match.id}/status`, { cache: "no-store" }),
        fetch(`/api/matches/${match.id}/vetoes`, { cache: "no-store" }),
      ]);
      if (sRes.ok) setPoll(await sRes.json());
      if (vRes.ok) { const d = await vRes.json(); if (Array.isArray(d.vetoes)) setPolledVetoes(d.vetoes); }
    } catch { /* ignore */ }
  }, [match.id]);

  useEffect(() => {
    if (!shouldPoll) return;
    const id = setInterval(doPoll, interval);
    return () => clearInterval(id);
  }, [shouldPoll, doPoll, interval]);

  return (
    <div className="space-y-3">

      {/* ── Hero: badges + teams + players ── */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="relative px-5 py-6">
          <div className="absolute inset-0 grid-bg opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/60 via-slate-900/40 to-black/70" />
          <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[var(--primary)]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent" />

          <div className="relative">
            {/* Centered status badges */}
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
              <Badge variant={displayStatusVariant}>
                {isMatchLive && <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />}
                {displayStatusLabel}
              </Badge>
              <Badge variant="secondary">{roundLabel}</Badge>
              <Badge variant="secondary">{match.boType === 1 ? "BO1" : match.boType === 3 ? "BO3" : "BO5"}</Badge>
            </div>

            {/* 5-col: [25% players] [35% team1] [VS] [35% team2] [25% players] */}
            <div className="grid grid-cols-[5fr_7fr_32px_7fr_5fr] items-center gap-x-2">

              {/* Col 1 — Team 1 players: avatar → nick, left-aligned */}
              <div className="flex flex-col gap-1.5 min-w-0">
                {team1Members.map((m) => (
                  <div key={m.profileId} className="flex min-w-0 items-center gap-1.5">
                    <SmallAvatar nickname={m.nickname} avatarUrl={m.avatarUrl} />
                    <span className="truncate text-[11px] font-bold text-white">{m.nickname}</span>
                  </div>
                ))}
              </div>

              {/* Col 2 — Team 1 info, centered */}
              <div className="flex flex-col items-center gap-2">
                <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border-2 bg-gradient-to-br from-slate-800 to-slate-950 text-2xl font-black transition-all ${
                  isFinished && winner?.id === match.team1Id
                    ? "border-green-500 text-green-400 shadow-[0_0_24px_rgba(34,197,94,0.3)]"
                    : "border-[var(--border)] text-[var(--primary)]"
                }`}>{t1Tag}</div>
                <div className="text-center">
                  <div className={`text-sm font-black leading-tight ${isFinished && winner?.id === match.team1Id ? "text-green-400" : "text-[var(--foreground)]"}`}>{t1Name}</div>
                  {match.team1 && <div className="text-[10px] text-[var(--muted-foreground)]">{match.team1.elo} ELO</div>}
                  {isFinished && winner?.id === match.team1Id && (
                    <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-bold text-green-400">
                      <Crown className="h-3 w-3" /> Vencedor
                    </div>
                  )}
                </div>
              </div>

              {/* Col 3 — VS swords, fixed 32 px column */}
              <div className="flex flex-col items-center justify-center gap-1">
                <Swords className={`h-5 w-5 transition-colors ${isFinished ? "text-[var(--muted-foreground)]/30" : "text-[var(--primary)] opacity-70 drop-shadow-[0_0_6px_var(--primary)]"}`} />
              </div>

              {/* Col 4 — Team 2 info, centered */}
              <div className="flex flex-col items-center gap-2">
                <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border-2 bg-gradient-to-br from-slate-800 to-slate-950 text-2xl font-black transition-all ${
                  isFinished && winner?.id === match.team2Id
                    ? "border-green-500 text-green-400 shadow-[0_0_24px_rgba(34,197,94,0.3)]"
                    : "border-[var(--border)] text-[var(--primary)]"
                }`}>{t2Tag}</div>
                <div className="text-center">
                  <div className={`text-sm font-black leading-tight ${isFinished && winner?.id === match.team2Id ? "text-green-400" : "text-[var(--foreground)]"}`}>{t2Name}</div>
                  {match.team2 && <div className="text-[10px] text-[var(--muted-foreground)]">{match.team2.elo} ELO</div>}
                  {isFinished && winner?.id === match.team2Id && (
                    <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-bold text-green-400">
                      <Crown className="h-3 w-3" /> Vencedor
                    </div>
                  )}
                </div>
              </div>

              {/* Col 5 — Team 2 players: nick → avatar, right-aligned */}
              <div className="flex flex-col gap-1.5 min-w-0">
                {team2Members.map((m) => (
                  <div key={m.profileId} className="flex min-w-0 items-center justify-end gap-1.5">
                    <span className="truncate text-[11px] font-bold text-white">{m.nickname}</span>
                    <SmallAvatar nickname={m.nickname} avatarUrl={m.avatarUrl} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isFinished && winner && (
          <div className="border-t border-[var(--border)] px-5 py-3">
            <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
              <Trophy className="h-4 w-4 shrink-0 text-yellow-400" />
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-yellow-400/60">
                  {isFinal ? "Campeão do torneio" : "Avança para próxima fase"}
                </div>
                <div className="text-sm font-black text-yellow-400">{winner.name}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Deadline ── */}
      {!isFinished && match.teamsAssignedAt && <DeadlinePanel teamsAssignedAt={match.teamsAssignedAt} />}

      {/* ── Awaiting opponent ── */}
      {effectiveStatus === "pending" && !bothTeamsDefined && (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">Aguardando adversário — a outra partida ainda não terminou.</p>
        </div>
      )}

      {/* ── Phase 1 ready (pre-veto) ── */}
      {effectiveStatus === "pending" && bothTeamsDefined && (isCaptain || isPlayer) && (
        <ReadyPanel matchId={match.id} phase="pre_veto" isCaptain={isCaptain}
          readyTeam1={effectiveReadyTeam1} readyTeam2={effectiveReadyTeam2}
          userIsTeam1={userIsTeam1} team1Tag={t1Tag} team2Tag={t2Tag}
          team1Name={t1Name} team2Name={t2Name} />
      )}

      {/* ── Post-veto: ready (left) + server/connect (right) ── */}
      {vetoDone && (isPreLive || effectiveStatus === "live" || effectiveServer !== null) && (
        <PostVetoPanel
          matchId={match.id} tournamentId={tournamentId}
          team1Tag={t1Tag} team2Tag={t2Tag} team1Name={t1Name} team2Name={t2Name}
          isCaptain={isCaptain} isPlayer={isPlayer} isAdmin={isAdmin}
          readyTeam1={effectiveReadyTeam1} readyTeam2={effectiveReadyTeam2}
          userIsTeam1={userIsTeam1}
          server={effectiveServer} chosenMap={chosenMap} isPreLive={isPreLive}
        />
      )}

      {/* ── Veto panel ── */}
      {(isVetoActive || effectiveVetoes.length > 0) && (
        <VetoPanel matchId={match.id} boType={match.boType} existingVetoes={effectiveVetoes}
          team1Id={match.team1Id} team2Id={match.team2Id}
          team1Name={t1Name} team2Name={t2Name} team1Tag={t1Tag} team2Tag={t2Tag}
          userTeamId={userTeamId} isPlayer={isPlayer} isVetoActive={isVetoActive}
          onVetoDone={doPoll} />
      )}

      {/* ── Admin result form ── */}
      {isAdmin && !isFinished && match.team1Id && match.team2Id && (
        <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--card)] p-5">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Registrar Resultado (Admin)</h3>
          <AdminResultForm matchId={match.id} tournamentId={tournamentId}
            team1={{ id: match.team1Id, name: t1Name }}
            team2={{ id: match.team2Id, name: t2Name }} />
        </div>
      )}

      {/* ── Admin Dathost console ── */}
      {isAdmin && <DathostLogsPanel matchId={match.id} />}

    </div>
  );
}

// ── Admin result form ─────────────────────────────────────────────────────────

function AdminResultForm({ matchId, tournamentId, team1, team2 }: {
  matchId: string; tournamentId: string;
  team1: { id: string; name: string }; team2: { id: string; name: string };
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!selected) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/result`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId: selected }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erro.");
      else window.location.href = `/tournaments/${tournamentId}?tab=bracket`;
    } catch { setError("Erro de rede."); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        {[team1, team2].map((t) => (
          <button key={t.id} type="button" onClick={() => setSelected(t.id)}
            className={`rounded-xl border py-2.5 text-sm font-bold transition-all ${
              selected === t.id
                ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:border-[var(--primary)]/40"
            }`}>{t.name}</button>
        ))}
      </div>
      <button type="button" onClick={submit} disabled={!selected || loading}
        className="w-full rounded-xl bg-[var(--primary)] py-2.5 text-sm font-bold text-black disabled:opacity-40">
        {loading ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Confirmar resultado"}
      </button>
      {error && <p className="mt-1.5 text-center text-[10px] text-red-400">{error}</p>}
    </div>
  );
}
