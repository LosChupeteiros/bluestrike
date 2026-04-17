import { Construction, Crown, Medal, TrendingUp, Zap, Activity, Target, Flame } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockRanking } from "@/data/mock";
import { listFaceitRanking, type FaceitRankingEntry } from "@/lib/profiles";
import { FaceitSkillIcon } from "@/components/ui/faceit-skill-icon";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ranking Global" };
export const revalidate = 1800; // ISR: rebuilt a cada 30 min, sem chamar FACEIT a cada request

// ─── BlueStrike side ────────────────────────────────────────────────────────

function BsPositionBadge({ pos }: { pos: number }) {
  if (pos === 1) return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-yellow-500/40 bg-yellow-500/20">
      <Crown className="h-4 w-4 text-yellow-400" />
    </div>
  );
  if (pos === 2) return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-400/40 bg-gray-500/20">
      <Medal className="h-4 w-4 text-gray-300" />
    </div>
  );
  if (pos === 3) return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-400/40 bg-orange-500/20">
      <Medal className="h-4 w-4 text-orange-400" />
    </div>
  );
  return (
    <div className="flex h-8 w-8 items-center justify-center text-sm font-bold text-[var(--muted-foreground)]">
      #{pos}
    </div>
  );
}

function BluestrikeRanking() {
  return (
    <div className="relative flex h-full flex-col">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
            <TrendingUp className="h-4 w-4" />
            BlueStrike ELO
          </div>
          <h2 className="text-2xl font-black tracking-tight">Ranking Interno</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Baseado em ELO de torneios na plataforma
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-3 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
          <span className="text-xs font-bold text-[var(--primary)]">BETA</span>
        </div>
      </div>

      {/* Podium */}
      <div className="mb-6 grid max-w-sm grid-cols-3 gap-3 mx-auto">
        {[mockRanking[1], mockRanking[0], mockRanking[2]].map((entry, i) => {
          const heights = ["h-24", "h-32", "h-20"];
          const order = ["order-1", "order-2", "order-3"];
          return (
            <div key={entry.profileId} className={cn("flex flex-col items-center", order[i])}>
              <Avatar className={cn(
                "mb-1.5 ring-2",
                entry.position === 1 ? "h-14 w-14 ring-yellow-400/60" :
                entry.position === 2 ? "h-12 w-12 ring-gray-400/40" :
                "h-10 w-10 ring-orange-400/40"
              )}>
                <AvatarImage src={entry.avatarUrl ?? undefined} />
                <AvatarFallback className="text-xs">{entry.nickname[0]}</AvatarFallback>
              </Avatar>
              <div className="mb-0.5 w-full truncate px-1 text-center text-xs font-bold">{entry.nickname}</div>
              <div className="mb-2 text-xs font-black text-[var(--primary)]">{entry.elo.toLocaleString()}</div>
              <div className={cn(
                "flex w-full items-center justify-center rounded-t-lg border",
                heights[i],
                entry.position === 1 ? "border-yellow-500/30 bg-yellow-500/10" :
                entry.position === 2 ? "border-gray-500/30 bg-gray-500/10" :
                "border-orange-500/30 bg-orange-500/10"
              )}>
                <BsPositionBadge pos={entry.position} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 border-b border-[var(--border)] bg-[var(--secondary)] px-4 py-2.5">
          <div className="w-8 text-center text-xs text-[var(--muted-foreground)]">#</div>
          <div className="text-xs text-[var(--muted-foreground)]">Jogador</div>
          <div className="hidden text-center text-xs text-[var(--muted-foreground)] sm:block w-12">K/D</div>
          <div className="w-16 text-right text-xs text-[var(--muted-foreground)]">ELO</div>
        </div>
        {mockRanking.map((entry) => (
          <div
            key={entry.profileId}
            className={cn(
              "grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 border-b border-[var(--border)] px-4 py-3 last:border-0",
              entry.position === 1 && "bg-gradient-to-r from-yellow-500/5 to-transparent",
              entry.position === 2 && "bg-gradient-to-r from-gray-500/5 to-transparent",
              entry.position === 3 && "bg-gradient-to-r from-orange-500/5 to-transparent",
            )}
          >
            <BsPositionBadge pos={entry.position} />
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={entry.avatarUrl ?? undefined} />
                <AvatarFallback className="text-xs">{entry.nickname[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{entry.nickname}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{entry.wins}V · {entry.tournamentsPlayed} torneios</div>
              </div>
            </div>
            <div className="hidden w-12 text-center text-sm font-semibold sm:block">{entry.kdRatio.toFixed(2)}</div>
            <div className="w-16 text-right text-sm font-black text-[var(--primary)]">{entry.elo.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Dev overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[var(--background)]/80 backdrop-blur-[3px]">
        <div className="mx-auto max-w-xs rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-2xl">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10">
              <Construction className="h-7 w-7 text-yellow-400" />
            </div>
          </div>
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-yellow-400">Em Desenvolvimento</div>
          <h3 className="mb-2 text-lg font-black text-[var(--foreground)]">Ranking BlueStrike</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            O sistema de ELO interno está sendo calibrado. Em breve cada partida na plataforma vai contar para o ranking.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── FACEIT side ─────────────────────────────────────────────────────────────

function FaceitPositionBadge({ pos }: { pos: number }) {
  if (pos === 1) return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-yellow-500/50 bg-yellow-500/15 shadow-[0_0_12px_rgba(234,179,8,0.2)]">
      <Crown className="h-4 w-4 text-yellow-400" />
    </div>
  );
  if (pos === 2) return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-400/40 bg-slate-500/15">
      <Medal className="h-4 w-4 text-slate-300" />
    </div>
  );
  if (pos === 3) return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/15">
      <Medal className="h-4 w-4 text-orange-400" />
    </div>
  );
  return (
    <div className="flex h-8 w-8 items-center justify-center text-sm font-bold tabular-nums text-[var(--muted-foreground)]">
      #{pos}
    </div>
  );
}

function StatBadge({ icon: Icon, label, value, accent = false }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={cn(
      "flex flex-col items-center gap-0.5 rounded-lg border px-2 py-1.5",
      accent ? "border-[#FF5500]/20 bg-[#FF5500]/8" : "border-[var(--border)] bg-[var(--secondary)]"
    )}>
      <Icon className={cn("h-3 w-3", accent ? "text-[#FF5500]" : "text-[var(--muted-foreground)]")} />
      <div className={cn("text-xs font-black tabular-nums leading-none", accent ? "text-[#FF5500]" : "text-[var(--foreground)]")}>
        {value}
      </div>
      <div className="text-[10px] leading-none text-[var(--muted-foreground)]">{label}</div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-2 text-center">
      <div className="text-xs font-black tabular-nums leading-none" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] leading-none text-[var(--muted-foreground)]">{label}</div>
    </div>
  );
}

const PODIUM_CONFIG = {
  1: {
    border: "border-yellow-400",
    bg: "from-yellow-500/10 to-[var(--card)]",
    glow: "shadow-[0_0_12px_2px_rgba(253,224,71,0.35)]",
    ring: "ring-yellow-400/65",
    icon: <Crown className="h-3.5 w-3.5 text-yellow-400" />,
    label: "#1",
    labelColor: "text-yellow-400",
    scale: "scale-[1.06] z-10",
  },
  2: {
    border: "border-sky-400",
    bg: "from-sky-400/10 to-[var(--card)]",
    glow: "shadow-[0_0_10px_1px_rgba(56,189,248,0.18)]",
    ring: "ring-sky-400/50",
    icon: <Medal className="h-3.5 w-3.5 text-sky-300" />,
    label: "#2",
    labelColor: "text-sky-300",
    scale: "",
  },
  3: {
    border: "border-orange-400",
    bg: "from-orange-500/10 to-[var(--card)]",
    glow: "shadow-[0_0_10px_1px_rgba(249,115,22,0.18)]",
    ring: "ring-orange-400/45",
    icon: <Medal className="h-3.5 w-3.5 text-orange-400" />,
    label: "#3",
    labelColor: "text-orange-400",
    scale: "",
  },
} as const;

function FaceitPodiumCard({ entry }: { entry: FaceitRankingEntry }) {
  const cfg = PODIUM_CONFIG[entry.position as 1 | 2 | 3] ?? PODIUM_CONFIG[3];

  return (
    <Link href={`/profile/${entry.publicId}`} className={cn("group block transition-transform", cfg.scale)}>
      <div className={cn(
        "rounded-xl border bg-gradient-to-b p-4 transition-all group-hover:brightness-110",
        cfg.border, cfg.bg, cfg.glow
      )}>
        {/* Position badge */}
        <div className="mb-3 flex items-center justify-center gap-1">
          {cfg.icon}
          <span className={cn("text-xs font-bold", cfg.labelColor)}>{cfg.label}</span>
        </div>

        {/* Avatar — img tag evita o quadrado preto do Avatar component */}
        <div className={cn("mx-auto mb-2 h-14 w-14 overflow-hidden rounded-full ring-2", cfg.ring)}>
          {entry.faceitAvatar ?? entry.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(entry.faceitAvatar ?? entry.avatar)!}
              alt={entry.faceitNickname}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#FF5500]/15 font-black text-sm" style={{ color: "#FF5500" }}>
              {entry.faceitNickname[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Level icon */}
        <div className="mb-1 flex justify-center">
          <FaceitSkillIcon level={entry.faceitLevel} size={22} />
        </div>

        {/* Nickname */}
        <div className="mb-0.5 truncate text-center text-xs font-bold transition-colors group-hover:text-[#FF5500]">
          {entry.faceitNickname}
        </div>

        {/* ELO */}
        <div className="mb-3 text-center font-mono text-sm font-black" style={{ color: "#FF5500" }}>
          {entry.faceitElo.toLocaleString()}
        </div>

        {/* Stats 2×2 */}
        <div className="grid grid-cols-2 gap-1.5">
          <MiniStat label="KDR" value={entry.faceitKdRatio?.toFixed(2) ?? "—"} />
          <MiniStat label="Win Rate %" value={entry.faceitWinRate != null ? `${entry.faceitWinRate}%` : "—"} color="#4ade80" />
          <MiniStat label="Partidas" value={entry.faceitMatches?.toLocaleString() ?? "—"} />
          <MiniStat label=">Streak" value={entry.faceitWinStreak != null ? String(entry.faceitWinStreak) : "—"} color="#FF5500" />
        </div>
      </div>
    </Link>
  );
}

function FaceitPodium({ players }: { players: FaceitRankingEntry[] }) {
  const top = players.slice(0, 3);
  if (top.length === 0) return null;

  return (
    <div className={cn(
      "mb-4 grid gap-5",
      top.length === 1 ? "mx-auto max-w-[200px] grid-cols-1" :
      top.length === 2 ? "mx-auto max-w-sm grid-cols-2" :
      "grid-cols-3"
    )}>
      {(top.length === 3 ? [top[1], top[0], top[2]] : top).map((entry) => (
        <FaceitPodiumCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

function FaceitTable({ players }: { players: FaceitRankingEntry[] }) {
  const rest = players.slice(3);
  if (rest.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 border-b border-[var(--border)] bg-[var(--secondary)] px-4 py-2.5">
        <div className="w-8 text-center text-xs text-[var(--muted-foreground)]">#</div>
        <div className="text-xs text-[var(--muted-foreground)]">Jogador</div>
        <div className="hidden w-14 text-center text-xs text-[var(--muted-foreground)] md:block">K/D</div>
        <div className="hidden w-12 text-center text-xs text-[var(--muted-foreground)] lg:block">&gt;Streak</div>
        <div className="hidden w-14 text-center text-xs text-[var(--muted-foreground)] md:block">Win%</div>
        <div className="w-20 text-right text-xs text-[var(--muted-foreground)]">ELO</div>
      </div>

      {rest.map((entry) => (
        <Link
          key={entry.id}
          href={`/profile/${entry.publicId}`}
          className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0 transition-colors hover:bg-[var(--secondary)]/60"
        >
          <FaceitPositionBadge pos={entry.position} />

          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="h-9 w-9 overflow-hidden rounded-full">
                {entry.faceitAvatar ?? entry.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(entry.faceitAvatar ?? entry.avatar)!} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#FF5500]/15 text-xs font-black" style={{ color: "#FF5500" }}>
                    {entry.faceitNickname[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5">
                <FaceitSkillIcon level={entry.faceitLevel} size={20} />
              </div>
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{entry.faceitNickname}</div>
              {entry.faceitMatches != null && (
                <div className="text-xs text-[var(--muted-foreground)]">{entry.faceitMatches.toLocaleString()} partidas</div>
              )}
            </div>
          </div>

          <div className="hidden w-14 text-center text-sm font-semibold md:block">
            {entry.faceitKdRatio != null ? entry.faceitKdRatio.toFixed(2) : "—"}
          </div>

          <div className="hidden w-12 text-center lg:block">
            {entry.faceitWinStreak != null ? (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-[#FF5500]/10 px-1.5 py-0.5 text-xs font-black text-[#FF5500]">
                <Flame className="h-3 w-3" />
                {entry.faceitWinStreak}
              </span>
            ) : "—"}
          </div>

          <div className="hidden w-14 text-center text-sm font-semibold text-green-400 md:block">
            {entry.faceitWinRate != null ? `${entry.faceitWinRate}%` : "—"}
          </div>

          <div className="w-20 text-right">
            <div className="font-mono text-sm font-black" style={{ color: "#FF5500" }}>
              {entry.faceitElo.toLocaleString()}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">Lv.{entry.faceitLevel}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function FaceitEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#FF5500]/20 py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#FF5500]/20 bg-[#FF5500]/10">
        <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" aria-hidden="true">
          <path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="#FF5500" />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-black">Nenhum jogador conectado</h3>
      <p className="max-w-xs text-sm text-[var(--muted-foreground)]">
        Conecte sua conta FACEIT no perfil para aparecer nesse ranking.
      </p>
    </div>
  );
}

function FaceitRankingPanel({ players }: { players: FaceitRankingEntry[] }) {
  const syncedAt = players[0]?.faceitStatsSyncedAt;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" aria-hidden="true">
              <path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="#FF5500" />
            </svg>
            <span className="text-sm font-semibold" style={{ color: "#FF5500" }}>FACEIT</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Ranking FACEIT</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Jogadores da comunidade ordenados por ELO CS2
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 rounded-full border border-[#FF5500]/20 bg-[#FF5500]/10 px-3 py-1">
            <Activity className="h-3 w-3" style={{ color: "#FF5500" }} />
            <span className="text-xs font-bold" style={{ color: "#FF5500" }}>
              {players.length} jogadores
            </span>
          </div>
          {syncedAt && (
            <span className="text-xs text-[var(--muted-foreground)]">
              sync {new Date(syncedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </span>
          )}
        </div>
      </div>

      {players.length === 0 ? (
        <FaceitEmptyState />
      ) : (
        <>
          <FaceitPodium players={players} />
          <FaceitTable players={players} />
          {players.length > 0 && players.length < 4 && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-[#FF5500]/20 px-5 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#FF5500]/20 bg-[#FF5500]/10">
                <Zap className="h-4 w-4" style={{ color: "#FF5500" }} />
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                Conecte sua conta FACEIT no perfil e apareça no ranking da comunidade.
              </p>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
            Estatísticas atualizadas a cada 30 min · Conecte sua FACEIT no perfil para entrar no ranking
          </p>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RankingPage() {
  const faceitPlayers = await listFaceitRanking(50);

  return (
    <div className="min-h-screen pb-20 pt-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-10 text-center">
          <div className="mb-2 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--primary)]">
            <TrendingUp className="h-4 w-4" />
            Ranking Global
          </div>
          <h1 className="text-4xl font-black tracking-tight">Os Melhores da Comunidade</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Ranking BlueStrike interno + classificação FACEIT da comunidade.
          </p>
        </div>

        {/* Split layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-6 lg:divide-x lg:divide-[var(--border)]">
          {/* Left — BlueStrike */}
          <div className="lg:pr-6">
            <BluestrikeRanking />
          </div>

          {/* Right — FACEIT */}
          <div className="lg:pl-6">
            <FaceitRankingPanel players={faceitPlayers} />
          </div>
        </div>
      </div>
    </div>
  );
}
