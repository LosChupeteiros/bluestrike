import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  ExternalLink,
  Shield,
  Users,
} from "lucide-react";
import {
  getFaceitChampionshipById,
  getFaceitChampionshipMatches,
  getFaceitChampionshipSubscriptions,
} from "@/lib/faceit";
import { formatCurrency } from "@/lib/utils";
import { getCurrentProfile } from "@/lib/profiles";
import { getRegistration } from "@/lib/faceit-registrations";
import FaceitChampionshipTabs from "./faceit-championship-tabs";
import FaceitRegistrationFlow from "./faceit-registration-flow";

// ── helpers ──────────────────────────────────────────────────────────────────

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

// Cor FACEIT por nível (1–10) — sem SVG externo
function faceitLevelColor(level: number): string {
  if (level <= 3) return "#9e9e9e";
  if (level <= 5) return "#1ce400";
  if (level <= 7) return "#ffd700";
  if (level <= 9) return "#ff8000";
  return "#f10000"; // nível 10
}

function FaceitLevelBadge({ level }: { level: number }) {
  const color = faceitLevelColor(level);
  return (
    <div
      className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-black tabular-nums"
      style={{
        backgroundColor: color + "22",
        border: `2px solid ${color}`,
        color,
      }}
    >
      {level}
    </div>
  );
}

const FACEIT_ICON = (
  <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" aria-hidden="true">
    <path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="#FF5500" />
  </svg>
);

// ── component ────────────────────────────────────────────────────────────────

export default async function FaceitTournamentDetailView({ id }: { id: string }) {
  const [championship, matches, subscribedTeams, currentProfile] = await Promise.all([
    getFaceitChampionshipById(id),
    getFaceitChampionshipMatches(id),
    getFaceitChampionshipSubscriptions(id),
    getCurrentProfile(),
  ]);

  const blueStrikeProfileUrl =
    process.env.BLUESTRIKE_PRIVATE_PROFILE ?? "https://www.faceit.com/pt-br/players/BlueStrikeCS";

  const existingRegistration =
    currentProfile
      ? await getRegistration(id, currentProfile.id)
      : null;

  if (!championship) notFound();

  const spotsLeft = Math.max(0, championship.slots - championship.currentSubscriptions);
  const fillPct = championship.slots > 0
    ? (championship.currentSubscriptions / championship.slots) * 100
    : 0;
  const isFull = championship.full || spotsLeft === 0;

  return (
    <div className="min-h-screen pb-20 pt-20">

      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <div className="relative h-72 overflow-hidden border-b border-[#FF5500]/20 sm:h-80 lg:h-[26rem]">
        {championship.coverImage ? (
          <Image
            src={championship.coverImage}
            alt={championship.name}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#3a1000] via-slate-900 to-black" />
        )}
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-black/20 to-transparent" />

        <div className="absolute bottom-8 left-0 right-0 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <Link href="/" className="transition-colors hover:text-[var(--foreground)]">Início</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/tournaments/faceit" className="transition-colors hover:text-[var(--foreground)]">Campeonatos FACEIT</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[var(--foreground)]">{championship.name}</span>
          </nav>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF5500]/50 bg-[#FF5500]/40 px-2.5 py-1 text-xs font-black" style={{ color: "#FF5500" }}>
                  {FACEIT_ICON}
                  FACEIT
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(championship.status)}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {statusLabel(championship.status)}
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{championship.name}</h1>
              {championship.region && (
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">Região: {championship.region.toUpperCase()}</p>
              )}
            </div>

            {championship.totalPrizes > 0 && (
              <div className="rounded-2xl border border-yellow-500/25 bg-black/40 px-5 py-4 backdrop-blur">
                <div className="text-3xl font-black text-yellow-400">{formatCurrency(championship.totalPrizes)}</div>
                <div className="text-xs text-[var(--muted-foreground)]">premiação total</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* Left — tabs (overview, matches, teams) */}
          <div className="lg:col-span-2">
            <FaceitChampionshipTabs
              championship={championship}
              matches={matches}
              subscribedTeams={subscribedTeams}
              championshipId={id}
            />
          </div>

          {/* Right — sidebar sticky */}
          <div className="space-y-5">
            <div className="sticky top-24 space-y-5">

              {/* CTA card */}
              <div className="rounded-xl border border-[#FF5500]/25 bg-[var(--card)] p-5">

                {/* Vagas */}
                <div className="mb-4">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                    <Users className="h-4 w-4" style={{ color: "#FF5500" }} />
                    Vagas
                  </div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">
                      {championship.currentSubscriptions}/{championship.slots} times
                    </span>
                    <span className={isFull ? "font-bold text-red-400" : "font-bold"} style={isFull ? undefined : { color: "#FF5500" }}>
                      {isFull ? "LOTADO" : `${spotsLeft} vagas`}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${fillPct}%`, backgroundColor: isFull ? "#ef4444" : "#FF5500" }}
                    />
                  </div>
                </div>

                {/* Nível FACEIT + Anticheat — 2 cards */}
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {/* Nível exigido */}
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-[#FF5500]/20 bg-[#FF5500]/6 p-3 text-center">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                      Nível exigido
                    </div>
                    <div className="flex flex-1 items-center gap-1">
                      <FaceitLevelBadge level={championship.joinChecks.minSkillLevel} />
                      <span className="text-xs font-bold text-[var(--muted-foreground)]">–</span>
                      <FaceitLevelBadge level={championship.joinChecks.maxSkillLevel} />
                    </div>
                    <span className="text-[10px] font-medium text-[var(--muted-foreground)]">
                      Proibido Smurfing
                    </span>
                  </div>

                  {/* Anti-cheat */}
                  <a
                    href="https://www.faceit.com/pt-br/anti-cheat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`relative flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-opacity hover:opacity-80 ${
                      championship.anticheatRequired
                        ? "border-[#FF5500]/25 bg-[#FF5500]/8"
                        : "border-[var(--border)] bg-[var(--secondary)]"
                    }`}
                  >
                    <ExternalLink className="absolute right-1.5 top-1.5 h-3 w-3 text-[var(--muted-foreground)]" />
                    <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                      Anti-cheat
                    </div>
                    <Shield
                      className="h-6 w-6 flex-1"
                      style={{ color: championship.anticheatRequired ? "#FF5500" : "var(--muted-foreground)" }}
                    />
                    <span className={`text-xs font-semibold ${championship.anticheatRequired ? "" : "text-[var(--muted-foreground)]"}`}
                      style={championship.anticheatRequired ? { color: "#FF5500" } : undefined}>
                      {championship.anticheatRequired ? "Obrigatório" : "Não exigido"}
                    </span>
                  </a>
                </div>

                {/* Times inscritos inline counter */}
                {subscribedTeams.length > 0 && (
                  <div className="mb-5 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    {subscribedTeams.length} time{subscribedTeams.length !== 1 ? "s" : ""} inscrito{subscribedTeams.length !== 1 ? "s" : ""}
                    {matches.length > 0 && ` · ${matches.length} partida${matches.length !== 1 ? "s" : ""}`}
                  </div>
                )}

                {/* Fluxo de inscrição BlueStrike */}
                <FaceitRegistrationFlow
                  championship={championship}
                  currentProfile={currentProfile}
                  initialRegistration={existingRegistration}
                  blueStrikeProfileUrl={blueStrikeProfileUrl}
                />
              </div>

              {/* Quick info */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                <h4 className="mb-4 text-sm font-semibold">Informações rápidas</h4>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Formato", value: championship.type },
                    { label: "Grupos", value: String(championship.totalGroups) },
                    { label: "Rodadas", value: String(championship.totalRounds) },
                    { label: "Região", value: championship.region.toUpperCase() || "—" },
                    { label: "Política", value: championship.joinChecks.joinPolicy === "public" ? "Aberta" : "Fechada" },
                  ].map(({ label, value }, i) => (
                    <div key={label}>
                      {i > 0 && <div className="mb-3 h-px bg-[var(--border)]" />}
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--muted-foreground)]">{label}</span>
                        <span className="font-medium capitalize">{value || "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
