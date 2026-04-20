"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Trophy, Crown, Swords, Clock, Check, Copy, Wifi,
  Shield, Loader2, AlertTriangle, Server, X, Star,
  ChevronDown, ChevronUp, Terminal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FullMatchDetail } from "@/lib/matches";
import { CS2_MAP_POOL, getVetoSequence } from "@/lib/maps";
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
  live:      "Ao vivo",
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

// ── Utilities ──────────────────────────────────────────────────────────────────

function useCopy(value: string) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return { copied, copy };
}

function CopyButton({ value, label, large }: { value: string; label: string; large?: boolean }) {
  const { copied, copy } = useCopy(value);
  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-2 rounded-xl border transition-all ${
        large
          ? "border-[var(--primary)]/30 bg-[var(--primary)]/5 px-4 py-2.5 text-sm font-mono font-semibold text-[var(--foreground)] hover:bg-[var(--primary)]/10"
          : "border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-xs font-mono text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      }`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-400 shrink-0" /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
      <span className="truncate">{copied ? "Copiado!" : label}</span>
    </button>
  );
}

// ── Ready panel ────────────────────────────────────────────────────────────────

function ReadyPanel({
  matchId,
  phase,
  isCaptain,
  readyTeam1,
  readyTeam2,
  userIsTeam1,
  team1Tag,
  team2Tag,
  team1Name,
  team2Name,
}: {
  matchId: string;
  phase: "pre_veto" | "pre_live";
  isCaptain: boolean;
  readyTeam1: boolean;
  readyTeam2: boolean;
  userIsTeam1: boolean | null;
  team1Tag: string;
  team2Tag: string;
  team1Name: string;
  team2Name: string;
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
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/ready`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erro.");
      else { setLocalReady(true); playReadyOne(); }
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  const title = phase === "pre_veto" ? "Check-in" : "Confirmar início";
  const subtitle = phase === "pre_veto"
    ? "Ambos os times precisam confirmar para iniciar o veto"
    : "Veto concluído — ambos os times devem confirmar para ligar o servidor";

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] bg-[var(--secondary)]/40 px-6 py-4">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">{title}</div>
        <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">{subtitle}</div>
      </div>

      <div className="grid grid-cols-[1fr_60px_1fr] items-center gap-3 px-6 py-8">
        {/* Team 1 */}
        <div className="flex flex-col items-center gap-3">
          <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-xl font-black transition-all duration-500 ${
            readyTeam1
              ? "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.25)]"
              : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]"
          }`}>
            {team1Tag}
            {readyTeam1 && (
              <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 shadow">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-[var(--foreground)]">{team1Name}</div>
            <div className={`text-[11px] font-semibold ${readyTeam1 ? "text-green-400" : "text-[var(--muted-foreground)]"}`}>
              {readyTeam1 ? "✓ READY" : "Aguardando…"}
            </div>
          </div>
        </div>

        {/* VS */}
        <div className="flex items-center justify-center">
          <div className={`transition-all duration-500 ${bothReady ? "scale-110" : ""}`}>
            <Swords className={`h-7 w-7 ${bothReady ? "text-[var(--primary)] drop-shadow-[0_0_8px_var(--primary)]" : "text-[var(--muted-foreground)]"}`} />
          </div>
        </div>

        {/* Team 2 */}
        <div className="flex flex-col items-center gap-3">
          <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-xl font-black transition-all duration-500 ${
            readyTeam2
              ? "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.25)]"
              : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]"
          }`}>
            {team2Tag}
            {readyTeam2 && (
              <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 shadow">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-[var(--foreground)]">{team2Name}</div>
            <div className={`text-[11px] font-semibold ${readyTeam2 ? "text-green-400" : "text-[var(--muted-foreground)]"}`}>
              {readyTeam2 ? "✓ READY" : "Aguardando…"}
            </div>
          </div>
        </div>
      </div>

      {isCaptain && !myReady && !bothReady && (
        <div className="border-t border-[var(--border)] px-6 py-4">
          <button
            type="button"
            onClick={ready}
            disabled={loading}
            className="w-full rounded-xl bg-[var(--primary)] py-3 text-sm font-black uppercase tracking-widest text-black transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Confirmar Ready"}
          </button>
          {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
        </div>
      )}
      {isCaptain && myReady && !bothReady && (
        <div className="border-t border-[var(--border)] px-6 py-3 text-center text-xs text-green-400">
          <Check className="mr-1.5 inline h-3.5 w-3.5" />
          Confirmado. Aguardando adversário…
        </div>
      )}
    </div>
  );
}

// ── Veto panel ─────────────────────────────────────────────────────────────────

function VetoPanel({
  matchId,
  boType,
  existingVetoes,
  team1Id,
  team2Id,
  team1Name,
  team2Name,
  team1Tag,
  team2Tag,
  userTeamId,
  isPlayer,
  isVetoActive,
}: {
  matchId: string;
  boType: 1 | 3 | 5;
  existingVetoes: VetoEntry[];
  team1Id: string | null;
  team2Id: string | null;
  team1Name: string;
  team2Name: string;
  team1Tag: string;
  team2Tag: string;
  userTeamId: string | null;
  isPlayer: boolean;
  isVetoActive: boolean;
}) {
  const sequence = getVetoSequence(boType);
  const [vetoes, setVetoes] = useState(existingVetoes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevCount = useRef(existingVetoes.length);

  useEffect(() => {
    if (existingVetoes.length > vetoes.length) {
      setVetoes(existingVetoes);
    }
  }, [existingVetoes, vetoes.length]);

  // Sound on external updates
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

  const activeTeamName = currentSlot
    ? (currentSlot.turn === "team1" ? team1Name : team2Name)
    : null;
  const activeTeamTag = currentSlot
    ? (currentSlot.turn === "team1" ? team1Tag : team2Tag)
    : null;

  async function submitVeto(mapName: string) {
    if (!myTurn || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/veto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mapName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro.");
      } else {
        const newVeto: VetoEntry = {
          id: `tmp-${vetoes.length}`,
          matchId,
          teamId: userTeamId!,
          action: currentSlot!.action,
          mapName,
          vetoOrder: vetoes.length + 1,
          pickedSide: null,
          createdAt: new Date().toISOString(),
        };
        const next = [...vetoes, newVeto];
        setVetoes(next);
        if (next.length >= sequence.length) playVetoDone();
        else playVeto();
        prevCount.current = next.length;
      }
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Veto de mapas — {boType === 1 ? "BO1" : boType === 3 ? "BO3" : "BO5"}
        </span>
        <div className="flex items-center gap-1.5">
          {sequence.map((slot, i) => {
            const done = i < vetoes.length;
            const active = i === currentStep;
            return (
              <div key={i} className={`h-2 w-2 rounded-full transition-all ${
                done
                  ? slot.action === "ban" ? "bg-red-500" : "bg-[var(--primary)]"
                  : active ? "animate-pulse bg-[var(--primary)]/50" : "bg-[var(--border)]"
              }`} />
            );
          })}
          <span className="ml-2 text-[10px] font-mono text-[var(--muted-foreground)]">
            {currentStep}/{sequence.length}
          </span>
        </div>
      </div>

      {/* Who's vetoing banner */}
      {isVetoActive && !isDone && activeTeamName && (
        <div className="flex items-center gap-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/5 to-transparent px-6 py-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-base font-black text-[var(--primary)]">
            {activeTeamTag}
          </div>
          <div>
            <div className="text-xl font-black text-[var(--foreground)]">{activeTeamName}</div>
            <div className="text-sm text-[var(--muted-foreground)]">
              está escolhendo um mapa para{" "}
              <span className={`font-bold ${currentSlot?.action === "ban" ? "text-red-400" : "text-[var(--primary)]"}`}>
                {currentSlot?.action === "ban" ? "vetar" : "escolher"}
              </span>
            </div>
          </div>
          {myTurn && (
            <span className="ml-auto animate-pulse rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3 py-1 text-xs font-bold text-[var(--primary)]">
              Sua vez
            </span>
          )}
          {!isPlayer && (
            <span className="ml-auto rounded-full bg-[var(--secondary)] px-3 py-1 text-[10px] text-[var(--muted-foreground)]">
              Espectador
            </span>
          )}
        </div>
      )}

      {isDone && (
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] bg-[var(--primary)]/5 px-6 py-4">
          <Check className="h-5 w-5 shrink-0 text-[var(--primary)]" />
          <span className="font-bold text-[var(--primary)]">Veto concluído</span>
          {picks.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {picks.map((m) => (
                <span key={m} className="rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2 py-0.5 text-xs font-bold text-[var(--primary)]">
                  {m}
                </span>
              ))}
              {decider && (
                <span className="rounded-full border border-[var(--primary)]/40 bg-[var(--primary)]/15 px-2 py-0.5 text-xs font-bold text-[var(--primary)]">
                  {decider} <span className="opacity-60">(decider)</span>
                </span>
              )}
            </div>
          )}
          {picks.length === 0 && decider && (
            <span className="rounded-full border border-[var(--primary)]/40 bg-[var(--primary)]/15 px-2 py-0.5 text-xs font-bold text-[var(--primary)]">
              {decider} <span className="opacity-60">(mapa)</span>
            </span>
          )}
        </div>
      )}

      {/* Map grid */}
      <div className="grid grid-cols-4 gap-2 p-4 sm:grid-cols-5 lg:grid-cols-7">
        {CS2_MAP_POOL.map((map) => {
          const vetoEntry = vetoes.find((v) => v.mapName === map.name);
          const isBanned = vetoEntry?.action === "ban";
          const isPicked = vetoEntry?.action === "pick";
          const isDecider = isDone && map.name === decider;
          const isSelectable = myTurn && !usedMaps.has(map.name) && !loading;

          return (
            <button
              key={map.name}
              type="button"
              disabled={!isSelectable}
              onClick={() => isSelectable && submitVeto(map.name)}
              className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                isBanned
                  ? "border-red-900/30 opacity-30"
                  : isPicked || isDecider
                  ? "border-[var(--primary)] shadow-[0_0_14px_rgba(0,200,255,0.2)]"
                  : isSelectable
                  ? "cursor-pointer border-[var(--border)] hover:border-[var(--primary)]/60 hover:scale-[1.03] hover:shadow-[0_0_12px_rgba(0,200,255,0.15)]"
                  : "cursor-default border-[var(--border)]"
              }`}
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={map.localImage}
                  alt={map.name}
                  fill
                  sizes="(max-width: 640px) 25vw, 14vw"
                  className={`object-cover transition-transform duration-300 ${
                    isBanned ? "grayscale" : "group-hover:scale-105"
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                {isBanned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <X className="h-7 w-7 text-red-500 drop-shadow-lg" />
                  </div>
                )}
                {(isPicked || isDecider) && !isBanned && (
                  <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)]">
                    <Star className="h-3 w-3 text-black" />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 px-2 pb-1.5">
                  <div className="text-[11px] font-black uppercase tracking-wide text-white drop-shadow">
                    {map.name}
                  </div>
                  {isBanned && <div className="text-[9px] font-bold text-red-400">VETADO</div>}
                  {isPicked && <div className="text-[9px] font-bold text-[var(--primary)]">ESCOLHIDO</div>}
                  {isDecider && <div className="text-[9px] font-bold text-[var(--primary)]">DECIDER</div>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mx-4 mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-xs text-red-400">{error}</div>
      )}
    </div>
  );
}

// ── Server panel ───────────────────────────────────────────────────────────────

function ServerPanel({ server, isPlayer }: { server: ServerInfo | null; isPlayer: boolean }) {
  if (!server) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 px-6 py-5">
        <Loader2 className="h-6 w-6 shrink-0 animate-spin text-yellow-400" />
        <div>
          <div className="font-bold text-yellow-300">Iniciando servidor…</div>
          <div className="text-xs text-[var(--muted-foreground)]">O servidor CS2 está sendo alocado. Aguarde.</div>
        </div>
      </div>
    );
  }

  const displayIp = `${server.rawIp ?? server.ip}:${server.port}`;
  const connectCmd = server.password
    ? `connect ${server.rawIp ?? server.ip}:${server.port}; password ${server.password}`
    : null;
  const steamUrl = server.connectString ?? (connectCmd ? `steam://connect/${server.rawIp ?? server.ip}:${server.port}/${server.password}` : null);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--primary)]/30 bg-[var(--card)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--primary)]/5 px-6 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15">
          <Server className="h-4 w-4 text-[var(--primary)]" />
        </div>
        <div>
          <div className="font-bold text-[var(--foreground)]">Servidor pronto</div>
          <div className="font-mono text-xs text-[var(--muted-foreground)]">{displayIp}</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
          <span className="text-xs font-semibold text-green-400">Online</span>
        </div>
      </div>

      <div className="p-6">
        {isPlayer && steamUrl && connectCmd ? (
          <div className="space-y-4">
            {/* Primary CTA */}
            <a
              href={steamUrl}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-[var(--primary)] py-4 text-base font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(0,200,255,0.25)] transition-all hover:brightness-110 hover:shadow-[0_0_30px_rgba(0,200,255,0.35)]"
            >
              <Wifi className="h-5 w-5" />
              Entrar no servidor
            </a>

            {/* Copy commands */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-4">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                Comando de conexão
              </div>
              <div className="mb-3 flex items-center gap-2">
                <code className="flex-1 rounded bg-black/40 px-3 py-2 font-mono text-xs text-[var(--foreground)] break-all">
                  {connectCmd}
                </code>
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyButton value={connectCmd} label="Copiar connect" large />
                {server.gotvPort && (
                  <CopyButton
                    value={`connect ${server.rawIp ?? server.ip}:${server.gotvPort}`}
                    label="GOTV"
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--muted-foreground)]">
              {isPlayer
                ? "Informações de conexão não disponíveis."
                : "O endereço de conexão está disponível apenas para os jogadores da partida."}
            </p>
            {server.gotvPort && (
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">GOTV (espectador)</div>
                <CopyButton
                  value={`connect ${server.rawIp ?? server.ip}:${server.gotvPort}`}
                  label={`connect ${server.rawIp ?? server.ip}:${server.gotvPort}`}
                  large
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Admin Dathost logs ─────────────────────────────────────────────────────────

interface DathostLog {
  id: string;
  method: string;
  url: string;
  request_body: unknown;
  response_status: number | null;
  response_body: unknown;
  error_message: string | null;
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
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => {
    const id = setInterval(fetchLogs, 5000);
    return () => clearInterval(id);
  }, [fetchLogs]);

  function statusColor(code: number | null) {
    if (!code) return "text-red-400";
    if (code >= 200 && code < 300) return "text-green-400";
    if (code >= 400) return "text-red-400";
    return "text-yellow-400";
  }

  function pathOf(url: string) {
    try { return new URL(url).pathname; } catch { return url; }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0a0a0a]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b border-[var(--border)] px-6 py-4"
      >
        <div className="flex items-center gap-2.5">
          <Terminal className="h-4 w-4 text-[var(--primary)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
            Dathost API — Console Admin
          </span>
          {logs.length > 0 && (
            <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-mono text-[var(--primary)]">
              {logs.length}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)]" /> : <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />}
      </button>

      {open && (
        <div className="max-h-[480px] overflow-y-auto font-mono text-xs">
          {loading && (
            <div className="px-6 py-4 text-[var(--muted-foreground)]">Carregando…</div>
          )}
          {!loading && logs.length === 0 && (
            <div className="px-6 py-4 text-[var(--muted-foreground)]">Nenhuma requisição registrada.</div>
          )}
          {logs.map((log, i) => {
            const isExp = expanded[log.id];
            const hasError = Boolean(log.error_message);
            return (
              <div
                key={log.id}
                className={`border-b border-[#1a1a1a] ${i === 0 ? "" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => setExpanded((e) => ({ ...e, [log.id]: !e[log.id] }))}
                  className="flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="w-8 text-[10px] text-[#555]">{logs.length - i}</span>
                  <span className={`w-10 font-bold ${
                    log.method === "GET" ? "text-blue-400" :
                    log.method === "POST" ? "text-green-400" : "text-yellow-400"
                  }`}>{log.method}</span>
                  <span className="flex-1 truncate text-[#ccc]">{pathOf(log.url)}</span>
                  {log.response_status && (
                    <span className={`w-10 text-right font-bold ${statusColor(log.response_status)}`}>
                      {log.response_status}
                    </span>
                  )}
                  {hasError && <span className="text-red-400">✗</span>}
                  <span className="w-20 text-right text-[10px] text-[#555]">
                    {new Date(log.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  {isExp ? <ChevronUp className="h-3 w-3 text-[#555]" /> : <ChevronDown className="h-3 w-3 text-[#555]" />}
                </button>

                {isExp && (
                  <div className="border-t border-[#1a1a1a] bg-[#070707] px-6 py-4 space-y-3">
                    <div>
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#555]">URL</div>
                      <div className="break-all text-[#aaa]">{log.url}</div>
                    </div>
                    {log.request_body !== null && log.request_body !== undefined && (
                      <div>
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#555]">Request</div>
                        <pre className="overflow-x-auto rounded bg-black/60 p-3 text-[11px] leading-relaxed text-[#88c8a8]">
                          {JSON.stringify(log.request_body as Record<string, unknown>, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.response_body !== null && (
                      <div>
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#555]">Response</div>
                        <pre className={`overflow-x-auto rounded bg-black/60 p-3 text-[11px] leading-relaxed ${statusColor(log.response_status)}`}>
                          {typeof log.response_body === "string"
                            ? log.response_body
                            : JSON.stringify(log.response_body, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.error_message && (
                      <div>
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-red-400/60">Erro</div>
                        <div className="rounded bg-red-500/10 px-3 py-2 text-red-400">{log.error_message}</div>
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

// ── Player row ────────────────────────────────────────────────────────────────

function PlayerRow({ nickname, avatarUrl, role, isStarter }: {
  nickname: string; avatarUrl: string | null; role: string | null; isStarter: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[var(--border)]">
        {avatarUrl
          ? <Image src={avatarUrl} alt={nickname} fill className="object-cover" unoptimized />
          : <div className="flex h-full w-full items-center justify-center bg-[var(--secondary)] text-[10px] font-bold text-[var(--muted-foreground)]">{nickname[0].toUpperCase()}</div>
        }
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-[var(--foreground)]">{nickname}</div>
        {role && <div className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">{role}</div>}
      </div>
      {!isStarter && <span className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Sub</span>}
    </div>
  );
}

// ── Deadline ──────────────────────────────────────────────────────────────────

function DeadlinePanel({ teamsAssignedAt }: { teamsAssignedAt: string | null }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  if (!teamsAssignedAt) return null;
  const msLeft = new Date(teamsAssignedAt).getTime() + 3_600_000 - Date.now();
  if (msLeft <= 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-3.5">
        <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
        <p className="text-xs text-red-400/90">Prazo de 1 hora expirado. Times sujeitos a penalidades.</p>
      </div>
    );
  }
  const mins = Math.floor(msLeft / 60_000);
  const label = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}min` : `${mins}min`;
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3.5">
      <Clock className="h-4 w-4 shrink-0 text-[var(--primary)]" />
      <p className="text-xs text-[var(--muted-foreground)]">
        Prazo recomendado: <strong className="text-[var(--foreground)]">{label} restantes</strong> — após o prazo os times ficam sujeitos a penalidades.
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MatchPageClient({
  detail,
  tournamentId,
  roundLabel,
  isFinal,
  userTeamId,
  isCaptain,
  isPlayer,
  isAdmin,
}: Props) {
  const { match, team1Members, team2Members } = detail;

  const [poll, setPoll] = useState<PollData | null>(null);
  const [polledVetoes, setPolledVetoes] = useState<VetoEntry[] | null>(null);

  const effectiveStatus = poll?.status ?? match.status;
  const effectiveReadyTeam1 = poll?.readyTeam1 ?? match.readyTeam1;
  const effectiveReadyTeam2 = poll?.readyTeam2 ?? match.readyTeam2;
  const effectiveVetoes = polledVetoes ?? detail.vetoes;

  const serverFromPoll = poll?.server;
  const serverFromDetail = detail.server as ServerInfo | null;
  const effectiveServer: ServerInfo | null = serverFromPoll ?? serverFromDetail;

  const isFinished = effectiveStatus === "finished" || effectiveStatus === "walkover";
  const isVetoActive = effectiveStatus === "veto";
  const isPreLive = effectiveStatus === "pre_live";
  const sequence = getVetoSequence(match.boType);
  const vetoDone = effectiveVetoes.length >= sequence.length;
  const bothTeamsDefined = Boolean(match.team1Id && match.team2Id);

  const winner = isFinished
    ? match.winnerId === match.team1Id ? match.team1 : match.team2
    : null;

  const t1Name = match.team1?.name ?? "Time 1";
  const t2Name = match.team2?.name ?? "Time 2";
  const t1Tag = match.team1?.tag ?? "?";
  const t2Tag = match.team2?.tag ?? "?";
  const userIsTeam1 = userTeamId ? userTeamId === match.team1Id : null;

  // Polling — aggressive during veto
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
    <div className="space-y-5">

      {/* ── Hero header ── */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="relative px-6 py-10">
          <div className="absolute inset-0 grid-bg opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/60 via-slate-900/40 to-black/70" />
          <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[var(--primary)]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent" />

          <div className="relative">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANT[effectiveStatus] ?? "upcoming"}>
                {effectiveStatus === "live" && <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />}
                {STATUS_LABEL[effectiveStatus] ?? effectiveStatus}
              </Badge>
              <Badge variant="secondary">{roundLabel}</Badge>
              <Badge variant="secondary">{match.boType === 1 ? "BO1" : match.boType === 3 ? "BO3" : "BO5"}</Badge>
            </div>

            <div className="grid grid-cols-[1fr_80px_1fr] items-center gap-4 sm:gap-8">
              <div className="flex flex-col items-end gap-3">
                <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border-2 bg-gradient-to-br from-slate-800 to-slate-950 text-2xl font-black transition-all ${
                  isFinished && winner?.id === match.team1Id
                    ? "border-green-500 text-green-400 shadow-[0_0_24px_rgba(34,197,94,0.35)]"
                    : "border-[var(--border)] text-[var(--primary)]"
                }`}>{t1Tag}</div>
                <div className="text-right">
                  <div className={`text-xl font-black ${isFinished && winner?.id === match.team1Id ? "text-green-400" : "text-[var(--foreground)]"}`}>{t1Name}</div>
                  {match.team1 && <div className="text-xs text-[var(--muted-foreground)]">{match.team1.elo} ELO</div>}
                  {isFinished && winner?.id === match.team1Id && (
                    <div className="mt-1 flex items-center justify-end gap-1 text-xs font-bold text-green-400"><Crown className="h-3 w-3" /> Vencedor</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative flex h-14 w-14 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-[var(--primary)]/20" />
                  <Swords className="h-7 w-7 text-[var(--primary)] opacity-70" />
                </div>
              </div>

              <div className="flex flex-col items-start gap-3">
                <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border-2 bg-gradient-to-br from-slate-800 to-slate-950 text-2xl font-black transition-all ${
                  isFinished && winner?.id === match.team2Id
                    ? "border-green-500 text-green-400 shadow-[0_0_24px_rgba(34,197,94,0.35)]"
                    : "border-[var(--border)] text-[var(--primary)]"
                }`}>{t2Tag}</div>
                <div>
                  <div className={`text-xl font-black ${isFinished && winner?.id === match.team2Id ? "text-green-400" : "text-[var(--foreground)]"}`}>{t2Name}</div>
                  {match.team2 && <div className="text-xs text-[var(--muted-foreground)]">{match.team2.elo} ELO</div>}
                  {isFinished && winner?.id === match.team2Id && (
                    <div className="mt-1 flex items-center gap-1 text-xs font-bold text-green-400"><Crown className="h-3 w-3" /> Vencedor</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isFinished && winner && (
          <div className="border-t border-[var(--border)] px-6 py-4">
            <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <Trophy className="h-5 w-5 shrink-0 text-yellow-400" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/60">
                  {isFinal ? "Campeão do torneio" : "Avança para próxima fase"}
                </div>
                <div className="font-black text-yellow-400">{winner.name}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Players ── */}
      {(team1Members.length > 0 || team2Members.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[{ name: t1Name, members: team1Members }, { name: t2Name, members: team2Members }].map(({ name, members }) => (
            <div key={name} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-3 flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-[var(--primary)]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">{name}</span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {members.map((m) => <PlayerRow key={m.profileId} {...m} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Deadline ── */}
      {!isFinished && match.teamsAssignedAt && <DeadlinePanel teamsAssignedAt={match.teamsAssignedAt} />}

      {/* ── Waiting for opponent ── */}
      {effectiveStatus === "pending" && !bothTeamsDefined && (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-5">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">Aguardando adversário — a outra partida ainda não terminou.</p>
        </div>
      )}

      {/* ── Phase 1 ready (pre-veto) ── */}
      {effectiveStatus === "pending" && bothTeamsDefined && (isCaptain || isPlayer) && (
        <ReadyPanel
          matchId={match.id}
          phase="pre_veto"
          isCaptain={isCaptain}
          readyTeam1={effectiveReadyTeam1}
          readyTeam2={effectiveReadyTeam2}
          userIsTeam1={userIsTeam1}
          team1Tag={t1Tag} team2Tag={t2Tag}
          team1Name={t1Name} team2Name={t2Name}
        />
      )}

      {/* ── Veto panel — always visible once any veto exists or veto is active ── */}
      {(isVetoActive || effectiveVetoes.length > 0) && (
        <VetoPanel
          matchId={match.id}
          boType={match.boType}
          existingVetoes={effectiveVetoes}
          team1Id={match.team1Id}
          team2Id={match.team2Id}
          team1Name={t1Name} team2Name={t2Name}
          team1Tag={t1Tag} team2Tag={t2Tag}
          userTeamId={userTeamId}
          isPlayer={isPlayer}
          isVetoActive={isVetoActive}
        />
      )}

      {/* ── Phase 2 ready (post-veto) ── */}
      {isPreLive && (isCaptain || isPlayer) && (
        <ReadyPanel
          matchId={match.id}
          phase="pre_live"
          isCaptain={isCaptain}
          readyTeam1={effectiveReadyTeam1}
          readyTeam2={effectiveReadyTeam2}
          userIsTeam1={userIsTeam1}
          team1Tag={t1Tag} team2Tag={t2Tag}
          team1Name={t1Name} team2Name={t2Name}
        />
      )}

      {/* ── Server panel — only after veto complete ── */}
      {vetoDone && (effectiveStatus === "live" || effectiveStatus === "pre_live" || effectiveServer !== null) && (
        <ServerPanel server={effectiveServer} isPlayer={isPlayer} />
      )}

      {/* ── Admin result form ── */}
      {isAdmin && !isFinished && match.team1Id && match.team2Id && (
        <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--card)] p-6">
          <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Registrar Resultado (Admin)</h3>
          <AdminResultForm
            matchId={match.id}
            tournamentId={tournamentId}
            team1={{ id: match.team1Id, name: t1Name }}
            team2={{ id: match.team2Id, name: t2Name }}
          />
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
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId: selected }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erro.");
      else window.location.href = `/tournaments/${tournamentId}?tab=bracket`;
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3">
        {[team1, team2].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelected(t.id)}
            className={`rounded-xl border py-3 text-sm font-bold transition-all ${
              selected === t.id
                ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:border-[var(--primary)]/40"
            }`}
          >{t.name}</button>
        ))}
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={!selected || loading}
        className="w-full rounded-xl bg-[var(--primary)] py-3 text-sm font-bold text-black disabled:opacity-40"
      >
        {loading ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Confirmar resultado"}
      </button>
      {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
