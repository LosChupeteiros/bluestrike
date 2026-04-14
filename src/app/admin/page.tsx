"use client";

import { useState } from "react";
import {
  Trophy, Users, Plus, Search,
  AlertTriangle, CheckCircle2, XCircle, Edit,
  Trash2, Eye, Shield, Zap, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockTournaments, mockPlayers, stats } from "@/data/mock";
import { formatDate, formatCurrency, getStatusLabel } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "open" | "ongoing" | "finished" | "upcoming"> = {
  open: "open",
  ongoing: "ongoing",
  finished: "finished",
  upcoming: "upcoming",
};

export default function AdminPage() {
  const [search, setSearch] = useState("");

  const filteredTournaments = mockTournaments.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPlayers = mockPlayers.filter((p) =>
    p.nickname.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between py-8 border-b border-[var(--border)] mb-8">
          <div>
            <div className="flex items-center gap-2 text-[var(--primary)] text-sm font-semibold mb-1">
              <Shield className="w-4 h-4" /> Painel Admin
            </div>
            <h1 className="text-3xl font-black tracking-tight">Administração</h1>
          </div>
          <Button variant="gradient" className="gap-2">
            <Plus className="w-4 h-4" /> Novo Campeonato
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Jogadores", value: stats.totalPlayers.toLocaleString(), icon: Users, trend: "+124 esse mês", color: "text-[var(--primary)]" },
            { label: "Campeonatos", value: stats.tournamentsPlayed, icon: Trophy, trend: "+3 ativos", color: "text-yellow-400" },
            { label: "Partidas", value: stats.matchesPlayed.toLocaleString(), icon: Zap, trend: "+18 hoje", color: "text-orange-400" },
            { label: "Prêmios pagos", value: formatCurrency(stats.prizeDistributed), icon: BarChart3, trend: "Esse ano", color: "text-green-400" },
          ].map((kpi) => (
            <div key={kpi.label} className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[var(--muted-foreground)]">{kpi.label}</span>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className={`text-2xl font-black ${kpi.color} mb-1`}>{kpi.value}</div>
              <div className="text-xs text-[var(--muted-foreground)]">{kpi.trend}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
          <Input
            placeholder="Buscar campeonato ou jogador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="tournaments">
          <TabsList className="mb-6 bg-[var(--card)] border border-[var(--border)]">
            <TabsTrigger value="tournaments">Campeonatos</TabsTrigger>
            <TabsTrigger value="players">Jogadores</TabsTrigger>
            <TabsTrigger value="reports">Denúncias</TabsTrigger>
          </TabsList>

          {/* Tournaments */}
          <TabsContent value="tournaments">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3 border-b border-[var(--border)] bg-[var(--secondary)] text-xs text-[var(--muted-foreground)] font-medium">
                <span>Campeonato</span>
                <span className="hidden sm:block w-24 text-center">Times</span>
                <span className="hidden sm:block w-20 text-center">Prêmio</span>
                <span className="w-28 text-center">Status</span>
                <span className="w-24 text-right">Ações</span>
              </div>
              {filteredTournaments.map((t) => (
                <div key={t.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)]/40 transition-colors">
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{formatDate(t.startsAt ?? "")} · {t.format.replace("_", " ")}</div>
                  </div>
                  <div className="hidden sm:block w-24 text-center text-sm text-[var(--muted-foreground)]">
                    {t.registeredTeamsCount}/{t.maxTeams}
                  </div>
                  <div className="hidden sm:block w-20 text-center text-sm text-yellow-400 font-bold">
                    {formatCurrency(t.prizeTotal)}
                  </div>
                  <div className="w-28 flex justify-center">
                    <Badge variant={STATUS_VARIANT[t.status]}>{getStatusLabel(t.status)}</Badge>
                  </div>
                  <div className="w-24 flex items-center justify-end gap-1">
                    <button className="p-1.5 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Players */}
          <TabsContent value="players">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3 border-b border-[var(--border)] bg-[var(--secondary)] text-xs text-[var(--muted-foreground)] font-medium">
                <span>Jogador</span>
                <span className="hidden sm:block w-20 text-center">ELO</span>
                <span className="hidden sm:block w-20 text-center">W/L</span>
                <span className="w-24 text-right">Ações</span>
              </div>
              {filteredPlayers.map((p) => (
                <div key={p.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)]/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={p.avatar} />
                      <AvatarFallback className="text-xs">{p.nickname[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">{p.nickname}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{p.steamId ?? "—"}</div>
                    </div>
                  </div>
                  <div className="hidden sm:block w-20 text-center text-sm text-[var(--primary)] font-bold">
                    {p.elo}
                  </div>
                  <div className="hidden sm:block w-20 text-center text-sm text-[var(--muted-foreground)]">
                    {p.wins}/{p.losses}
                  </div>
                  <div className="w-24 flex items-center justify-end gap-1">
                    <button className="p-1.5 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 transition-colors" title="Banir jogador">
                      <Shield className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports">
            <div className="space-y-3">
              {[
                { id: 1, type: "cheat", player: "xh4ckerbr", description: "Suspeita de aimbot na partida #m482", severity: "high", reported: "Há 2h" },
                { id: 2, type: "toxic", player: "rager99", description: "Comportamento tóxico e insultos no chat", severity: "medium", reported: "Há 4h" },
                { id: 3, type: "dc", player: "lagger123", description: "Desconexão intencional em 3 partidas", severity: "low", reported: "Há 1d" },
              ].map((report) => (
                <div key={report.id} className="flex items-start gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${
                    report.severity === "high" ? "text-red-400" :
                    report.severity === "medium" ? "text-yellow-400" : "text-blue-400"
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">{report.player}</span>
                      <Badge variant={
                        report.severity === "high" ? "destructive" :
                        report.severity === "medium" ? "upcoming" : "secondary"
                      } className="text-xs">
                        {report.severity === "high" ? "Alta" : report.severity === "medium" ? "Média" : "Baixa"}
                      </Badge>
                      <span className="text-xs text-[var(--muted-foreground)]">{report.reported}</span>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)]">{report.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-[var(--muted-foreground)] text-xs font-medium hover:bg-[var(--muted)] transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Ignorar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
