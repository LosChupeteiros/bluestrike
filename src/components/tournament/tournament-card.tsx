"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { getTournamentBadgeProps } from "@/lib/tournament-status";
import type { Tournament } from "@/types";

interface TournamentCardProps {
  tournament: Tournament;
  featured?: boolean;
}

/**
 * A premiação é o dado que decide a inscrição, então ela é o maior elemento
 * tipográfico do card — sem caixinha arredondada em volta, sem ícone de
 * troféu. Hairlines agrupam a informação; nada aqui precisa de moldura.
 */
export default function TournamentCard({ tournament, featured = false }: TournamentCardProps) {
  const badge = getTournamentBadgeProps(tournament);
  const registered = tournament.registeredTeamsCount ?? 0;
  const spotsLeft = tournament.maxTeams - registered;
  const fillPercent = Math.min(100, (registered / Math.max(1, tournament.maxTeams)) * 100);
  const isFull = spotsLeft === 0;
  const canRegister = badge.variant === "open";

  if (featured) {
    return (
      <Link href={`/tournaments/${tournament.id}`} className="group block h-full">
        <article className="flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-abyss shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-500 [transition-timing-function:var(--ease-out-quint)] hover:-translate-y-1 hover:border-white/[0.16]">
          {/* Banner */}
          <div className="relative h-40 shrink-0 overflow-hidden bg-surface">
            {tournament.bannerUrl ? (
              <Image
                src={tournament.bannerUrl}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
                className="object-cover opacity-70 transition-transform duration-[1100ms] [transition-timing-function:var(--ease-out-expo)] group-hover:scale-105"
                unoptimized
              />
            ) : (
              <div className="reticle-grid absolute inset-0 opacity-80" aria-hidden="true" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/50 to-abyss/10" />

            <div className="absolute inset-x-4 bottom-3 flex items-center gap-2">
              <Badge variant={badge.variant}>
                {badge.variant === "ongoing" && (
                  <span className="animate-breathe h-1.5 w-1.5 rounded-full bg-strike" aria-hidden="true" />
                )}
                {badge.label}
              </Badge>
              {tournament.featured && <Badge variant="gold">Destaque</Badge>}
            </div>
          </div>

          {/* Corpo */}
          <div className="flex flex-1 flex-col p-5">
            <h3 className="font-display text-[1.0625rem] font-bold leading-tight tracking-[-0.02em] text-ink transition-colors duration-300 group-hover:text-strike">
              {tournament.name}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-3">
              {tournament.description}
            </p>

            {/* Premiação — o dado dominante, sem moldura */}
            <div className="mt-5 border-t border-line/70 pt-4">
              <span className="tick block">Premiação total</span>
              <span className="tabular mt-1 block text-[1.5rem] font-bold leading-none text-prize">
                {formatCurrency(tournament.prizeTotal)}
              </span>
            </div>

            <dl className="mt-4 flex items-center gap-5 border-t border-line/70 pt-4 font-mono text-[11px] text-ink-3">
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Início</dt>
                <dd>{formatDate(tournament.startsAt ?? "")}</dd>
              </div>
              <span className="h-3 w-px bg-line-2" aria-hidden="true" />
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Times inscritos</dt>
                <dd>
                  {registered}/{tournament.maxTeams} times
                </dd>
              </div>
            </dl>

            {/* Ocupação */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between font-mono text-[11px]">
                <span className="text-ink-3">Vagas</span>
                <span className={isFull ? "text-ink-2" : "text-strike"}>
                  {isFull ? "Lotado" : `${spotsLeft} restantes`}
                </span>
              </div>
              <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-700 [transition-timing-function:var(--ease-out-quint)]",
                    isFull ? "bg-line-2" : "bg-strike"
                  )}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </div>

            <div className="mt-5 pt-1">
              <Button
                variant={canRegister ? "gradient" : "outline"}
                size="sm"
                className="w-full gap-2"
                tabIndex={-1}
              >
                {canRegister ? "Inscrever-se" : "Ver detalhes"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // ── Linha compacta ─────────────────────────────────────────────────────────
  return (
    <Link href={`/tournaments/${tournament.id}`} className="group block">
      <article className="flex items-center gap-4 rounded-lg border border-white/[0.06] bg-abyss px-4 py-3.5 transition-colors duration-300 hover:border-white/[0.14] hover:bg-surface/50">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-line bg-surface">
          {tournament.bannerUrl ? (
            <Image src={tournament.bannerUrl} alt="" fill sizes="44px" className="object-cover" unoptimized />
          ) : (
            <span className="reticle-grid absolute inset-0" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-sm font-bold tracking-tight text-ink transition-colors duration-300 group-hover:text-strike">
              {tournament.name}
            </h3>
            <Badge variant={badge.variant} className="shrink-0">
              {badge.label}
            </Badge>
          </div>
          <div className="mt-0.5 flex items-center gap-3 font-mono text-[11px] text-ink-3">
            <span>{formatDate(tournament.startsAt ?? "")}</span>
            <span className="h-2.5 w-px bg-line-2" aria-hidden="true" />
            <span>
              {registered}/{tournament.maxTeams}
            </span>
          </div>
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          <span className="tabular block text-sm font-bold text-prize">
            {formatCurrency(tournament.prizeTotal)}
          </span>
          <span className="tick block">Premiação</span>
        </div>

        <ArrowRight
          className="h-4 w-4 shrink-0 text-ink-3 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-strike"
          aria-hidden="true"
        />
      </article>
    </Link>
  );
}
