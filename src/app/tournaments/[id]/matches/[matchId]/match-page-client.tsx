"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Trophy, Crown, Swords, Clock, Check, Copy, Wifi,
  Shield, Loader2, Ban, Star, AlertTriangle, Server,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FullMatchDetail } from "@/lib/matches";
import { CS2_MAP_POOL, getVetoSequence } from "@/lib/maps";

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

const STATUS_LABEL: Record<string, string> = {
  pending:   "Aguardando",
  veto:      "Veto de mapa",
  live:      "Ao vivo",
  finished:  "Finalizado",
  walkover:  "W.O.",
  cancelled: "Cancelado",
};

const STATUS_VARIANT: Record<string, "open" | "ongoing" | "finished" | "upcoming" | "live"> = {
  pending:   "upcoming",
  veto:      "upcoming",
  live:      "live",
  finished:  "finished",
  walkover:  "finished",
  cancelled: "finished",
};

// ── Helper: copy button ────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-xs font-mono text-[var(--foreground)] transition-colors hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/40"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
      {label ?? value}
    </button>
  );
}

// ── Schedule panel ─────────────────────────────────────────────────────────────

function SchedulePanel({ matchId, isCaptain }: { matchId: string; isCaptain: boolean }) {
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const scheduledAt = new Date(time).toISOString();
      const res = await fetch(`/api/matches/${matchId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erro ao agendar.");
      else setDone(true);
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  if (!isCaptain) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="text-center text-xs text-[var(--muted-foreground)]">
          Aguardando capitão agendar a partida (máx. 2h)
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5 text-center text-sm text-green-400">
        <Check className="mx-auto mb-2 h-5 w-5" /> Partida agendada!
      </div>
    );
  }

  // Min: now + 1min, Max: now + 2h
  const now = new Date();
  const minDt = new Date(now.getTime() + 61_000).toISOString().slice(0, 16);
  const maxDt = new Date(now.getTime() + 2 * 3600_000).toISOString().slice(0, 16);

  return (
    <div className="rounded-xl border border-[var(--primary)]/20 bg-[var(--card)] p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--primary)]">
        <Clock className="h-3.5 w-3.5" /> Agendar partida
      </div>
      <form onSubmit={submit} className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            Horário (máx. 2h a partir de agora)
          </label>
          <input
            type="datetime-local"
            min={minDt}
            max={maxDt}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !time}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-bold text-black transition-opacity disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Ready panel ────────────────────────────────────────────────────────────────

function ReadyPanel({
  matchId,
  isCaptain,
  readyTeam1,
  readyTeam2,
  userIsTeam1,
}: {
  matchId: string;
  isCaptain: boolean;
  readyTeam1: boolean;
  readyTeam2: boolean;
  userIsTeam1: boolean | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localReady, setLocalReady] = useState(false);

  const alreadyReady = localReady || (userIsTeam1 ? readyTeam1 : readyTeam2);

  async function ready() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/ready`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erro.");
      else setLocalReady(true);
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
        Check-in
      </div>
      <div className="flex items-center justify-around">
        <ReadyIndicator label="Time 1" ready={readyTeam1} />
        <div className="text-xs text-[var(--muted-foreground)]">VS</div>
        <ReadyIndicator label="Time 2" ready={readyTeam2} />
      </div>
      {isCaptain && !alreadyReady && (
        <div className="mt-4">
          <button
            type="button"
            onClick={ready}
            disabled={loading}
            className="w-full rounded-lg bg-[var(--primary)] py-2.5 text-sm font-bold text-black transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Ready!"}
          </button>
          {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
        </div>
      )}
      {isCaptain && alreadyReady && (
        <p className="mt-3 text-center text-xs text-green-400">
          <Check className="inline h-3.5 w-3.5" /> Você deu ready. Aguardando adversário…
        </p>
      )}
    </div>
  );
}

function ReadyIndicator({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
          ready ? "border-green-500 bg-green-500/20 text-green-400" : "border-[var(--border)] text-[var(--muted-foreground)]"
        }`}
      >
        {ready ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
        {label}
      </span>
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
  userTeamId,
  isPlayer,
}: {
  matchId: string;
  boType: 1 | 3 | 5;
  existingVetoes: FullMatchDetail["vetoes"];
  team1Id: string | null;
  team2Id: string | null;
  team1Name: string;
  team2Name: string;
  userTeamId: string | null;
  isPlayer: boolean;
}) {
  const sequence = getVetoSequence(boType);
  const [vetoes, setVetoes] = useState(existingVetoes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = vetoes.length;
  const isDone = currentStep >= sequence.length;
  const currentSlot = isDone ? null : sequence[currentStep];
  const myTurn =
    !isDone &&
    userTeamId !== null &&
    ((currentSlot!.turn === "team1" && userTeamId === team1Id) ||
      (currentSlot!.turn === "team2" && userTeamId === team2Id));

  const usedMaps = new Set(vetoes.map((v) => v.mapName));

  async function submitVeto(mapName: string) {
    if (!myTurn) return;
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
        setError(data.error ?? "Erro no veto.");
      } else {
        setVetoes((prev) => [
          ...prev,
          {
            id: `tmp-${prev.length}`,
            matchId,
            teamId: userTeamId!,
            action: currentSlot!.action,
            mapName,
            vetoOrder: prev.length + 1,
            pickedSide: null,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  // Compute picked maps for display
  const picks = vetoes.filter((v) => v.action === "pick").map((v) => v.mapName);
  const bans = new Set(vetoes.filter((v) => v.action === "ban").map((v) => v.mapName));
  const deciderCandidate = isDone
    ? CS2_MAP_POOL.find((m) => !picks.includes(m.name) && !bans.has(m.name))?.name
    : null;

  // Turn label
  function turnLabel() {
    if (isDone) return null;
    const teamName = currentSlot!.turn === "team1" ? team1Name : team2Name;
    const action = currentSlot!.action === "ban" ? "bane" : "escolhe";
    return `${teamName} ${action} um mapa`;
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
          Veto de mapas — {boType === 1 ? "BO1" : boType === 3 ? "BO3" : "BO5"}
        </span>
        {!isDone && (
          <span className="rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[var(--primary)]">
            {turnLabel()}
          </span>
        )}
      </div>

      {/* Sequence progress */}
      <div className="mb-4 flex gap-1.5 flex-wrap">
        {sequence.map((slot, i) => {
          const done2 = i < vetoes.length;
          const active = i === currentStep;
          return (
            <div
              key={i}
              className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold ${
                done2
                  ? vetoes[i].action === "ban"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-[var(--primary)]/20 text-[var(--primary)]"
                  : active
                  ? "border border-[var(--primary)] text-[var(--primary)]"
                  : "border border-[var(--border)] text-[var(--muted-foreground)]"
              }`}
            >
              {done2 ? (vetoes[i].action === "ban" ? "✗" : "✓") : slot.action === "ban" ? "B" : "P"}
            </div>
          );
        })}
      </div>

      {/* Map grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {CS2_MAP_POOL.map((map) => {
          const vetoEntry = vetoes.find((v) => v.mapName === map.name);
          const isBanned = vetoEntry?.action === "ban";
          const isPicked = vetoEntry?.action === "pick";
          const isDecider = isDone && map.name === deciderCandidate;
          const isSelectable = myTurn && !usedMaps.has(map.name) && !loading;

          return (
            <button
              key={map.name}
              type="button"
              disabled={!isSelectable}
              onClick={() => isSelectable && submitVeto(map.name)}
              className={`group relative overflow-hidden rounded-lg border transition-all ${
                isBanned
                  ? "border-red-500/30 opacity-40 grayscale"
                  : isPicked || isDecider
                  ? "border-[var(--primary)]/60 ring-1 ring-[var(--primary)]/40"
                  : isSelectable
                  ? "cursor-pointer border-[var(--border)] hover:border-[var(--primary)]/60 hover:ring-1 hover:ring-[var(--primary)]/30"
                  : "cursor-default border-[var(--border)]"
              }`}
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={map.splashArtUrl}
                  alt={map.name}
                  fill
                  className={`object-cover transition-all ${isBanned ? "grayscale" : ""}`}
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {isBanned && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Ban className="h-6 w-6 text-red-400 opacity-80" />
                  </div>
                )}
                {(isPicked || isDecider) && (
                  <div className="absolute right-1 top-1 rounded bg-[var(--primary)] p-0.5">
                    <Star className="h-3 w-3 text-black" />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1">
                  <div className="text-[10px] font-bold text-white">{map.name}</div>
                  {vetoEntry && (
                    <div className={`text-[9px] font-semibold ${isBanned ? "text-red-400" : "text-[var(--primary)]"}`}>
                      {isBanned ? "BAN" : "PICK"}
                    </div>
                  )}
                  {isDecider && (
                    <div className="text-[9px] font-semibold text-[var(--primary)]">DECIDER</div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      {!isPlayer && !isDone && (
        <p className="mt-3 text-center text-[10px] text-[var(--muted-foreground)]">
          Você está assistindo o veto como espectador.
        </p>
      )}
    </div>
  );
}

// ── Server panel ───────────────────────────────────────────────────────────────

function ServerPanel({
  server,
  isPlayer,
}: {
  server: FullMatchDetail["server"];
  isPlayer: boolean;
}) {
  if (!server) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
        <div>
          <div className="text-sm font-semibold text-[var(--foreground)]">Iniciando servidor…</div>
          <div className="text-xs text-[var(--muted-foreground)]">Aguarde, o servidor CS2 está sendo alocado.</div>
        </div>
      </div>
    );
  }

  if (server.status === "provisioning") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
        <Loader2 className="h-5 w-5 animate-spin text-yellow-400" />
        <div>
          <div className="text-sm font-semibold text-yellow-400">Servidor sendo configurado…</div>
          <div className="text-xs text-[var(--muted-foreground)]">O servidor foi alocado, aguardando confirmar IP.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--primary)]/20 bg-[var(--card)] p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--primary)]">
        <Server className="h-3.5 w-3.5" /> Servidor pronto
      </div>

      {isPlayer && server.connectString && server.password ? (
        <div className="space-y-3">
          <a
            href={server.connectString}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] py-3 text-sm font-bold text-black transition-opacity hover:opacity-90"
          >
            <Wifi className="h-4 w-4" /> Entrar no servidor
          </a>
          <div className="flex gap-2">
            <CopyButton
              value={`connect ${server.rawIp ?? server.ip}:${server.port}; password ${server.password}`}
              label="Copiar connect"
            />
            {server.gotvPort && (
              <CopyButton
                value={`connect ${server.rawIp ?? server.ip}:${server.gotvPort}`}
                label="GOTV"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-[var(--muted-foreground)]">
            Servidor disponível.
          </p>
          {server.gotvPort && (
            <CopyButton
              value={`connect ${server.rawIp ?? server.ip}:${server.gotvPort}`}
              label="GOTV (espectadores)"
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Player row ────────────────────────────────────────────────────────────────

function PlayerRow({
  nickname,
  avatarUrl,
  role,
  isStarter,
}: {
  nickname: string;
  avatarUrl: string | null;
  role: string | null;
  isStarter: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-[var(--border)]">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={nickname} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--secondary)] text-[10px] font-bold text-[var(--muted-foreground)]">
            {nickname.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="truncate text-xs font-semibold text-[var(--foreground)]">{nickname}</div>
        {role && (
          <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">{role}</div>
        )}
      </div>
      {!isStarter && (
        <span className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Sub
        </span>
      )}
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
  const { match, vetoes, server, team1Members, team2Members } = detail;

  const isFinished = match.status === "finished" || match.status === "walkover";
  const winner = isFinished
    ? match.winnerId === match.team1Id
      ? match.team1
      : match.team2
    : null;

  const userIsTeam1 = userTeamId ? userTeamId === match.team1Id : null;

  // Polling for live state updates
  const [pollData, setPollData] = useState<{
    status: string;
    readyTeam1: boolean;
    readyTeam2: boolean;
    serverStatus?: string;
  } | null>(null);

  const effectiveStatus = pollData?.status ?? match.status;
  const effectiveReadyTeam1 = pollData?.readyTeam1 ?? match.readyTeam1;
  const effectiveReadyTeam2 = pollData?.readyTeam2 ?? match.readyTeam2;

  const shouldPoll =
    effectiveStatus === "pending" ||
    effectiveStatus === "veto" ||
    effectiveStatus === "live";

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${match.id}/status`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPollData(data);
      }
    } catch {
      // ignore
    }
  }, [match.id]);

  useEffect(() => {
    if (!shouldPoll) return;
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [shouldPoll, poll]);

  return (
    <div className="space-y-6">
      {/* ── Match header ── */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="relative border-b border-[var(--border)] px-6 py-10">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/50 via-slate-900/30 to-black/60" />

          <div className="relative">
            {/* Status badges */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANT[effectiveStatus] ?? "upcoming"}>
                {effectiveStatus === "live" && (
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                )}
                {STATUS_LABEL[effectiveStatus] ?? effectiveStatus}
              </Badge>
              <Badge variant="secondary">{roundLabel}</Badge>
            </div>

            {/* Team vs Team */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
              {/* Team 1 */}
              <div className="flex flex-col items-end gap-3">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-2xl border-2 bg-gradient-to-br from-cyan-950 to-slate-900 text-2xl font-black ${
                    isFinished && winner?.id === match.team1Id
                      ? "border-green-500 text-green-400"
                      : "border-[var(--border)] text-[var(--primary)]"
                  }`}
                >
                  {match.team1?.tag ?? "?"}
                </div>
                <div className="text-right">
                  <div
                    className={`text-xl font-black ${
                      isFinished && winner?.id === match.team1Id ? "text-green-400" : "text-[var(--foreground)]"
                    }`}
                  >
                    {match.team1?.name ?? "A definir"}
                  </div>
                  {match.team1 && (
                    <div className="text-xs text-[var(--muted-foreground)]">{match.team1.elo} ELO</div>
                  )}
                  {isFinished && winner?.id === match.team1Id && (
                    <div className="mt-1 flex items-center justify-end gap-1 text-xs font-bold text-green-400">
                      <Crown className="h-3 w-3" /> Vencedor
                    </div>
                  )}
                </div>
              </div>

              {/* Center VS */}
              <div className="flex flex-col items-center gap-2">
                <Swords className="h-12 w-12 text-[var(--primary)] opacity-50" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--muted-foreground)]">
                  {match.boType === 1 ? "BO1" : match.boType === 3 ? "BO3" : "BO5"}
                </span>
              </div>

              {/* Team 2 */}
              <div className="flex flex-col items-start gap-3">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-2xl border-2 bg-gradient-to-br from-cyan-950 to-slate-900 text-2xl font-black ${
                    isFinished && winner?.id === match.team2Id
                      ? "border-green-500 text-green-400"
                      : "border-[var(--border)] text-[var(--primary)]"
                  }`}
                >
                  {match.team2?.tag ?? "?"}
                </div>
                <div>
                  <div
                    className={`text-xl font-black ${
                      isFinished && winner?.id === match.team2Id ? "text-green-400" : "text-[var(--foreground)]"
                    }`}
                  >
                    {match.team2?.name ?? "A definir"}
                  </div>
                  {match.team2 && (
                    <div className="text-xs text-[var(--muted-foreground)]">{match.team2.elo} ELO</div>
                  )}
                  {isFinished && winner?.id === match.team2Id && (
                    <div className="mt-1 flex items-center gap-1 text-xs font-bold text-green-400">
                      <Crown className="h-3 w-3" /> Vencedor
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Winner banner */}
        {isFinished && winner && (
          <div className="px-6 py-4">
            <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <Trophy className="h-5 w-5 shrink-0 text-yellow-400" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-yellow-400/70">
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
          {/* Team 1 players */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-[var(--primary)]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                {match.team1?.name ?? "Time 1"}
              </span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {team1Members.map((m) => (
                <PlayerRow key={m.profileId} {...m} />
              ))}
            </div>
          </div>

          {/* Team 2 players */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-[var(--primary)]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                {match.team2?.name ?? "Time 2"}
              </span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {team2Members.map((m) => (
                <PlayerRow key={m.profileId} {...m} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule panel (only when pending + no scheduled_at) ── */}
      {effectiveStatus === "pending" && !match.scheduledAt && (isCaptain || isPlayer) && (
        <SchedulePanel matchId={match.id} isCaptain={isCaptain} />
      )}

      {/* ── Scheduled + ready panel ── */}
      {effectiveStatus === "pending" && match.scheduledAt && (isCaptain || isPlayer) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3">
            <Clock className="h-4 w-4 text-[var(--primary)]" />
            <span className="text-sm text-[var(--foreground)]">
              Agendada para{" "}
              <strong>
                {new Date(match.scheduledAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </span>
          </div>
          <ReadyPanel
            matchId={match.id}
            isCaptain={isCaptain}
            readyTeam1={effectiveReadyTeam1}
            readyTeam2={effectiveReadyTeam2}
            userIsTeam1={userIsTeam1}
          />
        </div>
      )}

      {/* ── WO warning ── */}
      {effectiveStatus === "pending" && match.scheduledAt && (
        <div className="flex items-start gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
          <p className="text-xs text-yellow-400/80">
            Ambos os capitães devem dar ready antes do horário agendado. Quem não der ready será declarado W.O.
          </p>
        </div>
      )}

      {/* ── Veto panel ── */}
      {(effectiveStatus === "veto" || (effectiveStatus !== "pending" && vetoes.length > 0)) && (
        <VetoPanel
          matchId={match.id}
          boType={match.boType}
          existingVetoes={vetoes}
          team1Id={match.team1Id}
          team2Id={match.team2Id}
          team1Name={match.team1?.name ?? "Time 1"}
          team2Name={match.team2?.name ?? "Time 2"}
          userTeamId={userTeamId}
          isPlayer={isPlayer}
        />
      )}

      {/* ── Server panel (after veto; visible to all but connect only to players) ── */}
      {(effectiveStatus === "live" ||
        effectiveStatus === "finished" ||
        (effectiveStatus === "pending" && server !== null) ||
        effectiveStatus === "veto") && (
        <ServerPanel server={server} isPlayer={isPlayer} />
      )}

      {/* ── Admin result form ── */}
      {isAdmin && !isFinished && match.team1Id && match.team2Id && (
        <div className="rounded-xl border border-[var(--primary)]/20 bg-[var(--card)] p-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-[var(--primary)]">
            Registrar Resultado (Admin)
          </h3>
          <AdminResultForm
            matchId={match.id}
            tournamentId={tournamentId}
            team1={{ id: match.team1Id, name: match.team1?.name ?? "Time 1" }}
            team2={{ id: match.team2Id, name: match.team2?.name ?? "Time 2" }}
          />
        </div>
      )}
    </div>
  );
}

// ── Inline admin result form ───────────────────────────────────────────────────

function AdminResultForm({
  matchId,
  tournamentId,
  team1,
  team2,
}: {
  matchId: string;
  tournamentId: string;
  team1: { id: string; name: string };
  team2: { id: string; name: string };
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
          >
            {t.name}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={!selected || loading}
        className="w-full rounded-xl bg-[var(--primary)] py-3 text-sm font-bold text-black transition-opacity disabled:opacity-40"
      >
        {loading ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Confirmar resultado"}
      </button>
      {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
