import Link from "next/link";
import type { Metadata } from "next";
import { Users, Plus, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockTeams } from "@/data/mock";

export const metadata: Metadata = { title: "Times" };

const ROLE_LABELS: Record<string, string> = {
  igl: "IGL",
  awper: "AWPer",
  "entry-fragger": "Entry",
  rifler: "Rifler",
  lurker: "Lurker",
  support: "Support",
  coach: "Coach",
};

export default function TeamsPage() {
  const recruiting = mockTeams.filter((t) => t.isRecruiting);
  const all = mockTeams;

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-[var(--primary)] text-sm font-semibold mb-2">
              <Users className="w-4 h-4" />
              Times
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-2">Catálogo de Times</h1>
            <p className="text-[var(--muted-foreground)]">
              {recruiting.length > 0
                ? `${recruiting.length} time${recruiting.length !== 1 ? "s" : ""} recrutando no momento.`
                : "Crie seu time e convide sua line."}
            </p>
          </div>
          <Button asChild variant="gradient" className="gap-2 shrink-0">
            <Link href="/teams/create">
              <Plus className="w-4 h-4" /> Criar time
            </Link>
          </Button>
        </div>

        {/* Recruiting */}
        {recruiting.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Recrutando jogadores
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recruiting.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          </div>
        )}

        {/* All teams */}
        <div>
          <h2 className="text-lg font-bold mb-4">Todos os times</h2>
          <div className="space-y-3">
            {all.map((team) => (
              <Link key={team.id} href={`/teams/${team.slug}`} className="group block">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-950 to-slate-900 border border-[var(--border)] flex items-center justify-center font-black text-[var(--primary)] text-sm shrink-0">
                    {team.tag}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm group-hover:text-[var(--primary)] transition-colors truncate">
                      {team.name}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {team.members.length} jogador{team.members.length !== 1 ? "es" : ""} · {team.wins}V {team.losses}D · {team.elo} ELO médio
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {team.isRecruiting && (
                      <Badge variant="open" className="text-xs">Recrutando</Badge>
                    )}
                    {!team.isActive && (
                      <Badge variant="finished" className="text-xs">Inativo</Badge>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamCard({ team }: { team: typeof mockTeams[number] }) {
  const spotsLeft = 6 - team.members.length;

  return (
    <Link href={`/teams/${team.slug}`} className="group block h-full">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 card-hover h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-950 to-slate-900 border border-[var(--border)] flex items-center justify-center font-black text-[var(--primary)] text-base shrink-0">
            {team.tag}
          </div>
          <div className="min-w-0">
            <div className="font-black text-base group-hover:text-[var(--primary)] transition-colors truncate">
              {team.name}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">{team.elo} ELO médio</div>
          </div>
        </div>

        {team.description && (
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mb-4 line-clamp-2">
            {team.description}
          </p>
        )}

        {/* Members preview */}
        <div className="flex items-center gap-1.5 mb-4">
          {team.members.slice(0, 5).map((m) => {
            const nick = m.profile?.nickname ?? "?";
            return (
              <Avatar key={m.id} className="h-7 w-7 ring-1 ring-[var(--border)]">
                <AvatarFallback className="text-[10px]">{nick[0]}</AvatarFallback>
              </Avatar>
            );
          })}
          {spotsLeft > 0 && (
            <div className="h-7 w-7 rounded-full border border-dashed border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--muted-foreground)]">
              +{spotsLeft}
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>{team.wins}V / {team.losses}D</span>
          <Badge variant="open" className="text-xs">Recrutando</Badge>
        </div>
      </div>
    </Link>
  );
}
