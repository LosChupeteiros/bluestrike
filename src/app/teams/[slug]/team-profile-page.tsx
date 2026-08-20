import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Shield, Trophy, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getCurrentProfile, resolveProfilePath } from "@/lib/profiles";
import { getTeamBySlug } from "@/lib/teams";
import { getRecentMatchesForTeam } from "@/lib/matches";
import { DeleteTeamButton, EditDescriptionButton } from "./team-management-controls";
import { TeamProfileTabs } from "./team-profile-tabs";

export default async function TeamProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [team, currentProfile] = await Promise.all([getTeamBySlug(slug), getCurrentProfile()]);
  if (!team) notFound();

  const recentMatches = await getRecentMatchesForTeam(team.id, 10);
  const starters = team.members?.filter((member) => member.isStarter) ?? [];
  const substitutes = team.members?.filter((member) => !member.isStarter) ?? [];
  const captain = team.members?.find((member) => member.profileId === team.captainId);
  const isCaptain = currentProfile?.id === team.captainId;
  const isMember = Boolean(team.members?.some((member) => member.profileId === currentProfile?.id));
  const backHref = currentProfile ? resolveProfilePath(currentProfile) : "/teams";
  const totalMatches = team.wins + team.losses;
  const winRate = totalMatches ? Math.round((team.wins / totalMatches) * 100) : 0;

  return (
    <div className="bs-page pb-20">
      <div className="bs-page-shell">
        <nav className="flex items-center gap-2 pb-5 pt-8 text-sm text-[var(--muted-foreground)]" aria-label="Navegação estrutural">
          <Link href="/">Início</Link><ChevronRight className="h-3.5 w-3.5" /><Link href="/teams">Times</Link><ChevronRight className="h-3.5 w-3.5" /><span className="text-[var(--foreground)]">{team.name}</span>
        </nav>

        <section className="relative min-h-[330px] overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          <div className="absolute inset-y-0 right-0 w-[36%] bg-[var(--accent)]" />
          <div className="bs-brand-arc -right-[6%] top-1/2 -translate-y-1/2 scale-[0.82] opacity-75" />
          <div className="relative z-10 grid min-h-[330px] gap-8 p-7 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <Avatar className="h-36 w-36 shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--brand-navy)]">
                <AvatarImage src={team.logoUrl ?? undefined} alt={`Logo ${team.name}`} className="object-cover" />
                <AvatarFallback className="rounded-2xl bg-[var(--brand-navy)] text-3xl font-black text-[var(--brand-cyan)]">{team.tag}</AvatarFallback>
              </Avatar>
              <div className="max-w-[640px]">
                {team.isRecruiting && <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-emerald-700">Recrutando</span>}
                <h1 className="mt-3 text-5xl font-bold tracking-[-0.04em] md:text-6xl">{team.name}</h1>
                <div className="mt-4 flex items-start gap-2">
                  <p className="max-w-[62ch] text-sm leading-6 text-[var(--muted-foreground)]">{team.description || "Equipe competitiva BlueStrike em evolução constante dentro do circuito."}</p>
                  {isCaptain && <EditDescriptionButton teamSlug={team.slug} currentDescription={team.description} />}
                </div>
                {captain?.profile && <Link href={`/profile/${captain.profile.publicId}`} className="mt-5 inline-flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarImage src={captain.profile.steamAvatarUrl ?? undefined} alt={captain.profile.steamPersonaName} /><AvatarFallback>{captain.profile.steamPersonaName.slice(0, 1)}</AvatarFallback></Avatar><div><div className="text-[10px] text-[var(--muted-foreground)]">Capitão</div><div className="text-sm font-semibold">{captain.profile.steamPersonaName}</div></div></Link>}
              </div>
            </div>

            <div className="relative z-10 grid min-w-0 grid-cols-2 gap-y-6 rounded-2xl border border-[var(--border)] bg-white/95 p-5 shadow-[var(--shadow-sm)] lg:min-w-[440px] lg:grid-cols-4 lg:divide-x lg:divide-[var(--border)]">
              <div className="px-4"><div className="text-[9px] font-bold uppercase text-[var(--muted-foreground)]">BlueStrike ELO</div><div className="mt-2 font-mono text-2xl font-bold text-[var(--primary)]">{team.elo.toLocaleString("pt-BR")}</div></div>
              <div className="px-4"><div className="text-[9px] font-bold uppercase text-[var(--muted-foreground)]">Recorde</div><div className="mt-2 font-mono text-xl font-bold">{team.wins}V {team.losses}D</div></div>
              <div className="px-4"><div className="text-[9px] font-bold uppercase text-[var(--muted-foreground)]">Partidas</div><div className="mt-2 font-mono text-2xl font-bold text-[var(--primary)]">{totalMatches}</div></div>
              <div className="px-4"><div className="text-[9px] font-bold uppercase text-[var(--muted-foreground)]">Win rate</div><div className="mt-2 font-mono text-2xl font-bold text-[var(--primary)]">{winRate}%</div></div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 pt-5 lg:grid-cols-[minmax(0,2.2fr)_minmax(280px,0.8fr)]">
          <div>
            <TeamProfileTabs starters={starters} substitutes={substitutes} isCaptain={isCaptain} captainId={team.captainId} teamSlug={team.slug} recentMatches={recentMatches} />
          </div>
          <aside className="space-y-5">
            <section className="bs-panel p-6">
              <h2 className="text-lg font-semibold tracking-[-0.025em]">Sobre a {team.name}</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-[var(--muted-foreground)]">Fundação</dt><dd className="font-medium">{new Date(team.createdAt).getFullYear()}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-[var(--muted-foreground)]">País</dt><dd className="font-medium">Brasil</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-[var(--muted-foreground)]">Capitão</dt><dd className="font-medium">{captain?.profile?.steamPersonaName ?? "Não definido"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-[var(--muted-foreground)]">Membros</dt><dd className="font-medium">{team.members?.length ?? 0}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-[var(--muted-foreground)]">Status</dt><dd className="font-medium">{team.isRecruiting ? "Recrutando" : "Line fechada"}</dd></div>
              </dl>
              <div className="mt-6 space-y-2">
                {team.isRecruiting && !isMember && <Button asChild className="w-full"><Link href={`/teams/join/${team.joinCode}`}><UserPlus className="h-4 w-4" /> Solicitar vaga</Link></Button>}
                {isCaptain && <Button asChild variant="outline" className="w-full"><Link href={`/teams/join/${team.joinCode}`}><Users className="h-4 w-4" /> Convidar jogador</Link></Button>}
                <Button asChild variant="outline" className="w-full"><Link href="/tournaments"><Trophy className="h-4 w-4" /> Ver campeonatos</Link></Button>
              </div>
            </section>

            <section className="bs-panel p-6"><div className="flex items-center gap-2 text-[var(--primary)]"><Shield className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.08em]">Identidade do time</span></div><div className="mt-4 flex justify-between text-sm"><span className="text-[var(--muted-foreground)]">Tag</span><span className="font-mono font-bold">{team.tag}</span></div><div className="mt-3 flex justify-between text-sm"><span className="text-[var(--muted-foreground)]">Código</span><span className="font-mono">{isCaptain ? team.joinCode : "Protegido"}</span></div></section>

            {isCaptain && <section className="rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="text-sm font-semibold text-red-800">Gestão do capitão</h2><p className="mt-2 text-xs leading-5 text-red-700">Arquive o time apenas quando não houver campeonatos ativos.</p><div className="mt-4"><DeleteTeamButton teamSlug={team.slug} redirectPath={`${backHref}?tab=teams&teamDeleted=1`} /></div></section>}
          </aside>
        </div>
      </div>
    </div>
  );
}
