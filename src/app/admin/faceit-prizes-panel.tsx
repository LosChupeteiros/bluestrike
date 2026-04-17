"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { FaceitChampionship } from "@/lib/faceit";

const FACEIT_ICON = (
  <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
    <path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="#FF5500" />
  </svg>
);

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

function statusDot(status: string): string {
  switch (status) {
    case "join":         return "bg-green-400";
    case "checking_in": return "bg-orange-400";
    case "ongoing":     return "bg-cyan-400 animate-pulse";
    case "finished":    return "bg-white/30";
    case "cancelled":   return "bg-red-400";
    default:            return "bg-yellow-400";
  }
}

interface ChampionshipRowProps {
  championship: FaceitChampionship;
}

function ChampionshipRow({ championship: c }: ChampionshipRowProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [entryFee, setEntryFee] = useState(String(c.entryFee || ""));
  const [prizeTotal, setPrizeTotal] = useState(String(c.totalPrizes || ""));
  const [prizeFirst, setPrizeFirst] = useState(String(c.prizeFirst || ""));
  const [prizeSecond, setPrizeSecond] = useState(String(c.prizeSecond || ""));
  const [prizeThird, setPrizeThird] = useState(String(c.prizeThird || ""));

  const hasPrize = c.totalPrizes > 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/faceit-prizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          championshipId: c.id,
          entryFee: Number(entryFee) || 0,
          prizeTotal: Number(prizeTotal) || 0,
          prizeFirst: Number(prizeFirst) || 0,
          prizeSecond: Number(prizeSecond) || 0,
          prizeThird: Number(prizeThird) || 0,
        }),
      });

      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        setFeedback({ type: "error", message: payload.error ?? "Erro ao salvar." });
        return;
      }

      setFeedback({ type: "success", message: "Premiação salva com sucesso." });
      router.refresh();
      setTimeout(() => setOpen(false), 1200);
    });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)]">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left"
      >
        {/* Cover thumbnail */}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#FF5500]/20 bg-gradient-to-br from-[#3a1000] to-slate-900">
          {c.coverImage ? (
            <Image src={c.coverImage} alt={c.name} fill sizes="40px" className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center">{FACEIT_ICON}</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{c.name}</span>
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDot(c.status))} />
            <span className="shrink-0 text-xs text-[var(--muted-foreground)]">{statusLabel(c.status)}</span>
          </div>
          {hasPrize && (
            <div className="mt-0.5 text-xs font-semibold text-yellow-400">
              {formatCurrency(c.totalPrizes)} cadastrado
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-1.5 text-xs",
              hasPrize
                ? "border-yellow-500/30 text-yellow-400 hover:border-yellow-500/60"
                : "border-[#FF5500]/30 hover:border-[#FF5500]/60"
            )}
            style={hasPrize ? undefined : { color: "#FF5500" }}
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          >
            <Trophy className="h-3.5 w-3.5" />
            {hasPrize ? "Editar premiação" : "Cadastrar premiação"}
          </Button>
          {open ? <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)]" /> : <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />}
        </div>
      </button>

      {/* Expandable form */}
      {open && (
        <form onSubmit={handleSubmit} className="border-t border-[var(--border)] px-4 pb-4 pt-4">
          <p className="mb-4 text-xs text-[var(--muted-foreground)]">
            Valores em reais (R$). Deixe 0 para não exibir. Taxa de inscrição aparece no fluxo de inscrição BlueStrike.
          </p>

          {/* Taxa de inscrição */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold text-[var(--primary)]">
              Taxa de inscrição por time (R$)
            </label>
            <Input
              type="number"
              min={0}
              step={1}
              placeholder="0"
              value={entryFee}
              onChange={(e) => setEntryFee(e.target.value)}
              className="max-w-[160px]"
            />
            <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
              Dividido em 5 jogadores = R$ {entryFee ? (Number(entryFee) / 5).toFixed(2) : "0,00"} cada
            </p>
          </div>

          <div className="mb-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">Distribuição de prêmios</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold">Total</label>
              <Input
                type="number"
                min={0}
                step={100}
                placeholder="0"
                value={prizeTotal}
                onChange={(e) => setPrizeTotal(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-yellow-400">1 lugar</label>
              <Input
                type="number"
                min={0}
                step={100}
                placeholder="0"
                value={prizeFirst}
                onChange={(e) => setPrizeFirst(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">2 lugar</label>
              <Input
                type="number"
                min={0}
                step={100}
                placeholder="0"
                value={prizeSecond}
                onChange={(e) => setPrizeSecond(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-amber-700">3 lugar</label>
              <Input
                type="number"
                min={0}
                step={100}
                placeholder="0"
                value={prizeThird}
                onChange={(e) => setPrizeThird(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="gap-2 border-[#FF5500] bg-[#FF5500] text-white hover:bg-[#FF5500]/90"
              variant="outline"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trophy className="h-3.5 w-3.5" />}
              {isPending ? "Salvando..." : "Salvar premiação"}
            </Button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Cancelar
            </button>
          </div>

          {feedback && (
            <div
              className={cn(
                "mt-3 rounded-lg border px-3 py-2 text-xs",
                feedback.type === "success"
                  ? "border-green-500/20 bg-green-500/10 text-green-300"
                  : "border-red-500/20 bg-red-500/10 text-red-300"
              )}
            >
              {feedback.message}
            </div>
          )}
        </form>
      )}
    </div>
  );
}

interface FaceitPrizesPanelProps {
  championships: FaceitChampionship[];
}

export default function FaceitPrizesPanel({ championships }: FaceitPrizesPanelProps) {
  const FACEIT_ICON_LG = (
    <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" aria-hidden="true">
      <path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="#FF5500" />
    </svg>
  );

  return (
    <section className="rounded-2xl border border-[#FF5500]/20 bg-[var(--card)] p-6">
      <div className="mb-5 flex items-center gap-2 text-sm font-semibold" style={{ color: "#FF5500" }}>
        {FACEIT_ICON_LG}
        Premiações FACEIT
      </div>
      <h2 className="mb-1 text-xl font-black tracking-tight">Gerenciar premiações</h2>
      <p className="mb-5 text-sm text-[var(--muted-foreground)]">
        Defina o valor total e o pódio de cada campeonato FACEIT. Os valores aparecem nos cards e na página do campeonato.
      </p>

      {championships.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
          Nenhum campeonato FACEIT encontrado.
        </div>
      ) : (
        <div className="space-y-3">
          {championships.map((c) => (
            <ChampionshipRow key={c.id} championship={c} />
          ))}
        </div>
      )}
    </section>
  );
}
