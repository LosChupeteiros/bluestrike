import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Users, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaceitSkillIcon } from "@/components/ui/faceit-skill-icon";
import { getProfilePath, IN_GAME_ROLES, type UserProfile } from "@/lib/profile";
import { listPublicProfiles } from "@/lib/profiles";
import { getPlayerRank } from "@/lib/ranks";
import ViewToggle from "./view-toggle";

const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  IN_GAME_ROLES.map((r) => [r.value, r.label])
);

function getRankAccent(minElo: number) {
  if (minElo >= 3700) return { color: "#ef4444", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.25)", text: "text-red-400" };
  if (minElo >= 2600) return { color: "#a855f7", bg: "rgba(168,85,247,0.10)", border: "rgba(168,85,247,0.25)", text: "text-purple-400" };
  if (minElo >= 1400) return { color: "#38bdf8", bg: "rgba(56,189,248,0.10)", border: "rgba(56,189,248,0.25)", text: "text-sky-400" };
  if (minElo >= 600)  return { color: "#facc15", bg: "rgba(250,204,21,0.10)",  border: "rgba(250,204,21,0.25)",  text: "text-yellow-400" };
  return                     { color: "#9ca3af", bg: "rgba(156,163,175,0.08)", border: "rgba(156,163,175,0.20)", text: "text-gray-400" };
}

interface PlayersPageProps {
  query: string;
  page: number;
  view: "cards" | "list";
}

function buildHref(query: string, page: number, view: "cards" | "list") {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  if (view === "list") params.set("view", "list");
  const suffix = params.toString();
  return suffix ? `/players?${suffix}` : "/players";
}

function PlayerAvatar({ profile, size }: { profile: UserProfile; size: "sm" | "md" }) {
  const src = profile.faceitAvatar ?? profile.steamAvatarUrl ?? undefined;
  const name = profile.steamPersonaName;
  const dim = size === "md" ? "h-12 w-12" : "h-9 w-9";
  const text = size === "md" ? "text-sm" : "text-xs";

  return (
    <div className={`${dim} overflow-hidden rounded-full`}>
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className={`flex h-full w-full items-center justify-center bg-[var(--secondary)] ${text} font-black text-[var(--primary)]`}>
          {name.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function PlayerCard({ profile }: { profile: UserProfile }) {
  const rank = getPlayerRank(profile.elo);
  const role = profile.inGameRole ? ROLE_LABELS[profile.inGameRole] : null;
  const href = getProfilePath(profile.publicId);
  const hasFaceit = Boolean(profile.faceitId && profile.faceitElo && profile.faceitLevel);

  return (
    <Link href={href} className="group block h-full">
      <div className="flex h-full flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:border-[var(--primary)]/35 hover:bg-[var(--secondary)]/60 hover:shadow-lg hover:shadow-black/20">

        {/* Avatar + name */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div className="ring-2 ring-[var(--border)] ring-offset-1 ring-offset-[var(--card)] rounded-full">
              <PlayerAvatar profile={profile} size="md" />
            </div>
            {hasFaceit && profile.faceitLevel != null && (
              <div className="absolute -bottom-1.5 -right-1.5 rounded-full ring-2 ring-[var(--card)]">
                <FaceitSkillIcon level={profile.faceitLevel} size={20} />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="truncate text-sm font-black leading-tight transition-colors group-hover:text-[var(--primary)]">
                {profile.steamPersonaName}
              </span>
              {role && (
                <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
                  {role}
                </Badge>
              )}
            </div>
            {hasFaceit && profile.faceitNickname && (
              <div className="truncate text-[11px] font-semibold text-orange-400 mt-0.5">
                @{profile.faceitNickname}
              </div>
            )}
          </div>
        </div>

        {/* FACEIT stats strip */}
        {hasFaceit && (
          <div className="flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/8 px-3 py-2">
            <FaceitSkillIcon level={profile.faceitLevel!} size={20} />
            <div className="flex items-baseline gap-1">
              <span className="text-[13px] font-black text-orange-400">{profile.faceitElo}</span>
              <span className="text-[9px] uppercase tracking-wider text-[var(--muted-foreground)]">ELO</span>
            </div>
            {profile.faceitKdRatio != null && (
              <div className="ml-auto flex items-baseline gap-1">
                <span className="text-[12px] font-bold text-[var(--foreground)]">
                  {profile.faceitKdRatio.toFixed(2)}
                </span>
                <span className="text-[9px] text-[var(--muted-foreground)]">K/D</span>
              </div>
            )}
            {profile.faceitWinRate != null && (
              <div className="flex items-baseline gap-1">
                <span className="text-[12px] font-bold text-[var(--foreground)]">
                  {profile.faceitWinRate}%
                </span>
                <span className="text-[9px] text-[var(--muted-foreground)]">WR</span>
              </div>
            )}
          </div>
        )}

        {/* BlueStrike rank */}
        {(() => {
          const accent = getRankAccent(rank.minElo);
          return (
            <div
              className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{ background: `linear-gradient(135deg, ${accent.bg} 0%, transparent 70%)`, border: `1px solid ${accent.border}` }}
            >
              <Image
                src={rank.imagePath}
                alt={rank.name}
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]"
                unoptimized
              />
              <div className="min-w-0 flex-1">
                <div className={`truncate text-xs font-bold ${accent.text}`}>{rank.name}</div>
                <div className="mt-0.5 flex items-center gap-1">
                  <Zap className={`h-3 w-3 shrink-0 fill-current ${accent.text}`} />
                  <span className="text-[11px] font-mono font-black text-[var(--foreground)]">{profile.elo}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </Link>
  );
}

function PlayerListRow({ profile, position }: { profile: UserProfile; position: number }) {
  const rank = getPlayerRank(profile.elo);
  const role = profile.inGameRole ? ROLE_LABELS[profile.inGameRole] : null;
  const href = getProfilePath(profile.publicId);
  const hasFaceit = Boolean(profile.faceitId && profile.faceitElo && profile.faceitLevel);

  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition-colors hover:border-[var(--primary)]/30 hover:bg-[var(--secondary)]/60">
        {/* Position */}
        <span className="w-7 shrink-0 text-center text-xs font-mono font-bold text-[var(--muted-foreground)]">
          #{position}
        </span>

        {/* Avatar with optional level badge */}
        <div className="relative shrink-0">
          <PlayerAvatar profile={profile} size="sm" />
          {hasFaceit && profile.faceitLevel != null && (
            <div className="absolute -bottom-1 -right-1 rounded-full ring-1 ring-[var(--card)]">
              <FaceitSkillIcon level={profile.faceitLevel} size={14} />
            </div>
          )}
        </div>

        {/* Name */}
        <div className="min-w-0 flex-1">
          <span className="truncate text-sm font-bold transition-colors group-hover:text-[var(--primary)]">
            {profile.steamPersonaName}
          </span>
          {hasFaceit && profile.faceitNickname && (
            <span className="ml-1.5 text-[11px] font-medium text-orange-400">
              @{profile.faceitNickname}
            </span>
          )}
        </div>

        {/* Role */}
        {role && (
          <Badge variant="secondary" className="shrink-0 hidden sm:inline-flex">
            {role}
          </Badge>
        )}

        {/* FACEIT ELO + level */}
        {hasFaceit && (
          <div className="hidden sm:flex shrink-0 items-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/8 px-2 py-1">
            <FaceitSkillIcon level={profile.faceitLevel!} size={16} />
            <span className="text-xs font-black text-orange-400">{profile.faceitElo}</span>
          </div>
        )}

        {/* BlueStrike rank + ELO */}
        {(() => {
          const accent = getRankAccent(rank.minElo);
          return (
            <div
              className="flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5"
              style={{ background: `linear-gradient(135deg, ${accent.bg} 0%, transparent 80%)`, border: `1px solid ${accent.border}` }}
            >
              <Image
                src={rank.imagePath}
                alt={rank.name}
                width={28}
                height={28}
                className="h-7 w-7 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
                unoptimized
              />
              <div className="hidden sm:block">
                <div className={`text-[10px] font-bold leading-tight ${accent.text}`}>{rank.name}</div>
                <div className="flex items-center gap-0.5">
                  <Zap className={`h-2.5 w-2.5 fill-current ${accent.text}`} />
                  <span className="text-[10px] font-mono font-black text-[var(--foreground)]">{profile.elo}</span>
                </div>
              </div>
              <div className={`sm:hidden text-xs font-mono font-black ${accent.text}`}>{profile.elo}</div>
            </div>
          );
        })()}
      </div>
    </Link>
  );
}

export default async function PlayersPage({ query, page, view }: PlayersPageProps) {
  const result = await listPublicProfiles({ query, page });

  return (
    <div className="min-h-screen pb-20 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
            <Users className="h-4 w-4" />
            Players
          </div>
          <h1 className="text-4xl font-black tracking-tight">Hub de Jogadores</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            {result.total > 0
              ? `${result.total} jogador${result.total !== 1 ? "es" : ""} registrado${result.total !== 1 ? "s" : ""} no BlueStrike.`
              : "Nenhum jogador encontrado com esse criterio."}
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center">
          <form action="/players" className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              name="q"
              defaultValue={result.query}
              className="pl-9"
              placeholder="Buscar por nick BlueStrike ou FACEIT..."
              autoComplete="off"
            />
            {view === "list" && <input type="hidden" name="view" value="list" />}
          </form>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
              {result.total} resultado{result.total !== 1 ? "s" : ""}
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
              {result.page}/{result.totalPages}
            </div>
            <Suspense>
              <ViewToggle current={view} />
            </Suspense>
          </div>
        </div>

        {/* Empty state */}
        {result.profiles.length === 0 && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-20 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)] opacity-30" />
            <h3 className="mb-2 text-lg font-semibold">Nenhum jogador encontrado</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Tente outro nickname ou limpe a busca.
            </p>
          </div>
        )}

        {/* Cards view */}
        {result.profiles.length > 0 && view === "cards" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.profiles.map((profile) => (
              <PlayerCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}

        {/* List view */}
        {result.profiles.length > 0 && view === "list" && (
          <div className="space-y-2">
            {result.profiles.map((profile, index) => (
              <PlayerListRow
                key={profile.id}
                profile={profile}
                position={(result.page - 1) * result.pageSize + index + 1}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {result.totalPages > 1 && (
          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">
              Página {result.page} de {result.totalPages} &middot; {result.total} jogadores
            </span>

            <div className="flex gap-2">
              {result.page <= 1 ? (
                <Button variant="outline" size="sm" disabled>Anterior</Button>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href={buildHref(result.query, result.page - 1, view)}>Anterior</Link>
                </Button>
              )}

              {result.page >= result.totalPages ? (
                <Button variant="outline" size="sm" disabled>Proxima</Button>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href={buildHref(result.query, result.page + 1, view)}>Proxima</Link>
                </Button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
