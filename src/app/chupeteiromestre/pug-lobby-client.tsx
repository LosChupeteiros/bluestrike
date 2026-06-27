"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Loader2, Crown, Swords, Check, X, Star, Shuffle, Wifi, Copy,
  Eye, EyeOff, Server, PowerOff, Users, Dices, Hand,
} from "lucide-react";
import { CS2_MAP_POOL, getVetoSequence } from "@/lib/maps";
import type { PugLobbyState, PugPlayer, PugVeto, PugRole } from "@/lib/pug";
import { playReadyOne, playReadyBoth, playVeto, playVetoDone, playServerReady } from "@/lib/sounds";

const POLL_MS = 2500;

// ── Helpers ──────────────────────────────────────────────────────────────────

function FactionLogo({ side, className = "h-6 w-6" }: { side: "ct" | "t"; className?: string }) {
  return (
    <span
      aria-label={side === "ct" ? "CT" : "TR"}
      className={`inline-flex items-center justify-center bg-contain bg-center bg-no-repeat text-[9px] font-black ${side === "ct" ? "text-[#7B96FF]" : "text-[#FB923C]"} ${className}`}
      style={{ backgroundImage: `url(${side === "ct" ? "/assets/sides/Ct_logo.webp" : "/assets/sides/Tr_logo.webp"})` }}
    >
      {side === "ct" ? "CT" : "TR"}
    </span>
  );
}

function Avatar({ player, size = 44 }: { player: PugPlayer; size?: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border border-[var(--border)]"
      style={{ width: size, height: size }}
    >
      {player.avatarUrl ? (
        <Image src={player.avatarUrl} alt={player.persona} fill className="object-cover" unoptimized />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[var(--secondary)] text-sm font-bold text-[var(--muted-foreground)]">
          {player.persona[0]?.toUpperCase()}
        </div>
      )}
    </div>
  );
}

function useCopy(value: string) {
  const [copied, setCopied] = useState(false);
  function copy() {
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value).then(done).catch(() => {});
    } else {
      const el = document.createElement("textarea");
      el.value = value; el.style.position = "fixed"; el.style.opacity = "0";
      document.body.appendChild(el); el.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(el); done();
    }
  }
  return { copied, copy };
}

// ── Player card ──────────────────────────────────────────────────────────────

function PlayerCard({
  player, onClick, selectable, captain,
}: { player: PugPlayer; onClick?: () => void; selectable?: boolean; captain?: boolean }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      disabled={onClick ? !selectable : undefined}
      className={`group flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all ${
        selectable
          ? "cursor-pointer border-[var(--border)] hover:border-[var(--primary)]/60 hover:bg-[var(--primary)]/5 active:scale-[0.98]"
          : "border-[var(--border)] bg-[var(--secondary)]/30"
      } ${captain ? "ring-1 ring-[var(--primary)]/40" : ""}`}
    >
      <div className="relative">
        <Avatar player={player} />
        {captain && (
          <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)]">
            <Crown className="h-2.5 w-2.5 text-black" />
          </div>
        )}
        {!player.present && (
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--card)] bg-[var(--muted-foreground)]" title="Ausente" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-[var(--foreground)]">{player.persona}</div>
        <div className="text-[10px] font-semibold text-[var(--muted-foreground)]">
          {captain ? "Capitão · " : ""}{player.elo} ELO
        </div>
      </div>
      {selectable && <Hand className="h-4 w-4 shrink-0 text-[var(--primary)] opacity-0 transition-opacity group-hover:opacity-100" />}
    </Wrapper>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function PugLobbyClient() {
  const [state, setState] = useState<PugLobbyState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/chupeteiromestre/state", { cache: "no-store" });
      if (res.ok) setState(await res.json());
    } catch { /* network — keep last state */ }
  }, []);

  const beat = useCallback(async () => {
    try { await fetch("/api/chupeteiromestre/heartbeat", { method: "POST" }); } catch {}
  }, []);

  useEffect(() => {
    beat();
    refresh();
    const id = setInterval(() => { beat(); refresh(); }, POLL_MS);
    const onVis = () => { if (document.visibilityState === "visible") { beat(); refresh(); } };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [beat, refresh]);

  // ── Sound cues ──
  const inited = useRef(false);
  const prevVetoes = useRef(0);
  const prevStatus = useRef<string | null>(null);
  const prevReady = useRef("");
  useEffect(() => {
    if (!state) return;
    const { lobby, vetoes } = state;
    if (inited.current) {
      if (vetoes.length > prevVetoes.current) {
        const seq = getVetoSequence((lobby.boType as 1 | 3) ?? 3);
        if (vetoes.length >= seq.length) playVetoDone(); else playVeto();
      }
      const readyKey = `${lobby.readyA}|${lobby.readyB}`;
      if (lobby.status === "ready_check" && readyKey !== prevReady.current) {
        if (lobby.readyA && lobby.readyB) playReadyBoth(); else if (lobby.readyA || lobby.readyB) playReadyOne();
      }
      if (lobby.status === "live" && prevStatus.current !== "live") playServerReady();
    }
    prevVetoes.current = vetoes.length;
    prevStatus.current = lobby.status;
    prevReady.current = `${lobby.readyA}|${lobby.readyB}`;
    inited.current = true;
  }, [state]);

  const act = useCallback(async (url: string, body?: unknown) => {
    setBusy(true); setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Erro."); return false; }
      await refresh();
      return true;
    } catch { setError("Erro de rede."); return false; }
    finally { setBusy(false); }
  }, [refresh]);

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const { lobby, players, vetoes, me: meState } = state;
  const status = lobby.status;
  const role: PugRole = meState.role;

  const teamA = players.filter((p) => p.team === "a");
  const teamB = players.filter((p) => p.team === "b");
  const pool = players.filter((p) => p.team === null);
  const captainAName = teamA.find((p) => p.isCaptain)?.persona ?? "Time A";
  const captainBName = teamB.find((p) => p.isCaptain)?.persona ?? "Time B";
  const teamName = (s: "a" | "b") => (s === "a" ? captainAName : captainBName);

  return (
    <div className="min-h-screen pb-24 pt-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--primary)]">
              <Dices className="h-3.5 w-3.5" /> Mix · Capitães
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--foreground)]">Sala de Pug</h1>
          </div>
          {meState.isAdmin && status !== "gathering" && (
            <button
              type="button"
              onClick={() => { if (confirm("Encerrar a partida e liberar uma nova sala? O servidor será deletado.")) act("/api/chupeteiromestre/end"); }}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-300 transition-all hover:bg-red-500/15 disabled:opacity-50"
            >
              <PowerOff className="h-3.5 w-3.5" /> Encerrar
            </button>
          )}
        </div>

        <StatusBar status={status} boType={lobby.boType} />

        {error && (
          <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">{error}</div>
        )}

        <div className="mt-5 space-y-5">
          {status === "gathering" && (
            <Gathering players={players} isAdmin={meState.isAdmin} busy={busy}
              onStart={(boType) => act("/api/chupeteiromestre/start", { boType })} />
          )}

          {(status === "drafting" || status === "ready_check") && (
            <Draft
              status={status} teamA={teamA} teamB={teamB} pool={pool}
              captainAName={captainAName} captainBName={captainBName}
              pickTurn={lobby.pickTurn} meTeam={meState.team} isCaptain={meState.isCaptain}
              readyA={lobby.readyA} readyB={lobby.readyB} busy={busy}
              onPick={(profileId) => act("/api/chupeteiromestre/pick", { profileId })}
              onReady={() => act("/api/chupeteiromestre/ready")}
            />
          )}

          {status === "veto" && (
            <>
              <Teams teamA={teamA} teamB={teamB} captainAName={captainAName} captainBName={captainBName} />
              <Veto
                vetoes={vetoes} isCaptain={meState.isCaptain} meTeam={meState.team}
                teamName={teamName} busy={busy} boType={lobby.boType}
                onVeto={(mapName) => act("/api/chupeteiromestre/veto", { mapName })}
              />
            </>
          )}

          {status === "side_pick" && (
            <>
              <Teams teamA={teamA} teamB={teamB} captainAName={captainAName} captainBName={captainBName} />
              <SidePick
                vetoes={vetoes} isCaptain={meState.isCaptain} meTeam={meState.team}
                teamName={teamName} busy={busy}
                onSide={(vetoId, side) => act("/api/chupeteiromestre/side", { vetoId, side })}
              />
            </>
          )}

          {(status === "provisioning" || status === "live" || status === "error") && (
            <>
              <Teams teamA={teamA} teamB={teamB} captainAName={captainAName} captainBName={captainBName} />
              <ServerPanel
                status={status} server={lobby.server} vetoes={vetoes}
                canConnect={role !== "spectator" || meState.isAdmin}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Status bar ───────────────────────────────────────────────────────────────

function StatusBar({ status, boType }: { status: string; boType: number }) {
  const steps = [
    { key: "gathering", label: "Sala" },
    { key: "drafting", label: "Draft" },
    { key: "ready_check", label: "Ready" },
    { key: "veto", label: "Veto" },
    ...(boType !== 1 ? [{ key: "side_pick", label: "Lados" }] : []),
    { key: "live", label: "Servidor" },
  ];
  const order = steps.map((s) => s.key);
  const norm = status === "provisioning" || status === "error" ? "live" : status;
  const activeIdx = order.indexOf(norm);
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
      {steps.map((s, i) => {
        const done = activeIdx > i;
        const active = norm === s.key;
        return (
          <div key={s.key} className="flex items-center gap-1">
            {i > 0 && <div className={`h-px w-4 ${done ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`} />}
            <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              active ? "bg-[var(--primary)] text-black"
              : done ? "text-[var(--primary)]"
              : "text-[var(--muted-foreground)]"
            }`}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Gathering ────────────────────────────────────────────────────────────────

function Gathering({
  players, isAdmin, busy, onStart,
}: { players: PugPlayer[]; isAdmin: boolean; busy: boolean; onStart: (boType: 1 | 3) => void }) {
  const [boType, setBoType] = useState<1 | 3>(3);
  const count = players.length;
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          <Users className="h-3.5 w-3.5" /> Jogadores na sala
        </div>
        <span className="rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs font-black text-[var(--primary)]">{count}</span>
      </div>

      {count === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-[var(--muted-foreground)]">
          Aguardando jogadores entrarem na sala…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((p) => <PlayerCard key={p.profileId} player={p} />)}
        </div>
      )}

      <div className="border-t border-[var(--border)] p-4">
        {isAdmin ? (
          <>
            <div className="mb-3 flex items-center justify-center gap-2">
              {([1, 3] as const).map((t) => (
                <button key={t} type="button" onClick={() => setBoType(t)}
                  className={`rounded-full px-5 py-1.5 text-xs font-black uppercase tracking-widest transition-all ${
                    boType === t
                      ? "bg-[var(--primary)] text-black shadow"
                      : "border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
                  }`}>
                  MD{t}
                </button>
              ))}
            </div>
            <button
              type="button" onClick={() => onStart(boType)} disabled={busy || count < 2}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3 text-sm font-black uppercase tracking-widest text-black transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />}
              Sortear capitães e começar
            </button>
          </>
        ) : (
          <p className="text-center text-xs text-[var(--muted-foreground)]">
            Aguardando o administrador iniciar o draft…
          </p>
        )}
        {isAdmin && count < 2 && (
          <p className="mt-2 text-center text-[10px] text-[var(--muted-foreground)]">Mínimo de 2 jogadores presentes.</p>
        )}
      </div>
    </div>
  );
}

// ── Draft ────────────────────────────────────────────────────────────────────

function TeamColumn({
  name, players, side, highlight,
}: { name: string; players: PugPlayer[]; side: "a" | "b"; highlight: boolean }) {
  return (
    <div className={`flex flex-col gap-2 rounded-2xl border p-3 transition-all ${
      highlight ? "border-[var(--primary)]/50 bg-[var(--primary)]/5" : "border-[var(--border)] bg-[var(--card)]"
    }`}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-black ${side === "a" ? "bg-[#7B96FF]/20 text-[#7B96FF]" : "bg-[#FB923C]/20 text-[#FB923C]"}`}>
            {side.toUpperCase()}
          </span>
          <span className="truncate text-sm font-black text-[var(--foreground)]">{name}</span>
        </div>
        <span className="text-[10px] font-bold text-[var(--muted-foreground)]">{players.length}</span>
      </div>
      <div className="space-y-1.5">
        {players.map((p) => <PlayerCard key={p.profileId} player={p} captain={p.isCaptain} />)}
        {players.length === 0 && <div className="rounded-lg border border-dashed border-[var(--border)] px-3 py-4 text-center text-[10px] text-[var(--muted-foreground)]">vazio</div>}
      </div>
    </div>
  );
}

function Draft({
  status, teamA, teamB, pool, captainAName, captainBName, pickTurn,
  meTeam, isCaptain, readyA, readyB, busy, onPick, onReady,
}: {
  status: string;
  teamA: PugPlayer[]; teamB: PugPlayer[]; pool: PugPlayer[];
  captainAName: string; captainBName: string; pickTurn: "a" | "b" | null;
  meTeam: "a" | "b" | null; isCaptain: boolean;
  readyA: boolean; readyB: boolean; busy: boolean;
  onPick: (profileId: string) => void; onReady: () => void;
}) {
  const myTurn = status === "drafting" && isCaptain && meTeam === pickTurn;
  const turnName = pickTurn === "a" ? captainAName : pickTurn === "b" ? captainBName : "";

  return (
    <>
      {status === "drafting" && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm">
          {myTurn ? (
            <span className="flex items-center gap-2 font-black text-[var(--primary)]">
              <Hand className="h-4 w-4 animate-pulse" /> Sua vez — escolha um jogador
            </span>
          ) : (
            <span className="text-[var(--muted-foreground)]">
              Vez de <span className="font-bold text-[var(--foreground)]">{turnName}</span> escolher…
            </span>
          )}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <TeamColumn name={captainAName} players={teamA} side="a" highlight={pickTurn === "a" && status === "drafting"} />
        <TeamColumn name={captainBName} players={teamB} side="b" highlight={pickTurn === "b" && status === "drafting"} />
      </div>

      {status === "drafting" && pool.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="border-b border-[var(--border)] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
            Disponíveis ({pool.length})
          </div>
          <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {pool.map((p) => (
              <PlayerCard
                key={p.profileId} player={p}
                selectable={myTurn && !busy}
                onClick={() => myTurn && !busy && onPick(p.profileId)}
              />
            ))}
          </div>
        </div>
      )}

      {status === "ready_check" && (
        <ReadyCheck
          captainAName={captainAName} captainBName={captainBName}
          readyA={readyA} readyB={readyB} meTeam={meTeam} isCaptain={isCaptain}
          busy={busy} onReady={onReady}
        />
      )}
    </>
  );
}

function ReadyCheck({
  captainAName, captainBName, readyA, readyB, meTeam, isCaptain, busy, onReady,
}: {
  captainAName: string; captainBName: string; readyA: boolean; readyB: boolean;
  meTeam: "a" | "b" | null; isCaptain: boolean; busy: boolean; onReady: () => void;
}) {
  const myReady = meTeam === "a" ? readyA : meTeam === "b" ? readyB : false;
  const bothReady = readyA && readyB;
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] bg-[var(--secondary)]/40 px-5 py-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Times prontos?</div>
        <div className="text-[10px] text-[var(--muted-foreground)]">Os dois capitães confirmam para iniciar o veto.</div>
      </div>
      <div className="grid grid-cols-[1fr_48px_1fr] items-center gap-2 px-5 py-5">
        {[{ name: captainAName, ready: readyA }, null, { name: captainBName, ready: readyB }].map((t, i) =>
          t === null ? (
            <div key="vs" className="flex items-center justify-center">
              <Swords className={`h-5 w-5 ${bothReady ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`} />
            </div>
          ) : (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-base font-black ${
                t.ready ? "border-green-500 bg-green-500/10 text-green-400" : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]"
              }`}>
                {t.ready ? <Check className="h-5 w-5" /> : (i === 0 ? "A" : "B")}
              </div>
              <div className="text-center">
                <div className="max-w-[110px] truncate text-xs font-bold text-[var(--foreground)]">{t.name}</div>
                <div className={`text-[10px] font-semibold ${t.ready ? "text-green-400" : "text-[var(--muted-foreground)]"}`}>
                  {t.ready ? "✓ READY" : "Aguardando"}
                </div>
              </div>
            </div>
          )
        )}
      </div>
      {isCaptain && !myReady && (
        <div className="border-t border-[var(--border)] px-5 py-3">
          <button type="button" onClick={onReady} disabled={busy}
            className="w-full rounded-xl bg-[var(--primary)] py-2.5 text-xs font-black uppercase tracking-widest text-black transition-all hover:brightness-110 active:scale-95 disabled:opacity-50">
            {busy ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : "Confirmar Ready"}
          </button>
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

// ── Teams (compact, shown during veto/server) ────────────────────────────────

function Teams({
  teamA, teamB, captainAName, captainBName,
}: { teamA: PugPlayer[]; teamB: PugPlayer[]; captainAName: string; captainBName: string }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {[{ name: captainAName, players: teamA, side: "a" as const }, { name: captainBName, players: teamB, side: "b" as const }].map((t) => (
        <div key={t.side} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-black ${t.side === "a" ? "bg-[#7B96FF]/20 text-[#7B96FF]" : "bg-[#FB923C]/20 text-[#FB923C]"}`}>
              {t.side.toUpperCase()}
            </span>
            <span className="truncate text-sm font-black text-[var(--foreground)]">{t.name}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {t.players.map((p) => (
              <div key={p.profileId} className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--secondary)]/40 py-0.5 pl-0.5 pr-2.5">
                <Avatar player={p} size={22} />
                <span className="text-[11px] font-semibold text-[var(--foreground)]">{p.persona}</span>
                {p.isCaptain && <Crown className="h-3 w-3 text-[var(--primary)]" />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Veto ─────────────────────────────────────────────────────────────────────

function Veto({
  vetoes, isCaptain, meTeam, teamName, busy, boType, onVeto,
}: {
  vetoes: PugVeto[]; isCaptain: boolean; meTeam: "a" | "b" | null;
  teamName: (s: "a" | "b") => string; busy: boolean; boType: number; onVeto: (mapName: string) => void;
}) {
  const sequence = getVetoSequence((boType as 1 | 3) ?? 3);
  const currentStep = vetoes.length;
  const isDone = currentStep >= sequence.length;
  const slot = isDone ? null : sequence[currentStep];
  const expectedTeam: "a" | "b" | null = slot ? (slot.turn === "team1" ? "a" : "b") : null;
  const myTurn = isCaptain && meTeam === expectedTeam && !isDone;

  const used = new Set(vetoes.map((v) => v.mapName));
  const pickNames = vetoes.filter((v) => v.action === "pick").map((v) => v.mapName);
  const banNames = new Set(vetoes.filter((v) => v.action === "ban").map((v) => v.mapName));
  const decider = isDone ? CS2_MAP_POOL.find((m) => !pickNames.includes(m.name) && !banNames.has(m.name))?.name ?? null : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-2.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Veto — MD{boType}</span>
        <div className="flex items-center gap-1">
          {sequence.map((s, i) => {
            const d = i < vetoes.length; const a = i === currentStep;
            return <div key={i} className={`h-1.5 w-1.5 rounded-full ${d ? (s.action === "ban" ? "bg-red-500" : "bg-[var(--primary)]") : a ? "animate-pulse bg-[var(--primary)]/50" : "bg-[var(--border)]"}`} />;
          })}
          <span className="ml-1.5 font-mono text-[10px] text-[var(--muted-foreground)]">{currentStep}/{sequence.length}</span>
        </div>
      </div>

      {!isDone && slot && (
        <div className="flex items-center gap-3 border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/5 to-transparent px-5 py-3">
          <div className="text-sm">
            <span className="font-black text-[var(--foreground)]">{teamName(expectedTeam!)}</span>{" "}
            <span className="text-[var(--muted-foreground)]">vai </span>
            <span className={`font-bold ${slot.action === "ban" ? "text-red-400" : "text-[var(--primary)]"}`}>
              {slot.action === "ban" ? "vetar" : "escolher (pick)"}
            </span>
          </div>
          {myTurn && <span className="ml-auto animate-pulse rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">Sua vez</span>}
        </div>
      )}

      {isDone && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--primary)]/5 px-5 py-3">
          <Check className="h-4 w-4 text-[var(--primary)]" />
          <span className="text-sm font-bold text-[var(--primary)]">Veto concluído</span>
          {pickNames.map((m) => <span key={m} className="rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">{m}</span>)}
          {decider && <span className="rounded-full border border-[var(--primary)]/40 bg-[var(--primary)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">{decider} (sobra)</span>}
        </div>
      )}

      <div className="grid grid-cols-4 gap-1.5 p-3 sm:grid-cols-5 lg:grid-cols-7">
        {CS2_MAP_POOL.map((map) => {
          const entry = vetoes.find((v) => v.mapName === map.name);
          const isBanned = entry?.action === "ban";
          const isPicked = entry?.action === "pick";
          const isDecider = isDone && map.name === decider;
          const selectable = myTurn && !used.has(map.name) && !busy;
          return (
            <button key={map.name} type="button" disabled={!selectable}
              onClick={() => selectable && onVeto(map.name)}
              className={`group relative overflow-hidden rounded-xl border-2 transition-all ${
                isBanned ? "border-red-900/30 opacity-25"
                : isPicked || isDecider ? "border-[var(--primary)] shadow-[0_0_12px_rgba(0,200,255,0.18)]"
                : selectable ? "cursor-pointer border-[var(--border)] hover:scale-[1.03] hover:border-[var(--primary)]/60"
                : "cursor-default border-[var(--border)]"
              }`}>
              <div className="relative aspect-[3/4]">
                <Image src={map.localImage} alt={map.name} fill sizes="14vw" className={`object-cover ${isBanned ? "grayscale" : "group-hover:scale-105"} transition-transform`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                {isBanned && <div className="absolute inset-0 flex items-center justify-center"><X className="h-6 w-6 text-red-500" /></div>}
                {(isPicked || isDecider) && <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)]"><Star className="h-2.5 w-2.5 text-black" /></div>}
                <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1">
                  <div className="text-[9px] font-black uppercase tracking-wide text-white drop-shadow">{map.name}</div>
                  {isBanned && <div className="text-[8px] font-bold text-red-400">VETADO</div>}
                  {isPicked && <div className="text-[8px] font-bold text-[var(--primary)]">PICK</div>}
                  {isDecider && <div className="text-[8px] font-bold text-[var(--primary)]">SOBRA</div>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Side pick ────────────────────────────────────────────────────────────────

function SidePick({
  vetoes, isCaptain, meTeam, teamName, busy, onSide,
}: {
  vetoes: PugVeto[]; isCaptain: boolean; meTeam: "a" | "b" | null;
  teamName: (s: "a" | "b") => string; busy: boolean; onSide: (vetoId: string, side: "ct" | "t") => void;
}) {
  const picks = vetoes.filter((v) => v.action === "pick");
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--primary)]/25 bg-[var(--card)]">
      <div className="border-b border-[var(--border)] bg-[var(--primary)]/5 px-5 py-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Escolha de lados</div>
        <div className="text-[11px] text-[var(--muted-foreground)]">O adversário de cada pick escolhe começar CT ou TR. O decider é na faca.</div>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2">
        {picks.map((pick) => {
          const pickerTeam = pick.team;
          const chooserTeam: "a" | "b" = pickerTeam === "a" ? "b" : "a";
          const canChoose = isCaptain && meTeam === chooserTeam && !pick.pickedSide;
          return (
            <div key={pick.id} className={`rounded-xl border p-3 ${!pick.pickedSide ? "border-[var(--primary)]/25 bg-[var(--primary)]/5" : "border-[var(--border)] bg-[var(--secondary)]/30"}`}>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Mapa {pick.vetoOrder}</div>
                  <div className="text-base font-black text-[var(--foreground)]">{pick.mapName}</div>
                </div>
              </div>
              <div className="mb-3 text-[11px] text-[var(--muted-foreground)]">
                Pick de <span className="font-bold text-[var(--foreground)]">{teamName(pickerTeam)}</span>. Lado de{" "}
                <span className="font-bold text-[var(--foreground)]">{teamName(chooserTeam)}</span>.
              </div>
              {pick.pickedSide ? (
                <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs font-black text-green-300">
                  <FactionLogo side={pick.pickedSide} className="h-6 w-6" />
                  {teamName(chooserTeam)} começa {pick.pickedSide.toUpperCase()}
                </div>
              ) : canChoose ? (
                <div className="grid grid-cols-2 gap-2">
                  {(["ct", "t"] as const).map((side) => (
                    <button key={side} type="button" disabled={busy} onClick={() => onSide(pick.id, side)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-black/30 px-3 py-2 text-xs font-black transition-all hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/10 disabled:opacity-50">
                      <FactionLogo side={side} className="h-7 w-7" /> {side.toUpperCase()}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-200/80">
                  Aguardando {teamName(chooserTeam)} escolher o lado.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Server panel ─────────────────────────────────────────────────────────────

function ServerPanel({
  status, server, vetoes, canConnect,
}: {
  status: string;
  server: PugLobbyState["lobby"]["server"];
  vetoes: PugVeto[];
  canConnect: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const ip = server?.ip ?? null;
  const ready = (server?.status === "ready" || server?.status === "live") && ip && server?.port && server?.password;
  const connectCmd = ready ? `connect ${ip}:${server!.port}; password ${server!.password}` : "";
  const steamUrl = ready ? (server!.connectString ?? `steam://connect/${ip}:${server!.port}/${server!.password}`) : "#";
  const { copied, copy } = useCopy(connectCmd);

  const picks = vetoes.filter((v) => v.action === "pick").map((v) => v.mapName);
  const bans = new Set(vetoes.filter((v) => v.action === "ban").map((v) => v.mapName));
  const decider = CS2_MAP_POOL.find((m) => !picks.includes(m.name) && !bans.has(m.name))?.name ?? null;
  const mapline = [...picks, decider].filter(Boolean).join(" · ");

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
          <Server className="h-3.5 w-3.5" /> Servidor
        </div>
        {server?.status === "live" && (
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" /> Ao vivo
          </span>
        )}
      </div>

      {mapline && (
        <div className="border-b border-[var(--border)] px-5 py-2 text-[11px] text-[var(--muted-foreground)]">
          Mapas: <span className="font-semibold text-[var(--foreground)]">{mapline}</span>
        </div>
      )}

      {status === "error" || server?.status === "error" ? (
        <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
            <X className="h-6 w-6 text-red-400" />
          </div>
          <div className="text-sm font-bold text-red-300">Falha ao criar o servidor</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">Um administrador pode encerrar e iniciar uma nova sala.</div>
        </div>
      ) : !ready ? (
        <div className="flex flex-col items-center gap-4 px-5 py-12">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-[var(--primary)]/8" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/5">
              <Server className="h-7 w-7 text-[var(--primary)]/50" />
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-[var(--foreground)]">Criando servidor CS2…</div>
            <div className="mt-1 text-[10px] text-[var(--muted-foreground)]">Duplicando e configurando o MatchZy. Aguarde.</div>
          </div>
        </div>
      ) : !canConnect ? (
        <p className="px-5 py-8 text-center text-xs text-[var(--muted-foreground)]">Conexão disponível apenas para os jogadores da partida.</p>
      ) : (
        <div className="flex flex-col gap-3 p-5">
          <a href={steamUrl} className="flex items-center justify-center gap-2.5 rounded-xl bg-[var(--primary)] py-3 text-sm font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(0,200,255,0.25)] transition-all hover:brightness-110 active:scale-[0.98]">
            <Wifi className="h-4 w-4" /> Entrar no servidor
          </a>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Comando CS2</span>
              <button type="button" onClick={() => setRevealed((v) => !v)} className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">
                {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}{revealed ? "ocultar" : "revelar"}
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-black/40 px-3 py-2.5">
              <code className="flex-1 break-all font-mono text-xs text-[var(--foreground)] select-all">
                {revealed ? connectCmd : "●".repeat(Math.min(connectCmd.length, 38))}
              </code>
              <button type="button" onClick={copy} title="Copiar" className="shrink-0 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
