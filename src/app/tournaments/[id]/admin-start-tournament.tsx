"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, Play, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatTeamSize } from "@/lib/utils";

interface AdminStartTournamentProps {
  tournamentId: string;
  tournamentName: string;
  teamSize: number;
  confirmedTeams: number;
  /** Status efetivo — o painel some depois que o campeonato ja comecou. */
  status: "upcoming" | "open" | "ongoing" | "finished";
}

export default function AdminStartTournament({
  tournamentId,
  tournamentName,
  teamSize,
  confirmedTeams,
  status,
}: AdminStartTournamentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Depois de iniciado nao ha o que fazer aqui — a chave ja esta na aba dela.
  if (status === "ongoing" || status === "finished") return null;

  const canStart = confirmedTeams >= 2;

  function handleStart() {
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/tournaments/${tournamentId}/start`, {
          method: "POST",
        });

        const payload = (await response.json()) as { error?: string; bracketReady?: boolean };

        if (!response.ok) {
          setError(payload.error ?? "Nao foi possivel iniciar o campeonato.");
          return;
        }

        setDone(true);
        setConfirming(false);
        router.refresh();
      } catch {
        setError("Erro de conexao ao iniciar o campeonato.");
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#f5c842]/25 bg-[#f5c842]/5">
      <div className="flex items-center gap-2 border-b border-[#f5c842]/20 bg-[#f5c842]/8 px-5 py-3">
        <Shield className="h-4 w-4 shrink-0 text-[#f5c842]" aria-hidden="true" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f5c842]">
          Controle do admin
        </span>
      </div>

      <div className="p-5">
        {done ? (
          <div className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" aria-hidden="true" />
            <div>
              <p className="font-bold text-green-300">Campeonato iniciado</p>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                A chave foi gerada e as partidas da primeira rodada estao liberadas.
              </p>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-sm font-black tracking-tight">Iniciar agora</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
              Fecha as inscricoes, gera a chave{" "}
              <span className="font-mono font-bold text-[var(--foreground)]">
                {formatTeamSize(teamSize)}
              </span>{" "}
              e libera a primeira rodada sem esperar o horario agendado.
            </p>

            <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--background)]/40 px-3 py-2">
              <span className="text-xs text-[var(--muted-foreground)]">Times confirmados</span>
              <span
                className={cn(
                  "font-mono text-sm font-black",
                  canStart ? "text-[var(--primary)]" : "text-orange-400"
                )}
              >
                {confirmedTeams}
              </span>
            </div>

            {!canStart && (
              <p className="mt-2 flex items-start gap-1.5 text-[11px] text-orange-300">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                A chave precisa de pelo menos 2 times confirmados.
              </p>
            )}

            {confirming ? (
              <div className="mt-4 rounded-lg border border-[#f5c842]/25 bg-[var(--background)]/60 p-3">
                <p className="text-xs leading-relaxed">
                  Iniciar <span className="font-bold">{tournamentName}</span> agora? As inscricoes
                  serao encerradas e a chave sera gerada com os {confirmedTeams} times confirmados.
                </p>

                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="gradient"
                    className="flex-1 gap-2"
                    disabled={isPending}
                    onClick={handleStart}
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {isPending ? "Iniciando..." : "Confirmar"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => setConfirming(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="gradient"
                className="mt-4 w-full gap-2"
                disabled={!canStart}
                onClick={() => setConfirming(true)}
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                Iniciar campeonato
              </Button>
            )}

            {error && (
              <p role="alert" className="mt-2 text-xs text-red-300">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
