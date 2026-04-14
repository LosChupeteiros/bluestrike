import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Users, Trophy, Shield, ChevronLeft, Copy, UserPlus, Settings,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockTeams } from "@/data/mock";

const ROLE_LABELS: Record<string, string> = {
  igl: "IGL",
  awper: "AWPer",
  "entry-fragger": "Entry Fragger",
  rifler: "Rifler",
  lurker: "Lurker",
  support: "Support",
  coach: "Coach",
};

interface Params {
  slug: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const team = mockTeams.find((t) => t.slug === slug);
  if (!team) return { title: "Time não encontrado" };
  return { title: `${team.name} [${team.tag}]` };
}

export default async function TeamProfilePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const team = mockTeams.find((t) => t.slug === slug);

  if (!team) notFound();

  const starters = team.members.filter((m) => m.isStarter);
  const subs = team.members.filter((m) => !m.isStarter);

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/teams"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Todos os times
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8 pb-8 border-b border-[var(--border)]">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-950 to-slate-900 border border-[var(--border)] flex items-center justify-center font-black text-[var(--primary)] text-2xl shrink-0">
              {team.tag}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">{team.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge variant="ongoing" className="font-mono">[{team.tag}]</Badge>
                {team.isRecruiting && <Badge variant="open">Recrutando</Badge>}
                {!team.isActive && <Badge variant="finished">Inativo</Badge>}
                <span className="text-xs text-[var(--muted-foreground)]">{team.elo} ELO</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {team.isRecruiting && (
              <Button asChild variant="gradient" className="gap-2">
                <Link href={`/teams/join/${team.joinCode}`}>
                  <UserPlus className="w-4 h-4" /> Entrar no time
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members */}
          <div className="lg:col-span-2 space-y-6">
            {team.description && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{team.description}</p>
              </section>
            )}

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                  <Users className="w-4 h-4" />
                  Line principal
                </div>
                <Badge variant={starters.length >= 5 ? "open" : "upcoming"}>
                  {starters.length}/5 titulares
                </Badge>
              </div>

              <div className="space-y-2">
                {starters.map((member, i) => {
                  const nick = member.profile?.nickname ?? "—";
                  const elo = member.profile?.elo ?? 0;
                  const role = member.inGameRole ? ROLE_LABELS[member.inGameRole] ?? member.inGameRole : "Sem função";
                  return (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--secondary)]">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="text-xs">{nick[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{nick}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{role}</div>
                      </div>
                      {i === 0 && <Badge variant="gold">Capitão</Badge>}
                      <span className="text-xs font-bold text-[var(--primary)] shrink-0">{elo} ELO</span>
                    </div>
                  );
                })}

                {/* Empty slots */}
                {Array.from({ length: Math.max(0, 5 - starters.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-[var(--border)] opacity-50">
                    <div className="h-9 w-9 rounded-full border border-dashed border-[var(--border)] flex items-center justify-center">
                      <Users className="w-4 h-4 text-[var(--muted-foreground)]" />
                    </div>
                    <span className="text-sm text-[var(--muted-foreground)]">Vaga aberta</span>
                  </div>
                ))}
              </div>

              {subs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="text-xs text-[var(--muted-foreground)] font-semibold mb-2">Substituto</div>
                  {subs.map((member) => {
                    const nick = member.profile?.nickname ?? "—";
                    const elo = member.profile?.elo ?? 0;
                    return (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--secondary)]">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="text-xs">{nick[0]}</AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-sm font-semibold truncate">{nick}</span>
                        <Badge variant="secondary">Sub</Badge>
                        <span className="text-xs font-bold text-[var(--primary)] shrink-0">{elo} ELO</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                <Trophy className="w-4 h-4" />
                Estatísticas
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Vitórias", value: team.wins },
                  { label: "Derrotas", value: team.losses },
                  { label: "Win rate", value: `${team.wins + team.losses > 0 ? Math.round((team.wins / (team.wins + team.losses)) * 100) : 0}%` },
                  { label: "ELO médio", value: team.elo },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-[var(--muted-foreground)]">{s.label}</span>
                    <span className="font-bold">{s.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {team.isRecruiting && (
              <section className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                  <UserPlus className="w-4 h-4" />
                  Entrar no time
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mb-4 leading-relaxed">
                  O time está aberto para novos jogadores. Clique abaixo para solicitar entrada.
                </p>
                <Button asChild variant="gradient" size="sm" className="w-full gap-2">
                  <Link href={`/teams/join/${team.joinCode}`}>
                    <UserPlus className="w-3.5 h-3.5" /> Pedir para entrar
                  </Link>
                </Button>
              </section>
            )}

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                <Shield className="w-4 h-4" />
                Informações
              </div>
              <div className="space-y-2 text-xs text-[var(--muted-foreground)]">
                <div className="flex justify-between">
                  <span>Região</span>
                  <span className="font-medium text-[var(--foreground)]">Brasil 🇧🇷</span>
                </div>
                <div className="flex justify-between">
                  <span>Criado em</span>
                  <span className="font-medium text-[var(--foreground)]">
                    {new Date(team.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
