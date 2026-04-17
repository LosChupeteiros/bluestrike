"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Radio,
  RefreshCw,
  Shield,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import type { FaceitChampionship, FaceitMatch, FaceitSubscribedTeam } from "@/lib/faceit";
import FaceitBracketView from "./faceit-bracket-view";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatUnix(ms: number): string {
  if (!ms) return "A definir";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(ms));
}

function formatUnixShort(s: number): string {
  if (!s) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(s * 1000));
}

function statusLabel(status: string): string {
  switch (status) {
    case "join":         return "Inscrições abertas";
    case "checking_in": return "Check-in";
    case "ongoing":     return "Em andamento";
    case "finished":    return "Finalizado";
    case "cancelled":   return "Cancelado";
    default:            return "Em breve";
  }
}

function statusClasses(status: string): string {
  switch (status) {
    case "join":         return "bg-green-500/40 border-green-500/60 text-green-300";
    case "checking_in": return "bg-[#FF5500]/40 border-[#FF5500]/60 text-[#FF7733]";
    case "ongoing":     return "bg-cyan-500/40 border-cyan-500/60 text-cyan-300";
    case "finished":    return "bg-white/15 border-white/25 text-white/70";
    case "cancelled":   return "bg-red-500/40 border-red-500/60 text-red-300";
    default:            return "bg-yellow-500/40 border-yellow-500/60 text-yellow-300";
  }
}

// Label inteligente: usa o nome da chave quando descritivo,
// cai para inferência por posição (single = penúltima é semi, última é final;
// double = apenas a última é grande final).
function smartRoundLabel(key: string, idx: number, total: number, type: string): string {
  const k = key.toLowerCase();

  // Chaves com nomes explícitos têm prioridade
  if (k.includes("grand_final") || k === "grand_final") return "Grande Final";
  if (k === "finals" || (k.includes("final") && !k.includes("semi") && !k.includes("quarter"))) return "Grande Final";
  if (k.includes("3rd_place") || k.includes("third_place") || k === "3rd" || k === "third") return "3º Lugar";
  if (k.includes("semi"))    return "Semifinal";
  if (k.includes("quarter")) return "Quartas de Final";

  // Inferência por posição para chaves genéricas (round_1, round_2…)
  const isDouble = type === "doubleElimination" || type === "double_elimination";
  const isLast         = idx === total - 1;
  const isSecondToLast = idx === total - 2;

  if (isLast) return "Grande Final";
  if (isSecondToLast && !isDouble) return "Semifinal";

  // Fallback: extrai número da chave
  const m = key.match(/\d+/);
  return m ? `Rodada ${m[0]}` : key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const MAP_NAMES: Record<string, string> = {
  de_dust2: "Dust2",
  de_mirage: "Mirage",
  de_nuke: "Nuke",
  de_overpass: "Overpass",
  de_ancient: "Ancient",
  de_inferno: "Inferno",
  de_anubis: "Anubis",
  de_vertigo: "Vertigo",
  de_train: "Train",
};

function mapName(id: string): string {
  return MAP_NAMES[id] ?? id.replace("de_", "");
}

// Falls back to initials when the FACEIT CDN returns an error (e.g. 400).
function FaceitAvatar({
  src,
  name,
  size,
  fallbackClass = "text-sm font-black text-[#FF5500]",
}: {
  src: string | null;
  name: string;
  size: number;
  fallbackClass?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name ? name.slice(0, 2).toUpperCase() : "?";

  if (!src || failed) {
    return (
      <div className={`flex h-full w-full items-center justify-center font-black ${fallbackClass}`}>
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      fill
      sizes={`${size}px`}
      className="object-cover"
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}

function matchStatusLabel(status: string): string {
  switch (status) {
    case "ONGOING":     return "Em andamento";
    case "FINISHED":    return "Finalizado";
    case "CANCELLED":
    case "ABORTED":     return "Cancelado";
    case "READY":       return "Pronto";
    case "CONFIGURING": return "Configurando";
    case "SCHEDULED":   return "Agendado";
    default:            return status;
  }
}

function matchStatusStyle(status: string): { classes: string; pulse: boolean } {
  switch (status) {
    case "ONGOING":     return { classes: "border-red-500/40 text-red-300 bg-red-500/10", pulse: true };
    case "FINISHED":    return { classes: "border-white/15 text-[var(--muted-foreground)] bg-white/5", pulse: false };
    case "CANCELLED":
    case "ABORTED":     return { classes: "border-red-500/25 text-red-400/60 bg-red-500/5", pulse: false };
    case "READY":       return { classes: "border-green-500/40 text-green-300 bg-green-500/10", pulse: false };
    case "CONFIGURING": return { classes: "border-yellow-500/40 text-yellow-300 bg-yellow-500/10", pulse: false };
    default:            return { classes: "border-[var(--border)] text-[var(--muted-foreground)] bg-[var(--secondary)]", pulse: false };
  }
}

function subStatusLabel(status: string): string {
  switch (status) {
    case "playing":        return "Jogando";
    case "checkin":        return "Check-in";
    case "joined":         return "Inscrito";
    case "cancelled":      return "Cancelado";
    case "disqualified":   return "Desclassificado";
    default:               return status;
  }
}

function subStatusStyle(status: string): string {
  switch (status) {
    case "playing":      return "border-green-500/30 text-green-300 bg-green-500/10";
    case "checkin":      return "border-[#FF5500]/30 text-[#FF7733] bg-[#FF5500]/10";
    case "joined":       return "border-cyan-500/30 text-cyan-300 bg-cyan-500/10";
    case "cancelled":
    case "disqualified": return "border-red-500/25 text-red-400 bg-red-500/8";
    default:             return "border-[var(--border)] text-[var(--muted-foreground)] bg-[var(--secondary)]";
  }
}

function avgSkillLevel(members: FaceitSubscribedTeam["members"], roster: string[]): number {
  const active = members.filter((m) => roster.includes(m.userId));
  if (active.length === 0) return 0;
  return Math.round(active.reduce((s, m) => s + m.skillLevel, 0) / active.length);
}

// ── sub-components ───────────────────────────────────────────────────────────

function TeamFactionBlock({
  faction,
  isWinner,
  score,
  align,
}: {
  faction: FaceitMatch["teams"]["faction1"];
  isWinner: boolean;
  score: number;
  align: "left" | "right";
}) {
  const isRight = align === "right";
  return (
    <div className={`flex flex-1 items-center gap-3 ${isRight ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#FF5500]/20 bg-gradient-to-br from-[#1e0800] to-black">
        {faction.avatar ? (
          <FaceitAvatar src={faction.avatar} name={faction.name} size={48} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-black text-[#FF5500]">
            {faction.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className={`min-w-0 ${isRight ? "text-right" : ""}`}>
        <p className={`truncate text-sm font-bold ${isWinner ? "text-white" : "text-[var(--muted-foreground)]"}`}>
          {faction.name}
        </p>
        {/* Mini roster avatars */}
        <div className={`mt-1 flex gap-0.5 ${isRight ? "justify-end" : ""}`}>
          {faction.roster.slice(0, 5).map((p) => (
            <Avatar key={p.playerId} className="h-4 w-4 ring-1 ring-[var(--background)]">
              <AvatarImage src={p.avatar ?? ""} />
              <AvatarFallback className="text-[6px] bg-[var(--secondary)]">
                {p.nickname.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>

      {/* Score */}
      <div className={`shrink-0 text-2xl font-black tabular-nums ${isWinner ? "text-white" : "text-[var(--muted-foreground)]"}`}>
        {score}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: FaceitMatch }) {
  const { classes: statusCls, pulse } = matchStatusStyle(match.status);
  const isFinished = match.status === "FINISHED";
  const f1Won = match.results.winner === "faction1";
  const f2Won = match.results.winner === "faction2";
  const hasScore = isFinished || match.status === "ONGOING";

  return (
    <a
      href={match.faceitUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-[#FF5500]/12 bg-[var(--card)] p-4 transition-all hover:border-[#FF5500]/35 hover:shadow-[0_4px_20px_rgba(255,85,0,0.08)]"
    >
      {/* Header: round + status */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
          Rodada {match.round}{match.group > 1 ? ` · Grupo ${match.group}` : ""} · BO{match.bestOf}
        </span>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCls}`}>
            {pulse && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
            {matchStatusLabel(match.status)}
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-60" />
        </div>
      </div>

      {/* VS row */}
      <div className="flex items-center gap-2">
        <TeamFactionBlock
          faction={match.teams.faction1}
          isWinner={f1Won}
          score={hasScore ? match.results.score.faction1 : 0}
          align="left"
        />

        <div className="shrink-0 px-2 text-center">
          {hasScore ? (
            <span className="text-xs font-bold text-[var(--muted-foreground)]">vs</span>
          ) : (
            <span className="text-xs font-bold text-[var(--muted-foreground)]">vs</span>
          )}
        </div>

        <TeamFactionBlock
          faction={match.teams.faction2}
          isWinner={f2Won}
          score={hasScore ? match.results.score.faction2 : 0}
          align="right"
        />
      </div>

      {/* Footer: maps + time */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[var(--border)] pt-3">
        {match.maps.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {match.maps.map((m) => (
              <span key={m} className="rounded-md border border-[var(--border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)]">
                {mapName(m)}
              </span>
            ))}
          </div>
        )}
        <span className="ml-auto text-xs text-[var(--muted-foreground)]">
          {match.startedAt
            ? formatUnixShort(match.startedAt)
            : match.scheduledAt
              ? formatUnixShort(match.scheduledAt)
              : "—"}
        </span>
      </div>
    </a>
  );
}

function SubscribedTeamCard({ sub }: { sub: FaceitSubscribedTeam }) {
  const avg = avgSkillLevel(sub.members, sub.roster);
  const activePlayers = sub.members.filter((m) => sub.roster.includes(m.userId));
  const subs = sub.members.filter((m) => sub.substitutes.includes(m.userId));

  return (
    <a
      href={sub.teamUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-xl border border-[#FF5500]/12 bg-[var(--card)] p-4 transition-all hover:border-[#FF5500]/35 hover:shadow-[0_4px_20px_rgba(255,85,0,0.08)]"
    >
      {/* Avatar real do time via GET /v4/teams/{id} */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#FF5500]/20 bg-gradient-to-br from-[#1e0800] to-black">
        {sub.avatar ? (
          <FaceitAvatar src={sub.avatar} name={sub.name} size={48} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-black text-[#FF5500]">
            {sub.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="truncate font-bold text-sm text-[var(--foreground)] group-hover:text-[#FF5500] transition-colors">
            {sub.name}
          </span>
          {sub.group > 0 && (
            <span className="shrink-0 text-xs text-[var(--muted-foreground)]">Grupo {sub.group}</span>
          )}
          <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${subStatusStyle(sub.status)}`}>
            {subStatusLabel(sub.status)}
          </span>
        </div>

        {/* Active roster avatars */}
        <div className="flex items-center gap-2">
          <div className="flex">
            {activePlayers.slice(0, 5).map((p, i) => (
              <Avatar
                key={p.userId}
                className="h-6 w-6 ring-2 ring-[var(--background)]"
                style={{ marginLeft: i > 0 ? "-6px" : 0 }}
              >
                <AvatarImage src={p.avatar ?? ""} />
                <AvatarFallback className="text-[8px] bg-[var(--secondary)]">
                  {p.nickname.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-xs text-[var(--muted-foreground)]">
            {activePlayers.length} titulares
            {subs.length > 0 && ` · ${subs.length} subs`}
          </span>
          {avg > 0 && (
            <span className="ml-auto flex items-center gap-1 text-xs font-bold" style={{ color: "#FF5500" }}>
              <Image
                src={`/assets/faceit_ranks/${avg}.svg`}
                alt={`Nível ${avg}`}
                width={14}
                height={14}
                unoptimized
              />
              Nv. {avg}
            </span>
          )}
        </div>
      </div>

      <ExternalLink className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-60" />
    </a>
  );
}

// ── main component ───────────────────────────────────────────────────────────

type Tab = "overview" | "matches" | "teams" | "bracket";

interface FaceitChampionshipTabsProps {
  championship: FaceitChampionship;
  matches: FaceitMatch[];
  subscribedTeams: FaceitSubscribedTeam[];
  championshipId: string;
}

export default function FaceitChampionshipTabs({
  championship,
  matches,
  subscribedTeams: initialTeams,
  championshipId,
}: FaceitChampionshipTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // ── Teams live state ──────────────────────────────────────────────────────
  const [teams, setTeams] = useState<FaceitSubscribedTeam[]>(initialTeams);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsCooldown, setTeamsCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTeams = useCallback(async () => {
    setTeamsLoading(true);
    try {
      const res = await fetch(`/api/tournaments/faceit/${championshipId}/subscriptions`);
      if (res.ok) {
        const d = await res.json() as { teams: FaceitSubscribedTeam[] };
        setTeams(d.teams ?? []);
      }
    } finally {
      setTeamsLoading(false);
    }
  }, [championshipId]);

  // Atualiza quando entra na aba Times
  useEffect(() => {
    if (activeTab === "teams") fetchTeams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Countdown do cooldown manual
  useEffect(() => {
    if (teamsCooldown <= 0) return;
    cooldownRef.current = setInterval(() => setTeamsCooldown((c) => Math.max(0, c - 1)), 1_000);
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [teamsCooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleTeamsRefresh() {
    if (teamsCooldown > 0 || teamsLoading) return;
    await fetchTeams();
    setTeamsCooldown(30);
  }

  const hasPrizes = championship.prizeFirst || championship.prizeSecond || championship.prizeThird;

  // Group matches by round for ordered display
  const matchesByRound = matches.reduce<Record<number, FaceitMatch[]>>((acc, m) => {
    const key = m.round;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});
  const sortedRounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  // ASAP (date=0) vai sempre ao fim; entre itens sem data, ordena pelo número da chave
  const scheduleEntries = Object.entries(championship.schedule).sort(
    ([keyA, a], [keyB, b]) => {
      const hasA = Boolean(a.date);
      const hasB = Boolean(b.date);
      if (hasA && hasB) return a.date - b.date;
      if (hasA) return -1;
      if (hasB) return 1;
      // ambos ASAP → ordena pelo número extraído da chave
      const nA = Number((keyA.match(/\d+/) ?? ["999"])[0]);
      const nB = Number((keyB.match(/\d+/) ?? ["999"])[0]);
      return nA - nB;
    }
  );

  const isBracketType = championship.type === "bracket" || championship.type === "doubleElimination";

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Visão Geral" },
    ...(matches.length > 0 ? [{ id: "matches" as Tab, label: "Partidas", count: matches.length }] : []),
    ...(teams.length > 0 ? [{ id: "teams" as Tab, label: "Times", count: teams.length }] : [{ id: "teams" as Tab, label: "Times" }]),
    ...(matches.length > 0 && isBracketType ? [{ id: "bracket" as Tab, label: "Bracket" }] : []),
  ];

  return (
    <>
      {/* Tab bar */}
      <div className="mb-6 flex items-center gap-1 border-b border-[var(--border)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === t.id
                ? "text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={
                  activeTab === t.id
                    ? { backgroundColor: "rgba(255,85,0,0.15)", color: "#FF5500" }
                    : { backgroundColor: "var(--secondary)", color: "var(--muted-foreground)" }
                }
              >
                {t.count}
              </span>
            )}
            {activeTab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ backgroundColor: "#FF5500" }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Aba: Visão Geral ──────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">

          {/* 1 — Distribuição de prêmios */}
          {hasPrizes && (
            <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/5 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                <Trophy className="h-4 w-4 text-yellow-400" />
                Distribuição de prêmios
              </h3>
              <div className="space-y-3">
                {championship.prizeFirst && championship.prizeFirst > 0 && (
                  <div className="flex items-center justify-between rounded-lg border border-yellow-500/15 bg-yellow-500/8 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🥇</span>
                      <span className="text-sm font-semibold text-yellow-300">1º lugar</span>
                    </div>
                    <span className="text-lg font-black text-yellow-400">{formatCurrency(championship.prizeFirst)}</span>
                  </div>
                )}
                {championship.prizeSecond && championship.prizeSecond > 0 && (
                  <div className="flex items-center justify-between rounded-lg border border-white/8 bg-white/4 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🥈</span>
                      <span className="text-sm font-semibold text-slate-300">2º lugar</span>
                    </div>
                    <span className="text-base font-black text-slate-300">{formatCurrency(championship.prizeSecond)}</span>
                  </div>
                )}
                {championship.prizeThird && championship.prizeThird > 0 && (
                  <div className="flex items-center justify-between rounded-lg border border-white/8 bg-white/4 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🥉</span>
                      <span className="text-sm font-semibold text-amber-600">3º lugar</span>
                    </div>
                    <span className="text-base font-black text-amber-600">{formatCurrency(championship.prizeThird)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2 — Datas */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              Datas
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: "Início das inscrições", value: formatUnix(championship.subscriptionStart), icon: Calendar },
                { label: "Fim das inscrições", value: formatUnix(championship.subscriptionEnd), icon: Clock },
                { label: "Check-in", value: championship.checkinEnabled ? formatUnix(championship.checkinStart) : "Não exigido", icon: CheckCircle2 },
                { label: "Início do campeonato", value: formatUnix(championship.championshipStart), icon: Calendar },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3">
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#FF5500" }} />
                  <div>
                    <div className="text-xs text-[var(--muted-foreground)]">{item.label}</div>
                    <div className="text-sm font-semibold">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3 — Cronograma de rodadas — cards horizontais */}
          {scheduleEntries.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                Cronograma de rodadas
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
                {scheduleEntries.map(([round, info], idx) => {
                  const label = smartRoundLabel(round, idx, scheduleEntries.length, championship.type);
                  const dateStr = info.date ? formatUnix(info.date) : "ASAP";
                  const isLast = idx === scheduleEntries.length - 1;
                  return (
                    <div
                      key={round}
                      className={`flex shrink-0 items-start gap-3 rounded-xl border p-4 ${
                        isLast
                          ? "border-yellow-500/25 bg-yellow-500/6"
                          : "border-[var(--border)] bg-[var(--secondary)]"
                      }`}
                      style={{ minWidth: "11rem" }}
                    >
                      {/* Ícone calendário */}
                      <div className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${isLast ? "bg-yellow-500/15" : "bg-[var(--border)]"}`}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          style={{ color: isLast ? "#fbbf24" : "#FF5500" }}
                        >
                          <path fillRule="evenodd" clipRule="evenodd"
                            d="M5 2h2v2h10V2h2v2h2v17H3V4h2V2zm0 7v10h14V9H5zm2 2h2v2H7v-2zm6 0h-2v2h2v-2zm4 0h-2v2h2v-2z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                      {/* Texto */}
                      <div className="min-w-0">
                        <p className={`text-xs font-black uppercase tracking-wide ${isLast ? "text-yellow-300" : ""}`}
                          style={!isLast ? { color: "#FF5500" } : undefined}>
                          {label}
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-snug text-[var(--foreground)]">{dateStr}</p>
                        <span className={`mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClasses(info.status)}`}>
                          {statusLabel(info.status)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4 — Sobre o campeonato (último) */}
          {championship.description && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                Sobre o campeonato
              </h3>
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                {championship.description}
              </p>
            </div>
          )}

          {championship.stream.active && (
            <div className="rounded-xl border border-[#FF5500]/25 bg-[#FF5500]/5 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                <Radio className="h-4 w-4" style={{ color: "#FF5500" }} />
                Live
              </h3>
              <p className="mb-3 text-sm font-semibold">{championship.stream.title || "Transmissão ao vivo"}</p>
              {championship.stream.source && (
                <a
                  href={championship.stream.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#FF5500]/30 px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-[#FF5500]/10"
                  style={{ color: "#FF5500" }}
                >
                  Assistir na {championship.stream.platform || "live"}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Aba: Partidas ─────────────────────────────────────────────────── */}
      {activeTab === "matches" && (
        <div className="space-y-8">
          {sortedRounds.length === 0 ? (
            <div className="py-16 text-center text-sm text-[var(--muted-foreground)]">
              Nenhuma partida registrada ainda.
            </div>
          ) : (
            sortedRounds.map((round) => (
              <div key={round}>
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest"
                    style={{ backgroundColor: "rgba(255,85,0,0.12)", color: "#FF5500" }}
                  >
                    Rodada {round}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-[#FF5500]/20 to-transparent" />
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {matchesByRound[round].length} partida{matchesByRound[round].length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-3">
                  {matchesByRound[round].map((m) => (
                    <MatchCard key={m.matchId} match={m} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Aba: Bracket ─────────────────────────────────────────────────── */}
      {activeTab === "bracket" && (
        <FaceitBracketView matches={matches} type={championship.type} />
      )}

      {/* ── Aba: Times ────────────────────────────────────────────────────── */}
      {activeTab === "teams" && (
        <div>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">
              {teamsLoading
                ? "Atualizando..."
                : `${teams.length} time${teams.length !== 1 ? "s" : ""} inscrito${teams.length !== 1 ? "s" : ""}`}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <Users className="h-3.5 w-3.5" />
                Titulares · Subs · Nível médio
              </div>
              <button
                type="button"
                onClick={handleTeamsRefresh}
                disabled={teamsCooldown > 0 || teamsLoading}
                title={teamsCooldown > 0 ? `Disponível em ${teamsCooldown}s` : "Atualizar lista de times"}
                className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition-all disabled:cursor-not-allowed"
                style={{
                  borderColor: teamsCooldown > 0 ? "rgba(255,255,255,0.08)" : "rgba(255,85,0,0.30)",
                  color: teamsCooldown > 0 ? "var(--muted-foreground)" : "#FF5500",
                  backgroundColor: teamsCooldown > 0 ? "transparent" : "rgba(255,85,0,0.08)",
                }}
              >
                {teamsLoading
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <RefreshCw className="h-3 w-3" style={{ opacity: teamsCooldown > 0 ? 0.4 : 1 }} />
                }
                {teamsCooldown > 0 ? `${teamsCooldown}s` : "Atualizar"}
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {teams.map((sub) => (
              <SubscribedTeamCard key={sub.teamId} sub={sub} />
            ))}
            {!teamsLoading && teams.length === 0 && (
              <div className="py-12 text-center text-sm text-[var(--muted-foreground)]">
                Nenhum time inscrito no momento.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
