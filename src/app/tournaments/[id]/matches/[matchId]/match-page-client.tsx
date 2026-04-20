"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Trophy, Crown, Swords, Clock, Check, Copy, Wifi,
  Shield, Loader2, AlertTriangle, Server, X, Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FullMatchDetail } from "@/lib/matches";
import { CS2_MAP_POOL, getVetoSequence } from "@/lib/maps";
import {
  playReadyOne,
  playReadyBoth,
  playVeto,
  playVetoDone,
} from "@/lib/sounds";

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

// ── Utilities ──────────────────────────────────────────────────────────────────

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

// ── Ready panel ────────────────────────────────────────────────────────────────

function ReadyPanel({
  matchId,
  isCaptain,
  readyTeam1,
  readyTeam2,
  userIsTeam1,
  team1Name,
  team2Name,
  team1Tag,
  team2Tag,
}: {
  matchId: string;
  isCaptain: boolean;
  readyTeam1: boolean;
  readyTeam2: boolean;
  userIsTeam1: boolean | null;
  team1Name: string;
  team2Name: string;
  team1Tag: string;
  team2Tag: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localReady, setLocalReady] = useState(false);

  const prevR1 = useRef(readyTeam1);
  const prevR2 = useRef(readyTeam2);

  // Play sounds on state changes
  useEffect(() => {
    const wasR1 = prevR1.current;
    const wasR2 = prevR2.current;
    if (readyTeam1 !== wasR1 || readyTeam2 !== wasR2) {
      if (readyTeam1 && readyTeam2) playReadyBoth();
      else if (readyTeam1 !== wasR1 || readyTeam2 !== wasR2) playReadyOne();
      prevR1.current = readyTeam1;
      prevR2.current = readyTeam2;
    }
  }, [readyTeam1, readyTeam2]);

  const alreadyReady = localReady || (userIsTeam1 === true ? readyTeam1 : userIsTeam1 === false ? readyTeam2 : false);
  const bothReady = readyTeam1 && readyTeam2;

  async function ready() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/ready`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erro.");
      else {
        setLocalReady(true);
        playReadyOne();
      }
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] px-6 py-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Check-in
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-6">
        {/* Team 1 */}
        <div className="flex flex-col items-center gap-3">
          <div
            className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-lg font-black transition-all duration-500 ${
              readyTeam1
                ? "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]"
            }`}
          >
            {team1Tag}
            {readyTeam1 && (
              <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-[var(--foreground)]">{team1Name}</div>
            <div className={`mt-0.5 text-xs font-semibold ${readyTeam1 ? "text-green-400" : "text-[var(--muted-foreground)]"}`}>
              {readyTeam1 ? "READY" : "Aguardando..."}
            </div>
          </div>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center gap-2">
          <Swords className={`h-8 w-8 transition-all duration-300 ${bothReady ? "text-[var(--primary)] drop-shadow-[0_0_8px_var(--primary)]" : "text-[var(--muted-foreground)]"}`} />
          {bothReady && (
            <span className="animate-pulse rounded-full bg-[var(--primary)]/20 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">
              GO!
            </span>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex flex-col items-center gap-3">
          <div
            className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-lg font-black transition-all duration-500 ${
              readyTeam2
                ? "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]"
            }`}
          >
            {team2Tag}
            {readyTeam2 && (
              <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-[var(--foreground)]">{team2Name}</div>
            <div className={`mt-0.5 text-xs font-semibold ${readyTeam2 ? "text-green-400" : "text-[var(--muted-foreground)]"}`}>
              {readyTeam2 ? "READY" : "Aguardando..."}
            </div>
          </div>
        </div>
      </div>

      {/* Ready button */}
      {isCaptain && !alreadyReady && !bothReady && (
        <div className="border-t border-[var(--border)] px-6 py-4">
          <button
            type="button"
            onClick={ready}
            disabled={loading}
            className="w-full rounded-xl bg-[var(--primary)] py-3 text-sm font-black uppercase tracking-widest text-black transition-all hover:brightness-110 disabled:opacity-50"
          >
            {loading ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Confirmar Ready"}
          </button>
          {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
        </div>
      )}
      {isCaptain && alreadyReady && !bothReady && (
        <div className="border-t border-[var(--border)] px-6 py-3 text-center text-xs text-green-400">
          <Check className="mr-1 inline h-3.5 w-3.5" />
          Ready confirmado. Aguardando adversário…
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
}: {
  matchId: string;
  boType: 1 | 3 | 5;
  existingVetoes: FullMatchDetail["vetoes"];
  team1Id: string | null;
  team2Id: string | null;
  team1Name: string;
  team2Name: string;
  team1Tag: string;
  team2Tag: string;
  userTeamId: string | null;
  isPlayer: boolean;
}) {
  const sequence = getVetoSequence(boType);
  const [vetoes, setVetoes] = useState(existingVetoes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastVetoedMap, setLastVetoedMap] = useState<string | null>(null);
  const prevVetoCount = useRef(existingVetoes.length);

  // Play veto sounds when new vetoes come in via polling
  useEffect(() => {
    if (vetoes.length > prevVetoCount.current) {
      if (vetoes.length >= sequence.length) {
        playVetoDone();
      } else {
        playVeto();
      }
      prevVetoCount.current = vetoes.length;
    }
  }, [vetoes.length, sequence.length]);

  const currentStep = vetoes.length;
  const isDone = currentStep >= sequence.length;
  const currentSlot = isDone ? null : sequence[currentStep];
  const myTurn =
    !isDone &&
    userTeamId !== null &&
    ((currentSlot!.turn === "team1" && userTeamId === team1Id) ||
      (currentSlot!.turn === "team2" && userTeamId === team2Id));

  const usedMaps = new Set(vetoes.map((v) => v.mapName));

  // Who's turn it is
  const activeTeamName = currentSlot
    ? currentSlot.turn === "team1" ? team1Name : team2Name
    : null;
  const activeTeamTag = currentSlot
    ? currentSlot.turn === "team1" ? team1Tag : team2Tag
    : null;
  const activeAction = currentSlot?.action === "ban" ? "veta" : "escolhe";

  // Compute final map order
  const picks = vetoes.filter((v) => v.action === "pick").map((v) => v.mapName);
  const bans = new Set(vetoes.filter((v) => v.action === "ban").map((v) => v.mapName));
  const decider = isDone
    ? CS2_MAP_POOL.find((m) => !picks.includes(m.name) && !bans.has(m.name))?.name ?? null
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
        setError(data.error ?? "Erro no veto.");
      } else {
        const newVeto = {
          id: `tmp-${vetoes.length}`,
          matchId,
          teamId: userTeamId!,
          action: currentSlot!.action,
          mapName,
          vetoOrder: vetoes.length + 1,
          pickedSide: null,
          createdAt: new Date().toISOString(),
        };
        const newVetoes = [...vetoes, newVeto];
        setVetoes(newVetoes);
        setLastVetoedMap(mapName);
        setTimeout(() => setLastVetoedMap(null), 800);

        if (newVetoes.length >= sequence.length) {
          playVetoDone();
        } else {
          playVeto();
        }
        prevVetoCount.current = newVetoes.length;
      }
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  // Update vetoes from external polling
  // (Parent passes updated existingVetoes — we adopt if we're behind)
  useEffect(() => {
    if (existingVetoes.length > vetoes.length) {
      setVetoes(existingVetoes);
    }
  }, [existingVetoes, vetoes.length]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Veto de mapas — {boType === 1 ? "BO1" : boType === 3 ? "BO3" : "BO5"}
        </span>

        {/* Progress dots */}
        <div className="flex items-center gap-1">
          {sequence.map((slot, i) => {
            const done = i < vetoes.length;
            const active = i === currentStep;
            const isBanSlot = slot.action === "ban";
            return (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-all ${
                  done
                    ? isBanSlot ? "bg-red-500" : "bg-[var(--primary)]"
                    : active
                    ? "animate-pulse bg-[var(--primary)]/60"
                    : "bg-[var(--border)]"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* "X está vetando" banner */}
      {!isDone && activeTeamName && (
        <div className="flex items-center gap-4 border-b border-[var(--border)] bg-[var(--secondary)]/60 px-6 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-base font-black text-[var(--primary)]">
            {activeTeamTag}
          </div>
          <div>
            <div className="text-lg font-black text-[var(--foreground)]">
              {activeTeamName}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              está escolhendo um mapa para{" "}
              <span className={`font-bold ${currentSlot?.action === "ban" ? "text-red-400" : "text-[var(--primary)]"}`}>
                {activeAction}
              </span>
            </div>
          </div>
          {myTurn && (
            <div className="ml-auto rounded-full bg-[var(--primary)]/20 px-3 py-1 text-xs font-bold text-[var(--primary)] animate-pulse">
              Sua vez
            </div>
          )}
        </div>
      )}

      {isDone && (
        <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--primary)]/5 px-6 py-4">
          <Check className="h-5 w-5 text-[var(--primary)]" />
          <span className="font-bold text-[var(--primary)]">Veto concluído</span>
          {picks.length > 0 && (
            <span className="text-sm text-[var(--muted-foreground)]">
              — {picks.join(", ")}{decider ? `, ${decider} (decider)` : ""}
            </span>
          )}
        </div>
      )}

      {/* Map grid */}
      <div className="grid grid-cols-3 gap-3 p-5 sm:grid-cols-4 lg:grid-cols-7">
        {CS2_MAP_POOL.map((map) => {
          const vetoEntry = vetoes.find((v) => v.mapName === map.name);
          const isBanned = vetoEntry?.action === "ban";
          const isPicked = vetoEntry?.action === "pick";
          const isDecider = isDone && map.name === decider;
          const isFlashing = lastVetoedMap === map.name;
          const isSelectable = myTurn && !usedMaps.has(map.name) && !loading;

          return (
            <button
              key={map.name}
              type="button"
              disabled={!isSelectable}
              onClick={() => isSelectable && submitVeto(map.name)}
              className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                isBanned
                  ? "border-red-900/40 opacity-35"
                  : isPicked || isDecider
                  ? "border-[var(--primary)] shadow-[0_0_12px_rgba(0,200,255,0.25)]"
                  : isFlashing
                  ? "border-red-500 scale-95"
                  : isSelectable
                  ? "cursor-pointer border-[var(--border)] hover:border-[var(--primary)]/70 hover:shadow-[0_0_10px_rgba(0,200,255,0.15)] hover:scale-[1.02]"
                  : "cursor-default border-[var(--border)]"
              }`}
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={map.localImage}
                  alt={map.name}
                  fill
                  className={`object-cover transition-all duration-300 ${isBanned ? "grayscale" : "group-hover:scale-105"}`}
                  sizes="(max-width: 640px) 33vw, 14vw"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* Ban overlay */}
                {isBanned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <X className="h-8 w-8 text-red-500 drop-shadow-lg" />
                  </div>
                )}

                {/* Pick/decider badge */}
                {(isPicked || isDecider) && (
                  <div className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)]">
                    <Star className="h-3.5 w-3.5 text-black" />
                  </div>
                )}

                {/* Map name + state */}
                <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
                  <div className="text-xs font-black uppercase tracking-wide text-white drop-shadow">
                    {map.name}
                  </div>
                  {vetoEntry && (
                    <div className={`text-[10px] font-bold ${isBanned ? "text-red-400" : "text-[var(--primary)]"}`}>
                      {isBanned ? "VETADO" : "ESCOLHIDO"}
                    </div>
                  )}
                  {isDecider && !vetoEntry && (
                    <div className="text-[10px] font-bold text-[var(--primary)]">DECIDER</div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mx-5 mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-xs text-red-400">
          {error}
        </div>
      )}
      {!isPlayer && !isDone && (
        <div className="border-t border-[var(--border)] px-6 py-3 text-center text-xs text-[var(--muted-foreground)]">
          Você está acompanhando o veto como espectador.
        </div>
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
  if (!server) return null; // Don't show until after veto

  if (server.status === "provisioning") {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 px-6 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10">
          <Loader2 className="h-5 w-5 animate-spin text-yellow-400" />
        </div>
        <div>
          <div className="font-bold text-yellow-400">Iniciando servidor…</div>
          <div className="text-xs text-[var(--muted-foreground)]">
            O servidor CS2 está sendo configurado. Aguarde alguns instantes.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--primary)]/20 bg-[var(--card)]">
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/10">
          <Server className="h-4.5 w-4.5 text-[var(--primary)]" />
        </div>
        <div>
          <div className="text-sm font-bold text-[var(--foreground)]">Servidor pronto</div>
          <div className="text-xs text-[var(--muted-foreground)]">
            {server.rawIp ?? server.ip}:{server.port}
          </div>
        </div>
        <div className="ml-auto flex h-2 w-2 animate-pulse rounded-full bg-green-400" />
      </div>

      <div className="px-6 py-5 space-y-3">
        {isPlayer && server.connectString && server.password ? (
          <>
            <a
              href={server.connectString}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[var(--primary)] py-3.5 text-sm font-black uppercase tracking-widest text-black transition-all hover:brightness-110"
            >
              <Wifi className="h-4 w-4" /> Entrar no servidor
            </a>
            <div className="flex flex-wrap gap-2">
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
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-[var(--muted-foreground)]">
              {isPlayer ? "Detalhes de conexão não disponíveis." : "Acesso ao servidor disponível apenas para os jogadores da partida."}
            </p>
            {server.gotvPort && (
              <CopyButton
                value={`connect ${server.rawIp ?? server.ip}:${server.gotvPort}`}
                label="GOTV (espectador)"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Deadline panel ─────────────────────────────────────────────────────────────

function DeadlinePanel({ teamsAssignedAt }: { teamsAssignedAt: string | null }) {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceRender((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!teamsAssignedAt) return null;

  const deadline = new Date(new Date(teamsAssignedAt).getTime() + 60 * 60 * 1000);
  const now = new Date();
  const msLeft = deadline.getTime() - now.getTime();
  const expired = msLeft <= 0;
  const minsLeft = Math.max(0, Math.floor(msLeft / 60_000));
  const hoursLeft = Math.floor(minsLeft / 60);
  const remainLabel = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft % 60}min` : `${minsLeft}min`;

  if (expired) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-3.5">
        <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
        <p className="text-xs text-red-400/90">
          Prazo de 1 hora expirado. Os times estão sujeitos a penalidades por atraso.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3.5">
      <Clock className="h-4 w-4 shrink-0 text-[var(--primary)]" />
      <p className="text-xs text-[var(--muted-foreground)]">
        Prazo recomendado:{" "}
        <strong className="text-[var(--foreground)]">{remainLabel} restantes</strong>
        {" "}para iniciar a partida. Após o prazo os times ficam sujeitos a penalidades.
      </p>
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
    <div className="flex items-center gap-3 py-2">
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[var(--border)]">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={nickname} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--secondary)] text-[10px] font-bold text-[var(--muted-foreground)]">
            {nickname.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-semibold text-[var(--foreground)]">{nickname}</div>
        {role && (
          <div className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">{role}</div>
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
  const { match, server, team1Members, team2Members } = detail;

  const [polledStatus, setPolledStatus] = useState<string | null>(null);
  const [polledReadyTeam1, setPolledReadyTeam1] = useState<boolean | null>(null);
  const [polledReadyTeam2, setPolledReadyTeam2] = useState<boolean | null>(null);
  const [polledVetoes, setPolledVetoes] = useState<FullMatchDetail["vetoes"] | null>(null);
  const [polledServer, setPolledServer] = useState<FullMatchDetail["server"] | null>(null);

  const effectiveStatus = polledStatus ?? match.status;
  const effectiveReadyTeam1 = polledReadyTeam1 ?? match.readyTeam1;
  const effectiveReadyTeam2 = polledReadyTeam2 ?? match.readyTeam2;
  const effectiveVetoes = polledVetoes ?? detail.vetoes;
  const effectiveServer = polledServer !== undefined ? polledServer : server;

  const isFinished = effectiveStatus === "finished" || effectiveStatus === "walkover";
  const vetoActive = effectiveStatus === "veto";
  const vetoDone = effectiveVetoes.length >= getVetoSequence(match.boType).length;

  const shouldPoll = !isFinished && effectiveStatus !== "cancelled";

  // Aggressive polling during veto (1.5s), relaxed otherwise (4s)
  const pollInterval = vetoActive ? 1500 : 4000;

  const poll = useCallback(async () => {
    try {
      const [statusRes, vetoRes] = await Promise.all([
        fetch(`/api/matches/${match.id}/status`, { cache: "no-store" }),
        fetch(`/api/matches/${match.id}/vetoes`, { cache: "no-store" }),
      ]);
      if (statusRes.ok) {
        const d = await statusRes.json();
        setPolledStatus(d.status);
        setPolledReadyTeam1(d.readyTeam1);
        setPolledReadyTeam2(d.readyTeam2);
        if (d.server) setPolledServer(d.server);
      }
      if (vetoRes.ok) {
        const v = await vetoRes.json();
        if (Array.isArray(v.vetoes)) setPolledVetoes(v.vetoes);
      }
    } catch {
      // ignore
    }
  }, [match.id]);

  useEffect(() => {
    if (!shouldPoll) return;
    const id = setInterval(poll, pollInterval);
    return () => clearInterval(id);
  }, [shouldPoll, poll, pollInterval]);

  const winner = isFinished
    ? match.winnerId === match.team1Id ? match.team1 : match.team2
    : null;

  const team1Name = match.team1?.name ?? "Time 1";
  const team2Name = match.team2?.name ?? "Time 2";
  const team1Tag = match.team1?.tag ?? "?";
  const team2Tag = match.team2?.tag ?? "?";
  const userIsTeam1 = userTeamId ? userTeamId === match.team1Id : null;

  const bothTeamsDefined = Boolean(match.team1Id && match.team2Id);

  return (
    <div className="space-y-5">

      {/* ── Match hero header ── */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="relative px-6 py-10">
          {/* Background */}
          <div className="absolute inset-0 grid-bg opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/60 via-slate-900/40 to-black/70" />

          {/* Glow lines */}
          <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[var(--primary)]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent" />

          <div className="relative">
            {/* Status */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANT[effectiveStatus] ?? "upcoming"}>
                {effectiveStatus === "live" && (
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                )}
                {STATUS_LABEL[effectiveStatus] ?? effectiveStatus}
              </Badge>
              <Badge variant="secondary">{roundLabel}</Badge>
              <Badge variant="secondary">{match.boType === 1 ? "BO1" : match.boType === 3 ? "BO3" : "BO5"}</Badge>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-[1fr_80px_1fr] items-center gap-4 sm:gap-8">
              {/* Team 1 */}
              <div className="flex flex-col items-end gap-3">
                <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border-2 bg-gradient-to-br from-slate-800 to-slate-950 text-2xl font-black transition-all ${
                  isFinished && winner?.id === match.team1Id
                    ? "border-green-500 text-green-400 shadow-[0_0_24px_rgba(34,197,94,0.4)]"
                    : "border-[var(--border)] text-[var(--primary)]"
                }`}>
                  {team1Tag}
                </div>
                <div className="text-right">
                  <div className={`text-xl font-black ${isFinished && winner?.id === match.team1Id ? "text-green-400" : "text-[var(--foreground)]"}`}>
                    {team1Name}
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

              {/* VS */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative flex h-14 w-14 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-[var(--primary)]/20" />
                  <Swords className="h-7 w-7 text-[var(--primary)] opacity-70" />
                </div>
              </div>

              {/* Team 2 */}
              <div className="flex flex-col items-start gap-3">
                <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border-2 bg-gradient-to-br from-slate-800 to-slate-950 text-2xl font-black transition-all ${
                  isFinished && winner?.id === match.team2Id
                    ? "border-green-500 text-green-400 shadow-[0_0_24px_rgba(34,197,94,0.4)]"
                    : "border-[var(--border)] text-[var(--primary)]"
                }`}>
                  {team2Tag}
                </div>
                <div>
                  <div className={`text-xl font-black ${isFinished && winner?.id === match.team2Id ? "text-green-400" : "text-[var(--foreground)]"}`}>
                    {team2Name}
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
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-[var(--primary)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                {team1Name}
              </span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {team1Members.map((m) => <PlayerRow key={m.profileId} {...m} />)}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-[var(--primary)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                {team2Name}
              </span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {team2Members.map((m) => <PlayerRow key={m.profileId} {...m} />)}
            </div>
          </div>
        </div>
      )}

      {/* ── Deadline ── */}
      {!isFinished && match.teamsAssignedAt && (
        <DeadlinePanel teamsAssignedAt={match.teamsAssignedAt} />
      )}

      {/* ── Waiting for opponent ── */}
      {effectiveStatus === "pending" && !bothTeamsDefined && (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-5">
          <Loader2 className="h-4 w-4 animate-spin shrink-0 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">
            Aguardando adversário — a outra partida ainda não terminou.
          </p>
        </div>
      )}

      {/* ── Ready panel ── */}
      {effectiveStatus === "pending" && bothTeamsDefined && (isCaptain || isPlayer) && (
        <ReadyPanel
          matchId={match.id}
          isCaptain={isCaptain}
          readyTeam1={effectiveReadyTeam1}
          readyTeam2={effectiveReadyTeam2}
          userIsTeam1={userIsTeam1}
          team1Name={team1Name}
          team2Name={team2Name}
          team1Tag={team1Tag}
          team2Tag={team2Tag}
        />
      )}

      {/* ── Veto panel ── */}
      {(vetoActive || (effectiveVetoes.length > 0 && effectiveStatus !== "pending")) && (
        <VetoPanel
          matchId={match.id}
          boType={match.boType}
          existingVetoes={effectiveVetoes}
          team1Id={match.team1Id}
          team2Id={match.team2Id}
          team1Name={team1Name}
          team2Name={team2Name}
          team1Tag={team1Tag}
          team2Tag={team2Tag}
          userTeamId={userTeamId}
          isPlayer={isPlayer}
        />
      )}

      {/* ── Server panel — only after veto is done ── */}
      {vetoDone && (
        <ServerPanel server={effectiveServer} isPlayer={isPlayer} />
      )}

      {/* ── Admin result form ── */}
      {isAdmin && !isFinished && match.team1Id && match.team2Id && (
        <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--card)] p-6">
          <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
            Registrar Resultado (Admin)
          </h3>
          <AdminResultForm
            matchId={match.id}
            tournamentId={tournamentId}
            team1={{ id: match.team1Id, name: team1Name }}
            team2={{ id: match.team2Id, name: team2Name }}
          />
        </div>
      )}
    </div>
  );
}

// ── Admin result form ─────────────────────────────────────────────────────────

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
