import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Users, Shield, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockTeams } from "@/data/mock";
import JoinTeamForm from "./join-team-form";

interface Params {
  code: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { code } = await params;
  const team = mockTeams.find((t) => t.joinCode === code);
  if (!team) return { title: "Convite inválido" };
  return { title: `Entrar em ${team.name}` };
}

export default async function JoinTeamPage({ params }: { params: Promise<Params> }) {
  const { code } = await params;
  const team = mockTeams.find((t) => t.joinCode === code);

  if (!team) notFound();

  // In production: check passwordHash to determine if password is required
  const requiresPassword = Boolean((team as { passwordHash?: string }).passwordHash);
  const starters = team.members.filter((m) => m.isStarter);

  return (
    <div className="pt-24 pb-20 min-h-screen flex items-start justify-center">
      <div className="w-full max-w-lg mx-auto px-4">
        <Link
          href="/teams"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Ver todos os times
        </Link>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
          {/* Team identity */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--border)]">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-950 to-slate-900 border border-[var(--border)] flex items-center justify-center font-black text-[var(--primary)] text-xl shrink-0">
              {team.tag}
            </div>
            <div>
              <h1 className="text-2xl font-black">{team.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="ongoing" className="font-mono text-xs">[{team.tag}]</Badge>
                <span className="text-xs text-[var(--muted-foreground)]">{team.elo} ELO</span>
              </div>
            </div>
          </div>

          {/* Members preview */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)] mb-3">
              <Users className="w-4 h-4" />
              Line atual ({starters.length}/5)
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {starters.map((m) => {
                const nick = m.profile?.nickname ?? "—";
                return (
                  <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--secondary)] text-xs font-medium">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[9px]">{nick[0]}</AvatarFallback>
                    </Avatar>
                    {nick}
                  </div>
                );
              })}
              {Array.from({ length: Math.max(0, 5 - starters.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="px-2.5 py-1.5 rounded-lg border border-dashed border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                  Vaga aberta
                </div>
              ))}
            </div>
          </div>

          {team.description && (
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-6 pb-6 border-b border-[var(--border)]">
              {team.description}
            </p>
          )}

          {requiresPassword ? (
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)] mb-4">
                <Shield className="w-4 h-4" />
                Senha de entrada
              </div>
              <JoinTeamForm teamSlug={team.slug} teamName={team.name} requiresPassword />
            </div>
          ) : (
            <div>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Você foi convidado para <span className="font-bold text-[var(--foreground)]">{team.name}</span>.
                Clique em confirmar para solicitar entrada.
              </p>
              <JoinTeamForm teamSlug={team.slug} teamName={team.name} requiresPassword={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
