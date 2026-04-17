import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { FaceitChampionship } from "@/lib/faceit";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatUnix(ms: number): string {
  if (!ms) return "A definir";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(ms));
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
    case "join":         return "bg-green-500/15 border-green-500/30 text-green-300";
    case "checking_in": return "bg-[#FF5500]/15 border-[#FF5500]/30 text-[#FF7733]";
    case "ongoing":     return "bg-cyan-500/15 border-cyan-500/30 text-cyan-300";
    case "finished":    return "bg-white/8 border-white/15 text-[var(--muted-foreground)]";
    case "cancelled":   return "bg-red-500/15 border-red-500/30 text-red-300";
    default:            return "bg-yellow-500/15 border-yellow-500/30 text-yellow-300";
  }
}

const FACEIT_ICON = (
  <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" aria-hidden="true">
    <path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="#FF5500" />
  </svg>
);

// ── card ─────────────────────────────────────────────────────────────────────

interface FaceitTournamentCardProps {
  championship: FaceitChampionship;
  featured?: boolean;
}

export default function FaceitTournamentCard({ championship, featured = false }: FaceitTournamentCardProps) {
  const href = `/tournaments/faceit-${championship.id}`;
  const spotsLeft = Math.max(0, championship.slots - championship.currentSubscriptions);
  const fillPct = championship.slots > 0
    ? (championship.currentSubscriptions / championship.slots) * 100
    : 0;
  const isFull = championship.full || spotsLeft === 0;
  const canJoin = championship.status === "join" && !isFull;

  if (featured) {
    return (
      <Link href={href} className="group block h-full">
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#FF5500]/25 bg-[var(--card)] transition-all card-hover hover:border-[#FF5500]">

          {/* Banner */}
          <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#3a1000] via-slate-900 to-black">
            {championship.coverImage && (
              <Image
                src={championship.coverImage}
                alt={championship.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                className="object-cover"
                unoptimized
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-transparent to-transparent" />

            {/* FACEIT badge + status — side by side */}
            <div className="absolute bottom-4 left-5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF5500]/40 bg-[#FF5500]/20 px-2.5 py-1 text-xs font-black" style={{ color: "#FF5500" }}>
                {FACEIT_ICON}
                FACEIT
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(championship.status)}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {statusLabel(championship.status)}
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-5">
            <h3 className="mb-1 line-clamp-1 text-lg font-bold transition-colors group-hover:text-[#FF5500]">
              {championship.name}
            </h3>
            <p className="mb-4 line-clamp-2 text-xs text-[var(--muted-foreground)]">
              {championship.description || "Campeonato de CS2 organizado pela BlueStrike na FACEIT."}
            </p>

            {/* Prize — same layout as BlueStrike card */}
            {championship.totalPrizes > 0 ? (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3">
                <Trophy className="h-5 w-5 shrink-0 text-yellow-400" />
                <div>
                  <div className="text-xs text-[var(--muted-foreground)]">Premiação Total</div>
                  <div className="text-lg font-black text-yellow-400">{formatCurrency(championship.totalPrizes)}</div>
                </div>
              </div>
            ) : (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3 opacity-40">
                <Trophy className="h-5 w-5 shrink-0 text-[var(--muted-foreground)]" />
                <div className="text-xs text-[var(--muted-foreground)]">Premiação a definir</div>
              </div>
            )}

            {/* Meta + skill level tag */}
            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatUnix(championship.championshipStart)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {championship.currentSubscriptions}/{championship.slots} times
              </span>
              {/* Skill level tag with rank SVG */}
              <span
                className="ml-auto flex items-center gap-1 rounded-md border border-[#FF5500]/20 bg-[#FF5500]/8 px-1.5 py-0.5 font-bold"
                style={{ color: "#FF5500" }}
              >
                Lvl. {championship.joinChecks.minSkillLevel}–{championship.joinChecks.maxSkillLevel}
              </span>
            </div>

            {/* Fill bar */}
            <div className="mb-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">Vagas preenchidas</span>
                <span className={cn("font-semibold", isFull ? "text-red-400" : "")} style={isFull ? undefined : { color: "#FF5500" }}>
                  {isFull ? "LOTADO" : `${spotsLeft} vagas`}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${fillPct}%`, backgroundColor: isFull ? "#ef4444" : "#FF5500" }}
                />
              </div>
            </div>

            {/* Button — same structure as BlueStrike, orange */}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "mt-auto w-full gap-2",
                canJoin
                  ? "border-[#FF5500] bg-[#FF5500] text-white hover:bg-[#FF5500]/90 hover:border-[#FF5500]"
                  : "border-[#FF5500]/30 text-[#FF5500] hover:border-[#FF5500] hover:bg-[#FF5500]/10"
              )}
            >
              {canJoin ? "Ver inscrição" : "Ver campeonato"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Link>
    );
  }

  // ── list variant ─────────────────────────────────────────────────────────
  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-4 rounded-xl border border-[#FF5500]/15 bg-[var(--card)] p-4 transition-all card-hover hover:border-[#FF5500]/40">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#FF5500]/20 bg-gradient-to-br from-[#3a1000] to-slate-900">
          {championship.coverImage ? (
            <Image src={championship.coverImage} alt={championship.name} fill sizes="48px" className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              {FACEIT_ICON}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold transition-colors group-hover:text-[#FF5500]">
              {championship.name}
            </h3>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${statusClasses(championship.status)}`}>
              {statusLabel(championship.status)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatUnix(championship.championshipStart)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {championship.currentSubscriptions}/{championship.slots}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          {championship.totalPrizes > 0 ? (
            <>
              <div className="text-sm font-black text-yellow-400">{formatCurrency(championship.totalPrizes)}</div>
              <div className="text-xs text-[var(--muted-foreground)]">premiação</div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 text-xs font-black" style={{ color: "#FF5500" }}>
                <Image
                  src={`/assets/faceit_ranks/${championship.joinChecks.minSkillLevel}.svg`}
                  alt={`Nível ${championship.joinChecks.minSkillLevel}`}
                  width={12}
                  height={12}
                  unoptimized
                />
                Nv.{championship.joinChecks.minSkillLevel}–{championship.joinChecks.maxSkillLevel}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">skill level</div>
            </>
          )}
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-all group-hover:translate-x-0.5 group-hover:text-[#FF5500]" />
      </div>
    </Link>
  );
}
