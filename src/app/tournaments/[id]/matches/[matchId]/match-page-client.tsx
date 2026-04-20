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
import { playReadyOne, playReadyBoth, playVeto, playVetoDone } from "@/lib/sounds";

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

// ── Server panel ───────────────────────────────────────────────────────────────

function ServerPanel({
  server, isPlayer, isAdmin, matchId, tournamentId, team1Name, team2Name, chosenMap,
}: {
  server: ServerInfo | null;
  isPlayer: boolean;
  isAdmin: boolean;
  matchId: string;
  tournamentId: string;
  team1Name: string;
  team2Name: string;
  chosenMap: MapPresentation | null;
}) {
  const [revealed, setRevealed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const ip = server?.rawIp ?? server?.ip ?? null;
  const isError = server?.status === "error";
  const hasConnection = server !== null && !isError && ip && server.port > 0 && server.password;

  const connectCmd = hasConnection ? `connect ${ip}:${server!.port}; password ${server!.password}` : "";
  const steamUrl = hasConnection
    ? (server!.connectString ?? `steam://connect/${ip}:${server!.port}/${server!.password}`)
    : "#";
  const { copied, copy: copyCmd } = useCopyStr(connectCmd);

  const matchUrl = typeof window !== "undefined"
    ? `${window.location.origin}/tournaments/${tournamentId}/matches/${matchId}`
    : `https://bluestrike.gg/tournaments/${tournamentId}/matches/${matchId}`;
  const waText = encodeURIComponent(
    `⚠️ BlueStrike — Servidor não alocado\nPartida: ${team1Name} vs ${team2Name}\nMatch ID: ${matchId}\nURL: ${matchUrl}`
  );
  const waUrl = `https://wa.me/5511961223798?text=${waText}`;

  async function retryProvision() {
    setRetrying(true); setRetryError(null);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/provision`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setRetryError(data.error ?? "Erro.");
    } catch { setRetryError("Erro de rede."); }
    finally { setRetrying(false); }
  }

  const WhatsAppBtn = ({ label, compact }: { label: string; compact?: boolean }) => (
    <a href={waUrl} target="_blank" rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2 rounded-xl border border-green-600/25 bg-green-600/8 font-semibold text-green-400 transition-all hover:bg-green-600/14 ${compact ? "px-4 py-2 text-xs" : "w-full py-3 text-sm"}`}>
      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      {label}
    </a>
  );

  // ── Error / no server yet ──
  if (!server || isError) {
    return (
      <div className="overflow-hidden rounded-2xl border border-red-500/20 bg-[var(--card)]">
        <div className="flex items-center gap-4 px-5 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-red-300 text-sm">
              {isError ? "Falha ao alocar servidor" : "Aguardando servidor…"}
            </div>
            <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
              {isError ? "Ocorreu um erro ao iniciar o servidor CS2." : "O servidor ainda não foi alocado."}
            </div>
          </div>
        </div>
        <div className="border-t border-[var(--border)] flex flex-col gap-2 px-5 py-3">
          {isAdmin && (
            <button type="button" onClick={retryProvision} disabled={retrying}
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 py-2.5 text-sm font-bold text-[var(--primary)] transition-all hover:bg-[var(--primary)]/15 disabled:opacity-50">
              {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Server className="h-4 w-4" />}
              {retrying ? "Procurando servidor…" : "Tentar novamente"}
            </button>
          )}
          {retryError && <p className="text-center text-[11px] text-red-400">{retryError}</p>}
          {(isPlayer || !isAdmin) && <WhatsAppBtn label="Chamar administrador" />}
        </div>
      </div>
    );
  }

  // ── Provisioning — reserved but still booting ──
  if (!hasConnection) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[var(--primary)]/20 bg-[var(--card)]">
        <div className="flex items-center gap-4 px-5 py-5">
          <div className="relative shrink-0">
            <div className="absolute inset-0 h-9 w-9 animate-ping rounded-full bg-[var(--primary)]/15" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[var(--foreground)] text-sm">Servidor iniciando…</div>
            <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">O CS2 está carregando. O botão aparece em instantes.</div>
          </div>
          {(isPlayer || !isAdmin) && <WhatsAppBtn label="Ajuda" compact />}
        </div>
      </div>
    );
  }

  // ── Ready — full connect UI ──
  const isServerLive = server.status === "live";

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--primary)]/40 bg-[var(--card)] shadow-[0_0_32px_rgba(0,200,255,0.05)]">
      <div className="grid sm:grid-cols-[180px_1fr]">
        {/* Map image */}
        {chosenMap ? (
          <div className="relative h-32 sm:h-auto overflow-hidden">
            <Image src={chosenMap.localImage} alt={chosenMap.name} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[var(--card)]/80 sm:bg-gradient-to-b sm:from-transparent sm:to-[var(--card)]/60" />
            <div className="absolute bottom-2 left-2">
              <span className="rounded bg-black/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                {chosenMap.name}
              </span>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex h-full items-center justify-center bg-[var(--secondary)]/40">
            <Server className="h-8 w-8 text-[var(--muted-foreground)]/30" />
          </div>
        )}

        {/* Connection info */}
        <div className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
              Servidor pronto
            </span>
            {isServerLive && (
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.8)]" />
                <span className="text-[10px] font-bold text-green-400">Ao vivo</span>
              </div>
            )}
          </div>

          {isPlayer ? (
            <>
              {/* Steam connect CTA */}
              <a href={steamUrl}
                className="flex items-center justify-center gap-2.5 rounded-xl bg-[var(--primary)] py-3 text-sm font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(0,200,255,0.25)] transition-all hover:brightness-110 hover:shadow-[0_0_28px_rgba(0,200,255,0.35)] active:scale-[0.98]">
                <Wifi className="h-4 w-4" />
                Entrar no servidor
              </a>

              {/* Censored command */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                    Comando CS2
                  </span>
                  <button type="button" onClick={() => setRevealed((v) => !v)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                    {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {revealed ? "ocultar" : "revelar"}
                  </button>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-black/40 px-3 py-2.5">
                  <code className="flex-1 font-mono text-xs text-[var(--foreground)] break-all select-all">
                    {revealed ? connectCmd : "●".repeat(Math.min(connectCmd.length, 44))}
                  </code>
                  <button type="button" onClick={copyCmd} title="Copiar"
                    className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                    {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-[var(--muted-foreground)]">
              Conexão disponível apenas para os jogadores da partida.
            </p>
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

            {/* Team tags + VS — centered */}
            <div className="grid grid-cols-[1fr_52px_1fr] items-center gap-3">

              <div className="flex flex-col items-center gap-1.5">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 bg-gradient-to-br from-slate-800 to-slate-950 text-xl font-black transition-all ${
                  isFinished && winner?.id === match.team1Id
                    ? "border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    : "border-[var(--border)] text-[var(--primary)]"
                }`}>{t1Tag}</div>
                <div className="text-center">
                  <div className={`text-base font-black leading-tight ${isFinished && winner?.id === match.team1Id ? "text-green-400" : "text-[var(--foreground)]"}`}>{t1Name}</div>
                  {match.team1 && <div className="text-[10px] text-[var(--muted-foreground)]">{match.team1.elo} ELO</div>}
                  {isFinished && winner?.id === match.team1Id && (
                    <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-bold text-green-400">
                      <Crown className="h-3 w-3" /> Vencedor
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Swords className="h-6 w-6 text-[var(--primary)] opacity-60" />
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 bg-gradient-to-br from-slate-800 to-slate-950 text-xl font-black transition-all ${
                  isFinished && winner?.id === match.team2Id
                    ? "border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    : "border-[var(--border)] text-[var(--primary)]"
                }`}>{t2Tag}</div>
                <div className="text-center">
                  <div className={`text-base font-black leading-tight ${isFinished && winner?.id === match.team2Id ? "text-green-400" : "text-[var(--foreground)]"}`}>{t2Name}</div>
                  {match.team2 && <div className="text-[10px] text-[var(--muted-foreground)]">{match.team2.elo} ELO</div>}
                  {isFinished && winner?.id === match.team2Id && (
                    <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-bold text-green-400">
                      <Crown className="h-3 w-3" /> Vencedor
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Players — team1 bottom-left corner, team2 bottom-right corner */}
            {(team1Members.length > 0 || team2Members.length > 0) && (
              <div className="mt-5 grid grid-cols-2 gap-4">
                {/* Team 1: avatar left, nick right — pinned to left edge */}
                <div className="space-y-1.5">
                  {team1Members.map((m) => (
                    <div key={m.profileId} className="flex items-center gap-2">
                      <SmallAvatar nickname={m.nickname} avatarUrl={m.avatarUrl} />
                      <span className="truncate text-xs font-bold text-white">{m.nickname}</span>
                    </div>
                  ))}
                </div>
                {/* Team 2: nick left, avatar right — pinned to right edge */}
                <div className="space-y-1.5">
                  {team2Members.map((m) => (
                    <div key={m.profileId} className="flex items-center justify-end gap-2">
                      <span className="truncate text-xs font-bold text-white">{m.nickname}</span>
                      <SmallAvatar nickname={m.nickname} avatarUrl={m.avatarUrl} />
                    </div>
                  ))}
                </div>
              </div>
            )}
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

      {/* ── Server panel — ABOVE veto map grid (priority) ── */}
      {vetoDone && (effectiveStatus === "live" || effectiveStatus === "pre_live" || effectiveServer !== null) && (
        <ServerPanel server={effectiveServer} isPlayer={isPlayer} isAdmin={isAdmin}
          matchId={match.id} tournamentId={tournamentId}
          team1Name={t1Name} team2Name={t2Name} chosenMap={chosenMap} />
      )}

      {/* ── Veto panel ── */}
      {(isVetoActive || effectiveVetoes.length > 0) && (
        <VetoPanel matchId={match.id} boType={match.boType} existingVetoes={effectiveVetoes}
          team1Id={match.team1Id} team2Id={match.team2Id}
          team1Name={t1Name} team2Name={t2Name} team1Tag={t1Tag} team2Tag={t2Tag}
          userTeamId={userTeamId} isPlayer={isPlayer} isVetoActive={isVetoActive}
          onVetoDone={doPoll} />
      )}

      {/* ── Phase 2 ready (post-veto) ── */}
      {isPreLive && (isCaptain || isPlayer) && (
        <ReadyPanel matchId={match.id} phase="pre_live" isCaptain={isCaptain}
          readyTeam1={effectiveReadyTeam1} readyTeam2={effectiveReadyTeam2}
          userIsTeam1={userIsTeam1} team1Tag={t1Tag} team2Tag={t2Tag}
          team1Name={t1Name} team2Name={t2Name} />
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
