import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { FaceitSkillIcon } from "@/components/ui/faceit-skill-icon";
import {
  ELO_BANDS,
  getProfilePath,
  IN_GAME_ROLES,
  type InGameRole,
  type UserProfile,
} from "@/lib/profile";
import { listPublicProfiles } from "@/lib/profiles";
import { getPlayerRank } from "@/lib/ranks";
import FaceitLevelRange from "./faceit-level-range";
import ViewToggle from "./view-toggle";

const ROLE_LABELS = Object.fromEntries(IN_GAME_ROLES.map((role) => [role.value, role.label]));

interface PlayersPageProps {
  query: string;
  page: number;
  view: "cards" | "list";
  role: InGameRole | null;
  eloBand: string;
  minElo?: number;
  maxElo?: number;
  faceitMin: number;
  faceitMax: number;
}

interface PlayerFilters {
  query: string;
  role: InGameRole | null;
  eloBand: string;
  faceitMin: number;
  faceitMax: number;
}

function buildHref(filters: PlayerFilters, page: number, view: "cards" | "list") {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.role) params.set("role", filters.role);
  if (filters.eloBand) params.set("elo", filters.eloBand);
  if (filters.faceitMin > 1) params.set("faceitMin", String(filters.faceitMin));
  if (filters.faceitMax < 10) params.set("faceitMax", String(filters.faceitMax));
  if (page > 1) params.set("page", String(page));
  if (view === "list") params.set("view", "list");
  const suffix = params.toString();
  return suffix ? `/players?${suffix}` : "/players";
}

function PlayerAvatar({ profile, size = 72 }: { profile: UserProfile; size?: number }) {
  const source = profile.faceitAvatar ?? profile.steamAvatarUrl;

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border border-white/10 bg-[var(--secondary)]"
      style={{ height: size, width: size }}
    >
      {source ? (
        <Image
          alt={profile.steamPersonaName}
          className="object-cover"
          fill
          sizes={`${size}px`}
          src={source}
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-lg font-black text-[var(--primary)]">
          {profile.steamPersonaName.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function PlayerCard({ profile, position }: { profile: UserProfile; position: number }) {
  const href = getProfilePath(profile.publicId);
  const role = profile.inGameRole ? ROLE_LABELS[profile.inGameRole] : "Flex";
  const rank = getPlayerRank(profile.elo);
  const hasFaceit = profile.faceitElo != null && profile.faceitLevel != null;

  return (
    <Link
      className={`group relative flex min-h-[330px] flex-col overflow-hidden rounded-2xl border bg-[var(--card)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/50 ${
        position === 1 ? "border-[var(--primary)]/60 shadow-[0_22px_70px_rgba(0,200,255,0.08)]" : "border-[var(--border)]"
      }`}
      href={href}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-black text-[var(--muted-foreground)]">#{position}</span>
        <span className="rounded-full border border-[var(--primary)]/25 bg-[var(--primary)]/8 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">
          {role}
        </span>
      </div>

      <div className="mt-5 flex flex-col items-center text-center">
        <div className="relative">
          <PlayerAvatar profile={profile} size={82} />
          {hasFaceit && (
            <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-[var(--card)] bg-black">
              <FaceitSkillIcon level={profile.faceitLevel!} size={24} />
            </span>
          )}
        </div>
        <h2 className="mt-4 max-w-full truncate text-lg font-black tracking-tight transition-colors group-hover:text-[var(--primary)]">
          {profile.steamPersonaName}
        </h2>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
          {rank.name}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 border-y border-[var(--border)] py-3">
        <div className="border-r border-[var(--border)] pr-3">
          <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">BlueStrike ELO</span>
          <strong className="mt-1 block font-mono text-xl text-[var(--primary)]">{profile.elo.toLocaleString("pt-BR")}</strong>
        </div>
        <div className="pl-3">
          <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">FACEIT level</span>
          <strong className="mt-1 flex items-center gap-1.5 font-mono text-xl text-[#ff7a00]">
            {hasFaceit ? (
              <>
                <FaceitSkillIcon level={profile.faceitLevel!} size={20} /> {profile.faceitLevel}
              </>
            ) : (
              "—"
            )}
          </strong>
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between pt-4 text-xs">
        <div>
          <span className="block text-[9px] uppercase tracking-wider text-[var(--muted-foreground)]">K/D</span>
          <strong>{profile.faceitKdRatio?.toFixed(2) ?? "—"}</strong>
        </div>
        <div className="text-right">
          <span className="block text-[9px] uppercase tracking-wider text-[var(--muted-foreground)]">Win rate</span>
          <strong>{profile.faceitWinRate != null ? `${profile.faceitWinRate}%` : "—"}</strong>
        </div>
      </div>
    </Link>
  );
}

function PlayerTable({ profiles, firstPosition }: { profiles: UserProfile[]; firstPosition: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="hidden grid-cols-[64px_2fr_1fr_1fr_1fr_88px] gap-4 border-b border-[var(--border)] px-5 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-[var(--muted-foreground)] md:grid">
        <span>Pos.</span><span>Jogador</span><span>Função</span><span>BlueStrike ELO</span><span>FACEIT</span><span className="text-right">Perfil</span>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {profiles.map((profile, index) => {
          const position = firstPosition + index;
          return (
            <Link
              className="group grid grid-cols-[44px_1fr_auto] items-center gap-3 px-4 py-4 transition-colors hover:bg-white/[0.025] md:grid-cols-[64px_2fr_1fr_1fr_1fr_88px] md:gap-4 md:px-5"
              href={getProfilePath(profile.publicId)}
              key={profile.id}
            >
              <span className="font-mono text-xs font-black text-[var(--muted-foreground)]">#{position}</span>
              <span className="flex min-w-0 items-center gap-3">
                <PlayerAvatar profile={profile} size={38} />
                <span className="min-w-0">
                  <strong className="block truncate text-sm group-hover:text-[var(--primary)]">{profile.steamPersonaName}</strong>
                  <span className="text-[10px] text-[var(--muted-foreground)]">Brasil · perfil #{profile.publicId}</span>
                </span>
              </span>
              <span className="hidden text-xs font-bold uppercase text-[var(--muted-foreground)] md:block">
                {profile.inGameRole ? ROLE_LABELS[profile.inGameRole] : "Flex"}
              </span>
              <span className="hidden font-mono text-sm font-black text-[var(--primary)] md:block">{profile.elo.toLocaleString("pt-BR")}</span>
              <span className="hidden items-center gap-2 font-mono text-sm font-black text-[#ff7a00] md:flex">
                {profile.faceitLevel ? <FaceitSkillIcon level={profile.faceitLevel} size={18} /> : null}
                {profile.faceitElo?.toLocaleString("pt-BR") ?? "—"}
              </span>
              <span className="flex justify-end text-[var(--muted-foreground)]">
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:text-[var(--primary)]" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default async function PlayersPage({
  query,
  page,
  view,
  role,
  eloBand,
  minElo,
  maxElo,
  faceitMin,
  faceitMax,
}: PlayersPageProps) {
  const result = await listPublicProfiles({
    query,
    page,
    role,
    minElo,
    maxElo,
    minFaceitLevel: faceitMin,
    maxFaceitLevel: faceitMax,
  });
  const filters: PlayerFilters = { query: result.query, role, eloBand, faceitMin, faceitMax };
  const filterCount = [query, role, eloBand, faceitMin > 1 || faceitMax < 10].filter(Boolean).length;
  const highestElo = result.profiles.at(0)?.elo ?? 0;

  return (
    <div className="bs-page pb-24 pt-28">
      <div className="bs-shell">
        <section className="relative overflow-hidden border-b border-[var(--border)] pb-12">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="bs-eyebrow"><Users className="h-4 w-4" /> Players</p>
              <h1 className="bs-display mt-4 max-w-[720px]">Hub de <span className="text-[var(--primary)]">jogadores</span></h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted-foreground)] sm:text-lg">
                Encontre talentos do cenário competitivo, compare ELO e função e monte a próxima lineup que vai subir no ranking.
              </p>

              <div className="bs-bento-card mt-10 grid max-w-3xl overflow-hidden sm:grid-cols-3">
                {[
                  { label: "Jogadores encontrados", value: result.total.toLocaleString("pt-BR") },
                  { label: "Funções competitivas", value: IN_GAME_ROLES.length.toString() },
                  { label: "Maior ELO no recorte", value: highestElo ? highestElo.toLocaleString("pt-BR") : "—" },
                ].map((metric) => (
                  <div className="relative border-b border-[var(--border)] p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0" key={metric.label}>
                    <strong className="font-mono text-[clamp(2rem,3vw,3rem)] font-black leading-none tracking-[-.06em] text-[var(--foreground)]">{metric.value}</strong>
                    <span className="mt-2 block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--primary)]">{metric.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bs-dark-card relative min-h-[310px] overflow-hidden lg:col-span-5">
              <Image alt="Arena competitiva BlueStrike" className="object-cover opacity-45" fill priority sizes="(max-width: 1024px) 100vw, 42vw" src="/assets/banner_bluestrike_home.png" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,10,17,.96),rgba(6,10,17,.4))]" />
              <div className="relative flex min-h-[310px] max-w-sm flex-col justify-end p-7">
                <span className="mb-auto flex h-11 w-11 items-center justify-center rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Sparkles className="h-5 w-5" />
                </span>
                <h2 className="text-2xl font-black tracking-tight">Seja encontrado pelo cenário.</h2>
                <p className="mt-3 text-sm leading-6 text-white/60">Complete seu perfil, exponha sua função e deixe o seu ELO contar a história.</p>
                <Link className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[var(--primary)]" href="/profile">
                  Criar ou atualizar perfil <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8" data-reveal>
          <form action="/players" className="bs-inset grid gap-3 p-3 xl:grid-cols-[minmax(250px,1.5fr)_0.7fr_0.75fr_1.1fr_auto]">
            <label className="relative min-w-0">
              <span className="sr-only">Buscar jogador</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input autoComplete="off" className="bs-bento-card h-full min-h-14 w-full rounded-2xl pl-10 pr-4 text-sm outline-none transition focus:border-[var(--primary)]/55" defaultValue={result.query} name="q" placeholder="Buscar nickname ou nome FACEIT..." />
            </label>

            <label className="bs-bento-card rounded-2xl px-4 py-2">
              <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Função</span>
              <select className="mt-1 w-full bg-transparent text-sm font-bold outline-none [&>option]:bg-[#0b111b]" defaultValue={role ?? ""} name="role">
                <option value="">Todas</option>
                {IN_GAME_ROLES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>

            <label className="bs-bento-card rounded-2xl px-4 py-2">
              <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Faixa de ELO</span>
              <select className="mt-1 w-full bg-transparent text-sm font-bold outline-none [&>option]:bg-[#0b111b]" defaultValue={eloBand} name="elo">
                <option value="">Qualquer</option>
                {ELO_BANDS.map((band) => <option key={band.key} value={band.key}>{band.label}</option>)}
              </select>
            </label>

            <FaceitLevelRange initialMax={faceitMax} initialMin={faceitMin} />
            {view === "list" && <input name="view" type="hidden" value="list" />}
            <button className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white shadow-[0_10px_26px_color-mix(in_srgb,var(--primary)_22%,transparent)] transition hover:brightness-110" type="submit">
              <SlidersHorizontal className="h-4 w-4" /> Aplicar
            </button>
          </form>
        </section>

        <section>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="bs-eyebrow"><Zap className="h-4 w-4" /> Ranking vivo</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Talentos no radar</h2>
            </div>
            <div className="flex items-center gap-3">
              {filterCount > 0 && <Link className="text-xs font-bold text-[var(--muted-foreground)] hover:text-white" href="/players">Limpar {filterCount} filtro{filterCount === 1 ? "" : "s"}</Link>}
              <span className="rounded-full border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)]">{result.total} resultado{result.total === 1 ? "" : "s"}</span>
              <Suspense><ViewToggle current={view} /></Suspense>
            </div>
          </div>

          {result.profiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] px-6 py-20 text-center">
              <Users className="mx-auto h-10 w-10 text-[var(--primary)]/50" />
              <h3 className="mt-4 text-xl font-black">Nenhum jogador nesse recorte</h3>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">Amplie a faixa de FACEIT ou remova um dos filtros.</p>
            </div>
          ) : view === "cards" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {result.profiles.map((profile, index) => (
                <PlayerCard key={profile.id} position={(result.page - 1) * result.pageSize + index + 1} profile={profile} />
              ))}
            </div>
          ) : (
            <PlayerTable firstPosition={(result.page - 1) * result.pageSize + 1} profiles={result.profiles} />
          )}

          {result.totalPages > 1 && (
            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-[var(--muted-foreground)]">Página {result.page} de {result.totalPages} · {result.total} jogadores</span>
              <div className="flex gap-2">
                {result.page > 1 ? (
                  <Link className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-black hover:border-[var(--primary)]/40" href={buildHref(filters, result.page - 1, view)}>Anterior</Link>
                ) : <span className="cursor-not-allowed rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-black opacity-35">Anterior</span>}
                {result.page < result.totalPages ? (
                  <Link className="rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-black text-[#031018]" href={buildHref(filters, result.page + 1, view)}>Próxima</Link>
                ) : <span className="cursor-not-allowed rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-black text-[#031018] opacity-35">Próxima</span>}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
