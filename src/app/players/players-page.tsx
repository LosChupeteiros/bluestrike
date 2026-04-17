import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProfilePath, IN_GAME_ROLES } from "@/lib/profile";
import { listPublicProfiles } from "@/lib/profiles";
import { getPlayerRank } from "@/lib/ranks";
import ViewToggle from "./view-toggle";

const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  IN_GAME_ROLES.map((r) => [r.value, r.label])
);

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
              placeholder="Buscar por nickname..."
              autoComplete="off"
            />
            {/* preserve view param */}
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
            {result.profiles.map((profile) => {
              const rank = getPlayerRank(profile.elo);
              const role = profile.inGameRole ? ROLE_LABELS[profile.inGameRole] : null;
              const href = getProfilePath(profile.publicId);
              const displayName = profile.steamPersonaName;

              return (
                <Link key={profile.id} href={href} className="group block h-full">
                  <div className="flex h-full flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[var(--primary)]/35 hover:bg-[var(--secondary)]/60">
                    {/* Top row: avatar + name + role */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 shrink-0 ring-2 ring-[var(--border)] ring-offset-1 ring-offset-[var(--card)]">
                        <AvatarImage src={profile.steamAvatarUrl ?? undefined} alt={displayName} />
                        <AvatarFallback className="text-sm font-black text-[var(--primary)]">
                          {displayName.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-black transition-colors group-hover:text-[var(--primary)]">
                          {displayName}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          {role && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {role}
                            </Badge>
                          )}
                          <span className="text-[11px] font-mono font-semibold text-[var(--primary)]/80 uppercase tracking-[0.15em]">
                            {profile.elo} ELO
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rank row */}
                    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5">
                      <Image
                        src={rank.imagePath}
                        alt={rank.name}
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                        unoptimized
                      />
                      <div>
                        <div className="text-xs font-bold text-[var(--foreground)]">{rank.name}</div>
                        <div className="text-[10px] text-[var(--muted-foreground)]">{rank.tooltip.split("·")[1]?.trim()}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* List view */}
        {result.profiles.length > 0 && view === "list" && (
          <div className="space-y-2">
            {result.profiles.map((profile, index) => {
              const rank = getPlayerRank(profile.elo);
              const role = profile.inGameRole ? ROLE_LABELS[profile.inGameRole] : null;
              const href = getProfilePath(profile.publicId);
              const displayName = profile.steamPersonaName;
              const globalPosition = (result.page - 1) * result.pageSize + index + 1;

              return (
                <Link key={profile.id} href={href} className="group block">
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition-colors hover:border-[var(--primary)]/30 hover:bg-[var(--secondary)]/60">
                    {/* Position */}
                    <span className="w-7 shrink-0 text-center text-xs font-mono font-bold text-[var(--muted-foreground)]">
                      #{globalPosition}
                    </span>

                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={profile.steamAvatarUrl ?? undefined} alt={displayName} />
                      <AvatarFallback className="text-xs font-black text-[var(--primary)]">
                        {displayName.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name */}
                    <div className="min-w-0 flex-1">
                      <span className="truncate text-sm font-bold transition-colors group-hover:text-[var(--primary)]">
                        {displayName}
                      </span>
                    </div>

                    {/* Role */}
                    {role && (
                      <Badge variant="secondary" className="shrink-0 hidden sm:inline-flex">
                        {role}
                      </Badge>
                    )}

                    {/* Rank */}
                    <div className="flex shrink-0 items-center gap-2">
                      <Image
                        src={rank.imagePath}
                        alt={rank.name}
                        width={28}
                        height={28}
                        className="h-7 w-7 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                        unoptimized
                      />
                      <span className="hidden text-xs font-semibold text-[var(--muted-foreground)] sm:inline">
                        {rank.name}
                      </span>
                    </div>

                    {/* ELO */}
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-mono font-black text-[var(--primary)]">
                        {profile.elo}
                      </span>
                      <span className="ml-1 text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                        ELO
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
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
