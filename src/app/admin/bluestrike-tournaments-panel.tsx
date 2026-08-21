"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Crown,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Medal,
  Pencil,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { getTeamMode } from "@/lib/team-modes";
import type { Tournament } from "@/types";

const STATUS_OPTS: { value: Tournament["status"]; label: string }[] = [
  { value: "upcoming",  label: "Em breve" },
  { value: "open",      label: "Inscrições abertas" },
  { value: "ongoing",   label: "Em andamento" },
  { value: "finished",  label: "Finalizado" },
];

const STATUS_VARIANT: Record<string, "upcoming" | "open" | "ongoing" | "finished"> = {
  upcoming: "upcoming",
  open:     "open",
  ongoing:  "ongoing",
  finished: "finished",
};

// ── Podium card ──────────────────────────────────────────────────────────────

interface PodiumEntry {
  team: { id: string; name: string; tag: string; elo: number } | null;
  captain: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
    steamId: string;
    pixKeyType: string | null;
    pixKey: string | null;
    fullName: string | null;
  } | null;
}

interface PodiumData {
  first:  PodiumEntry | null;
  second: PodiumEntry | null;
  third:  PodiumEntry | null;
}

const PLACE_CONFIG = [
  { icon: Crown, label: "1º lugar", accent: "#f5c842", borderClass: "border-[#f5c842]/35 bg-[#f5c842]/5" },
  { icon: Medal, label: "2º lugar", accent: "#c7d2da", borderClass: "border-[#c7d2da]/25 bg-[#c7d2da]/5" },
  { icon: Award, label: "3º lugar", accent: "#e08a4a", borderClass: "border-[#e08a4a]/25 bg-[#e08a4a]/5" },
];

const PIX_TYPE_LABEL: Record<string, string> = {
  cpf: "CPF",
  phone: "Celular",
  email: "E-mail",
  random: "Chave aleatória",
};

/** Mostra a chave PIX inteira só sob demanda — evita deixar dado pessoal na tela. */
function PixKeyRow({ captain }: { captain: NonNullable<PodiumEntry["captain"]> }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!captain.pixKey || !captain.pixKeyType) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-orange-500/30 bg-orange-500/8 px-3 py-2.5">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" aria-hidden="true" />
        <div className="min-w-0 text-[11px] leading-relaxed text-orange-200">
          <span className="font-bold">Sem chave PIX cadastrada.</span> Peça para{" "}
          <span className="font-bold">{captain.nickname}</span> abrir o cadastro e registrar a
          chave antes de pagar a premiação.
        </div>
      </div>
    );
  }

  const masked =
    captain.pixKey.length > 6
      ? `${captain.pixKey.slice(0, 3)}${"•".repeat(Math.min(8, captain.pixKey.length - 5))}${captain.pixKey.slice(-2)}`
      : "••••••";

  async function copy() {
    try {
      await navigator.clipboard.writeText(captain.pixKey ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setRevealed(true);
    }
  }

  return (
    <div className="rounded-lg border border-green-500/25 bg-green-500/[0.06] px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[9px] font-black uppercase tracking-[0.14em] text-green-300">
          PIX · {PIX_TYPE_LABEL[captain.pixKeyType] ?? captain.pixKeyType}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="rounded p-1 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            aria-label={revealed ? "Ocultar chave" : "Mostrar chave"}
          >
            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={copy}
            className="rounded p-1 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            aria-label="Copiar chave PIX"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      <p className="truncate font-mono text-xs font-bold text-[var(--foreground)]">
        {revealed ? captain.pixKey : masked}
      </p>
      {captain.fullName && (
        <p className="mt-1 truncate text-[10px] text-[var(--muted-foreground)]">
          Titular: {captain.fullName}
        </p>
      )}
    </div>
  );
}

function PodiumPaymentCard({
  place,
  entry,
  prizeAmount,
}: {
  place: 0 | 1 | 2;
  entry: PodiumEntry | null;
  prizeAmount: number | null;
}) {
  const cfg = PLACE_CONFIG[place];
  const Icon = cfg.icon;

  if (!entry?.team) {
    return (
      <div className={cn("flex flex-col items-center gap-3 rounded-xl border p-4 text-center", cfg.borderClass)}>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in srgb, ${cfg.accent} 14%, transparent)`, color: cfg.accent }}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="text-xs font-semibold text-[var(--muted-foreground)]">{cfg.label}</div>
        <div className="text-sm font-black text-[var(--muted-foreground)]">—</div>
        {prizeAmount ? (
          <div className="font-mono text-sm font-black" style={{ color: cfg.accent }}>
            {formatCurrency(prizeAmount)}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border p-4", cfg.borderClass)}>
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in srgb, ${cfg.accent} 14%, transparent)`, color: cfg.accent }}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-gradient-to-br from-cyan-950 to-slate-900 text-[10px] font-black text-[var(--primary)]">
          {entry.team.tag}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-black" style={{ color: cfg.accent }}>
            {entry.team.name}
          </div>
          <div className="text-[10px] text-[var(--muted-foreground)]">{entry.team.elo} ELO</div>
        </div>
        {prizeAmount ? (
          <div className="shrink-0 font-mono text-sm font-black" style={{ color: cfg.accent }}>
            {formatCurrency(prizeAmount)}
          </div>
        ) : null}
      </div>

      {entry.captain && (
        <>
          <div className="flex items-center gap-2.5 rounded-lg border border-[var(--border)]/50 bg-black/20 p-2.5">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[var(--border)]">
              {entry.captain.avatarUrl ? (
                <Image src={entry.captain.avatarUrl} alt="" fill sizes="64px" className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--secondary)] text-[10px] font-bold">
                  {entry.captain.nickname[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                Capitão
              </div>
              <div className="truncate text-sm font-bold">{entry.captain.nickname}</div>
            </div>
            <a
              href={`https://steamcommunity.com/profiles/${entry.captain.steamId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-1.5 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              title="Ver Steam"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <PixKeyRow captain={entry.captain} />
        </>
      )}
    </div>
  );
}

// ── Tournament row ───────────────────────────────────────────────────────────

interface TournamentRowProps {
  tournament: Tournament;
}

function TournamentRow({ tournament: t }: TournamentRowProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"edit" | "podium">("edit");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Edit fields
  const [status, setStatus] = useState(t.status);
  const [prizeTotal, setPrizeTotal] = useState(String(t.prizeTotal ?? 0));
  const [prizeFirst, setPrizeFirst] = useState(String(t.prizeBreakdown?.[0]?.amount ?? 0));
  const [prizeSecond, setPrizeSecond] = useState(String(t.prizeBreakdown?.[1]?.amount ?? 0));
  const [prizeThird, setPrizeThird] = useState(String(t.prizeBreakdown?.[2]?.amount ?? 0));
  const [entryFee, setEntryFee] = useState(String(t.entryFee ?? 0));
  const playersPerTeam = getTeamMode(t.teamMode).playersPerTeam;
  const [registrationEnds, setRegistrationEnds] = useState(
    t.registrationEnds ? new Date(t.registrationEnds).toISOString().slice(0, 16) : ""
  );
  const [startsAt, setStartsAt] = useState(
    t.startsAt ? new Date(t.startsAt).toISOString().slice(0, 16) : ""
  );
  const [endsAt, setEndsAt] = useState(
    t.endsAt ? new Date(t.endsAt).toISOString().slice(0, 16) : ""
  );

  // Podium data (loaded lazily)
  const [podium, setPodium] = useState<PodiumData | null>(null);
  const [podiumLoading, setPodiumLoading] = useState(false);

  // `podiumLoading` NÃO pode entrar nas dependências: ao setá-lo o efeito
  // reexecutava, o cleanup abortava o próprio fetch e o `finally` era ignorado
  // porque `active` já era false — deixando o card carregando para sempre.
  const podiumRequestedRef = useRef(false);

  useEffect(() => {
    if (!open || tab !== "podium" || podiumRequestedRef.current) return;

    podiumRequestedRef.current = true;
    const controller = new AbortController();
    let active = true;

    const loadPodium = async () => {
      setPodiumLoading(true);
      try {
        const response = await fetch(`/api/admin/tournaments/${t.id}/podium`, { signal: controller.signal });
        if (!response.ok) throw new Error("falha ao carregar pódio");
        const data = (await response.json()) as PodiumData;
        if (active) setPodium(data);
      } catch {
        // Fechar o modal cancela a leitura — permite tentar de novo depois.
        if (active) podiumRequestedRef.current = false;
      } finally {
        if (active) setPodiumLoading(false);
      }
    };

    void loadPodium();

    return () => {
      active = false;
      controller.abort();
    };
  }, [open, tab, t.id]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const prizeBreakdown = [
        { place: "1º lugar", amount: Number(prizeFirst) },
        { place: "2º lugar", amount: Number(prizeSecond) },
        { place: "3º lugar", amount: Number(prizeThird) },
      ].filter((p) => p.amount > 0);

      const res = await fetch(`/api/admin/tournaments/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          prizeTotal: Number(prizeTotal),
          prizeBreakdown,
          entryFee: Number(entryFee),
          registrationEnds: registrationEnds ? new Date(registrationEnds).toISOString() : null,
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        }),
      });

      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFeedback({ type: "error", message: payload.error ?? "Erro ao salvar." });
        return;
      }
      setFeedback({ type: "success", message: "Campeonato atualizado." });
      router.refresh();
      setTimeout(() => setOpen(false), 1200);
    });
  }

  const registered = t.registeredTeamsCount ?? 0;
  const isFinished = t.status === "finished";

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--secondary)]">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen((v) => !v); }}
        className="flex cursor-pointer items-center gap-3 p-4"
      >
        {t.bannerUrl ? (
          <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--border)]">
            <Image src={t.bannerUrl} alt={t.name} fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5">
            <Trophy className="h-4 w-4 text-[var(--primary)]" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{t.name}</span>
            <Badge variant={STATUS_VARIANT[t.status] ?? "upcoming"} className="shrink-0 text-[10px]">
              {STATUS_OPTS.find((o) => o.value === t.status)?.label ?? t.status}
            </Badge>
            <span className="shrink-0 rounded border border-[var(--primary)]/25 bg-[var(--primary)]/10 px-1.5 py-0.5 font-mono text-[10px] font-black text-[var(--primary)]">
              {getTeamMode(t.teamMode).label}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-[10px] text-[var(--muted-foreground)]">
            <span>{registered}/{t.maxTeams} times</span>
            {t.prizeTotal > 0 && (
              <span className="text-yellow-400 font-semibold">{formatCurrency(t.prizeTotal)}</span>
            )}
            {t.startsAt && <span>Início: {formatDate(t.startsAt)}</span>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/tournaments/${t.id}`}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            Ver <ArrowUpRight className="h-3 w-3" />
          </Link>
          {open ? <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)]" /> : <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />}
        </div>
      </div>

      {/* Expandable content */}
      {open && (
        <div className="border-t border-[var(--border)]">
          {/* Tab switcher */}
          <div className="flex border-b border-[var(--border)]">
            {(["edit", "podium"] as const).map((t2) => (
              <button
                key={t2}
                type="button"
                onClick={() => setTab(t2)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors",
                  tab === t2
                    ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
              >
                {t2 === "edit" ? (
                  <><Pencil className="h-3.5 w-3.5" /> Editar</>
                ) : (
                  <><Crown className="h-3.5 w-3.5" /> {isFinished ? "Pódio & Pagamento" : "Pódio"}</>
                )}
              </button>
            ))}
          </div>

          {/* Edit tab */}
          {tab === "edit" && (
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              {/* Status */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Tournament["status"])}
                  className="flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 py-1.5 text-sm"
                >
                  {STATUS_OPTS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { label: "Inscrições até", value: registrationEnds, set: setRegistrationEnds },
                  { label: "Início",         value: startsAt,         set: setStartsAt },
                  { label: "Fim",            value: endsAt,           set: setEndsAt },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="mb-1.5 block text-xs font-semibold">{f.label}</label>
                    <Input type="datetime-local" value={f.value} onChange={(e) => f.set(e.target.value)} className="h-9 text-xs" />
                  </div>
                ))}
              </div>

              {/* Prize */}
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Premiação (R$)</div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Total",    color: "",               value: prizeTotal,  set: setPrizeTotal },
                    { label: "🥇 1 lugar", color: "text-yellow-400", value: prizeFirst,  set: setPrizeFirst },
                    { label: "🥈 2 lugar", color: "text-slate-300",  value: prizeSecond, set: setPrizeSecond },
                    { label: "🥉 3 lugar", color: "text-orange-400", value: prizeThird,  set: setPrizeThird },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className={cn("mb-1.5 block text-xs font-semibold", f.color)}>{f.label}</label>
                      <Input type="number" min={0} step={100} placeholder="0" value={f.value} onChange={(e) => f.set(e.target.value)} className="h-9 text-xs" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Entry fee */}
              <div className="max-w-[200px]">
                <label className="mb-1.5 block text-xs font-semibold">Taxa de inscrição (R$)</label>
                <Input type="number" min={0} step={10} value={entryFee} onChange={(e) => setEntryFee(e.target.value)} className="h-9 text-xs" />
                {Number(entryFee) > 0 && (
                  <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                    ÷ {playersPerTeam} {playersPerTeam === 1 ? "jogador" : "jogadores"} ={" "}
                    {formatCurrency(Math.ceil(Number(entryFee) / playersPerTeam))} por player
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" size="sm" className="gap-2" disabled={isPending}>
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
                  {isPending ? "Salvando..." : "Salvar alterações"}
                </Button>
                <button type="button" onClick={() => setOpen(false)} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  Cancelar
                </button>
              </div>

              {feedback && (
                <div className={cn(
                  "rounded-lg border px-3 py-2 text-xs",
                  feedback.type === "success"
                    ? "border-green-500/20 bg-green-500/10 text-green-300"
                    : "border-red-500/20 bg-red-500/10 text-red-300"
                )}>
                  {feedback.message}
                </div>
              )}
            </form>
          )}

          {/* Podium tab */}
          {tab === "podium" && (
            <div className="p-4">
              {podiumLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--muted-foreground)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando pódio...
                </div>
              ) : !isFinished ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] py-8 text-center text-xs text-[var(--muted-foreground)]">
                  O pódio de pagamento fica disponível após o campeonato ser finalizado.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Clique no ícone Steam de cada capitão para confirmar identidade antes de efetuar o pagamento.
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <PodiumPaymentCard
                      place={0}
                      entry={podium?.first ?? null}
                      prizeAmount={t.prizeBreakdown?.[0]?.amount ?? null}
                    />
                    <PodiumPaymentCard
                      place={1}
                      entry={podium?.second ?? null}
                      prizeAmount={t.prizeBreakdown?.[1]?.amount ?? null}
                    />
                    <PodiumPaymentCard
                      place={2}
                      entry={podium?.third ?? null}
                      prizeAmount={t.prizeBreakdown?.[2]?.amount ?? null}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Panel ────────────────────────────────────────────────────────────────────

interface Props {
  tournaments: Tournament[];
}

export default function BlueStrikeTournamentsPanel({ tournaments }: Props) {
  return (
    <section className="bs-form-card p-6 sm:p-8">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
        <Trophy className="h-4 w-4" />
        Campeonatos BlueStrike
      </div>
      <h2 className="mb-1 text-xl font-black tracking-tight">Gerenciar campeonatos</h2>
      <p className="mb-5 text-sm text-[var(--muted-foreground)]">
        Edite status, datas e premiação. Após finalizar, veja o pódio com os capitães para facilitar o pagamento.
      </p>

      {tournaments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
          Nenhum campeonato cadastrado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <TournamentRow key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </section>
  );
}
