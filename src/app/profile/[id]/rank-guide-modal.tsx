"use client";

import Image from "next/image";
import { Info, Sparkles, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPlayerRank, RANK_GUIDE } from "@/lib/ranks";
import { cn } from "@/lib/utils";
import ProfileModalShell from "./profile-modal-shell";

interface RankGuideModalProps {
  currentElo: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function RankGuideModal({ currentElo, isOpen, onClose }: RankGuideModalProps) {
  const currentRank = getPlayerRank(currentElo);

  return (
    <ProfileModalShell
      open={isOpen}
      onClose={onClose}
      title="Rank Guide"
      description="Veja a progressao completa das patentes BlueStrike e onde seu ELO atual se encaixa."
      widthClassName="max-w-4xl"
    >
      <div className="space-y-6 p-6">
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(12,28,46,0.98),rgba(5,12,20,0.92))] p-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
              <Sparkles className="h-3.5 w-3.5" />
              Sua faixa atual
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Image
                src={currentRank.imagePath}
                alt={currentRank.name}
                width={100}
                height={100}
                className="h-[100px] w-[100px] shrink-0 object-contain drop-shadow-[0_8px_24px_rgba(0,200,255,0.25)]"
                unoptimized
              />

              <div>
                <div className="text-2xl font-black tracking-tight text-[var(--foreground)]">{currentRank.name}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="default">{currentElo} ELO</Badge>
                  <Badge variant="outline">{currentRank.tooltip}</Badge>
                </div>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted-foreground)]">
                  Cada salto de faixa deixa sua ficha competitiva mais forte para capitacao, lineups e inscricoes.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
              <Info className="h-4 w-4" />
              Como ler
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
              <p>O guia mostra os marcos de progressao de cada patente dentro do ecossistema BlueStrike.</p>
              <p>Seu card atual fica destacado para voce enxergar rapido a faixa em que esta agora.</p>
              <p>A partir de 3700 ELO, o jogador entra em Global Elite e passa a competir no topo do hub.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
            <Trophy className="h-4 w-4" />
            Legenda completa
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {RANK_GUIDE.map((rank, index) => {
              const isCurrent = rank.name === currentRank.name;

              return (
                <div
                  key={rank.name}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border px-4 py-3 transition-colors",
                    isCurrent
                      ? "border-[var(--primary)]/35 bg-[var(--primary)]/8 shadow-[0_18px_45px_rgba(0,200,255,0.08)]"
                      : "border-[var(--border)] bg-[var(--secondary)]/45"
                  )}
                >
                  <Image
                    src={rank.imagePath}
                    alt={rank.name}
                    width={56}
                    height={56}
                    className="h-[56px] w-[56px] shrink-0 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                    unoptimized
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-[var(--foreground)]">{rank.name}</span>
                      {isCurrent && <Badge variant="default">Atual</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">Faixa {index + 1} do circuito BlueStrike.</p>
                  </div>

                  <div className="shrink-0 rounded-full border border-white/10 bg-black/15 px-3 py-1 text-xs font-mono font-semibold text-[var(--foreground)]">
                    {rank.rangeLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex justify-end border-t border-white/10 pt-4">
          <Button type="button" variant="gradient" onClick={onClose}>
            Fechar guia
          </Button>
        </div>
      </div>
    </ProfileModalShell>
  );
}
