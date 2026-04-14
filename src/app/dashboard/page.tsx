"use client";

import Link from "next/link";
import {
  Trophy, Users, Bell, Settings, TrendingUp,
  Swords, Clock, CheckCircle2, XCircle, Plus, ChevronRight,
  Star, Target, Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { mockPlayers, mockTournaments, mockTeams } from "@/data/mock";
import { formatDate } from "@/lib/utils";

// Mock current user
const currentUser = mockPlayers[0];
const userTeam = mockTeams[0];

const registrations = mockTournaments.slice(0, 3).map((t, i) => ({
  tournament: t,
  status: (["confirmed", "eliminated", "pending"] as const)[i],
  checkedIn: i === 0,
}));

const kd = (currentUser.kills / Math.max(currentUser.deaths, 1)).toFixed(2);
const hsRate = ((currentUser.headshots / Math.max(currentUser.kills, 1)) * 100).toFixed(0);
const winRate = ((currentUser.wins / Math.max(currentUser.wins + currentUser.losses, 1)) * 100).toFixed(0);

const notifications = [
  { id: 1, type: "match", title: "Sua partida começa em 30 minutos", time: "Há 5 min", read: false },
  { id: 2, type: "result", title: "FURIA venceu MIBR por 16-12", time: "Há 2h", read: false },
  { id: 3, type: "system", title: "Inscrições abertas: BlueStrike Open #12", time: "Há 1d", read: true },
];

export default function DashboardPage() {
  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between py-8 border-b border-[var(--border)] mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 ring-2 ring-[var(--primary)]/30">
                <AvatarImage src={currentUser.avatar} alt={currentUser.nickname} />
                <AvatarFallback className="text-xl font-black">{currentUser.nickname[0]}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-[var(--background)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black">{currentUser.nickname}</h1>
                {currentUser.badges?.map((b) => (
                  <span key={b.id} title={b.description} className="text-base">{b.icon}</span>
                ))}
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--primary)]" />
                  {currentUser.elo} ELO
                </span>
                <span>·</span>
                <span>Rank #{currentUser.rank}</span>
                <span>·</span>
                <span>🇧🇷 Brasil</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "ELO", value: currentUser.elo.toLocaleString(), icon: TrendingUp, color: "text-[var(--primary)]" },
            { label: "Win Rate", value: `${winRate}%`, icon: Trophy, color: "text-green-400" },
            { label: "K/D Ratio", value: kd, icon: Swords, color: "text-orange-400" },
            { label: "HS Rate", value: `${hsRate}%`, icon: Target, color: "text-orange-400" },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-[var(--muted-foreground)]">{stat.label}</span>
              </div>
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Main content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="registrations">
              <TabsList className="mb-6 bg-[var(--card)] border border-[var(--border)]">
                <TabsTrigger value="registrations">Inscrições</TabsTrigger>
                <TabsTrigger value="team">Meu Time</TabsTrigger>
                <TabsTrigger value="stats">Estatísticas</TabsTrigger>
                <TabsTrigger value="notifications">
                  Notificações
                  <span className="ml-1.5 w-4 h-4 rounded-full bg-[var(--primary)] text-black text-[10px] font-bold flex items-center justify-center">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* Registrations */}
              <TabsContent value="registrations" className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Campeonatos inscritos</h3>
                  <Link href="/tournaments">
                    <Button size="sm" variant="gradient" className="gap-1">
                      <Plus className="w-4 h-4" /> Inscrever-se
                    </Button>
                  </Link>
                </div>
                {registrations.map(({ tournament, status, checkedIn }) => (
                  <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className="group block">
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-950 to-slate-900 border border-[var(--border)] flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm group-hover:text-[var(--primary)] transition-colors truncate">{tournament.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{formatDate(tournament.startsAt ?? "")}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {checkedIn && (
                          <Badge variant="open" className="text-xs">
                            <CheckCircle2 className="w-3 h-3" /> Check-in OK
                          </Badge>
                        )}
                        <Badge
                          variant={
                            status === "confirmed" ? "open" :
                            status === "eliminated" ? "finished" : "upcoming"
                          }
                        >
                          {status === "confirmed" ? "Confirmado" :
                           status === "eliminated" ? "Eliminado" : "Pendente"}
                        </Badge>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
                    </div>
                  </Link>
                ))}
              </TabsContent>

              {/* Team */}
              <TabsContent value="team">
                {userTeam ? (
                  <div>
                    <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] mb-5">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-950 to-slate-900 border border-[var(--border)] flex items-center justify-center font-black text-[var(--primary)]">
                            {userTeam.tag}
                          </div>
                          <div>
                            <div className="font-black text-lg">{userTeam.name}</div>
                            <div className="text-xs text-[var(--muted-foreground)]">
                              {userTeam.wins}V / {userTeam.losses}D
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Settings className="w-4 h-4" /> Gerenciar
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {userTeam.members?.map((member, i) => {
                          const nick = member.profile?.nickname ?? "—";
                          const avatar = member.profile?.avatar ?? undefined;
                          const elo = member.profile?.elo ?? 0;
                          return (
                          <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--secondary)]">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={avatar} />
                              <AvatarFallback className="text-xs">{nick[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium flex-1">{nick}</span>
                            {i === 0 && (
                              <Badge variant="gold" className="text-xs">
                                <Star className="w-3 h-3" /> Capitão
                              </Badge>
                            )}
                            <span className="text-xs text-[var(--primary)] font-bold">{elo} ELO</span>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <Users className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4 opacity-40" />
                    <h3 className="font-semibold mb-2">Você não tem um time</h3>
                    <p className="text-sm text-[var(--muted-foreground)] mb-4">Crie seu time e comece a competir.</p>
                    <Button variant="gradient" className="gap-2">
                      <Plus className="w-4 h-4" /> Criar time
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Stats */}
              <TabsContent value="stats">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Kills totais", value: currentUser.kills.toLocaleString(), icon: Swords },
                    { label: "Deaths", value: currentUser.deaths.toLocaleString(), icon: XCircle },
                    { label: "Assists", value: currentUser.assists.toLocaleString(), icon: Users },
                    { label: "Headshots", value: currentUser.headshots.toLocaleString(), icon: Target },
                    { label: "Mapas jogados", value: currentUser.mapsPlayed.toLocaleString(), icon: Trophy },
                    { label: "Vitórias", value: currentUser.wins.toLocaleString(), icon: CheckCircle2 },
                  ].map((s) => (
                    <div key={s.label} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                      <s.icon className="w-4 h-4 text-[var(--primary)] mb-2" />
                      <div className="text-xl font-black">{s.value}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Progress bars */}
                <div className="mt-6 space-y-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                  <h4 className="font-bold text-sm mb-4">Performance</h4>
                  {[
                    { label: "Win Rate", value: parseFloat(winRate) },
                    { label: "HS Rate", value: parseFloat(hsRate) },
                    { label: "K/D normalizado", value: Math.min(parseFloat(kd) * 50, 100) },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-[var(--muted-foreground)]">{item.label}</span>
                        <span className="font-semibold text-[var(--primary)]">{item.value.toFixed(0)}%</span>
                      </div>
                      <Progress value={item.value} />
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Notifications */}
              <TabsContent value="notifications" className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                      n.read ? "border-[var(--border)] bg-[var(--card)] opacity-60" : "border-[var(--primary)]/20 bg-[var(--primary)]/3"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? "bg-[var(--muted-foreground)]" : "bg-[var(--primary)] animate-pulse"}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{n.title}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{n.time}</div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Profile quick edit */}
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-sm">Perfil</h4>
                <Button size="sm" variant="ghost" className="gap-1 text-xs h-7 px-2">
                  <Settings className="w-3 h-3" /> Editar
                </Button>
              </div>
              {currentUser.bio && (
                <p className="text-xs text-[var(--muted-foreground)] mb-4 leading-relaxed">{currentUser.bio}</p>
              )}
              <div className="space-y-2 text-xs">
                {currentUser.badges?.map((badge) => (
                  <div key={badge.id} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--secondary)]">
                    <span>{badge.icon}</span>
                    <div>
                      <div className="font-semibold">{badge.name}</div>
                      <div className="text-[var(--muted-foreground)]">{badge.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next match */}
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center gap-2 mb-3 text-[var(--primary)] text-sm font-semibold">
                <Zap className="w-4 h-4" /> Próxima Partida
              </div>
              <div className="py-4 text-center">
                <Clock className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-40" />
                <p className="text-xs text-[var(--muted-foreground)]">
                  Nenhuma partida agendada.
                </p>
                <Link href="/tournaments" className="inline-block mt-3">
                  <Button size="sm" variant="outline" className="text-xs">Ver campeonatos</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
