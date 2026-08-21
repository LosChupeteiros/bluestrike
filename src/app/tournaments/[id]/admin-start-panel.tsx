"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, PlayCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminStartPanelProps {
  tournamentId: string;
  tournamentName: string;
  confirmedTeams: number;
  /** Já está em andamento ou finalizado — nada a iniciar. */
  alreadyRunning: boolean;
  scheduledFor: string | null;
}

export default function AdminStartPanel({
  tournamentId,
  tournamentName,
  confirmedTeams,
  alreadyRunning,
  scheduledFor,
}: AdminStartPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const canStart = confirmedTeams >= 2 && !alreadyRunning;

  function handleStart() {
    setFeedback(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/tournaments/${tournamentId}/start`, {
          method: "POST",
        });
        const payload = (await response.json()) as {
          error?: string;
          matches?: number;
          confirmedTeams?: number;
        };

        if (!response.ok) {
          setFeedback({ type: "error", message: payload.error ?? "Não foi possível iniciar." });
          return;
        }

        setConfirming(false);
        setFeedback({
          type: "success",
          message: `Campeonato iniciado — ${payload.matches ?? 0} partidas na chave.`,
        });
        router.refresh();
      } catch {
        setFeedback({ type: "error", message: "Erro de conexão ao iniciar o campeonato." });
      }
    });
  }

  return (
    <div className="rounded-2xl border border-[#f5c842]/25 bg-gradient-to-br from-[#f5c842]/[0.06] via-[var(--card)] to-[var(--card)] p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#f5c842]">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Controle do organizador
      </div>

      {alreadyRunning ? (
        <>
          <p className="text-sm font-bold text-[var(--foreground)]">Campeonato já em andamento</p>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
            A chave está gerada e as partidas da primeira rodada já aceitam check-in.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-bold text-[var(--foreground)]">Iniciar agora</p>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
            Fecha as inscrições, gera a chave e libera as partidas da primeira rodada sem esperar
            {scheduledFor ? ` o horário agendado (${scheduledFor})` : " o horário agendado"}.
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-black/25 px-3 py-2">
            <span className="font-mono text-lg font-black text-[var(--primary)]">{confirmedTeams}</span>
            <span className="text-[11px] text-[var(--muted-foreground)]">
              {confirmedTeams === 1 ? "time confirmado" : "times confirmados"}
            </span>
          </div>

          {!canStart && (
            <p className="mt-3 flex items-start gap-2 text-xs text-orange-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              São necessários pelo menos 2 times confirmados.
            </p>
          )}

          {confirming ? (
            <div className="mt-4 space-y-2.5">
              <p className="text-xs font-semibold text-[var(--foreground)]">
                Confirmar início de &quot;{tournamentName}&quot;? Isso encerra as inscrições.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="gradient"
                  className="flex-1 gap-2"
                  disabled={isPending}
                  onClick={handleStart}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {isPending ? "Iniciando..." : "Confirmar"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
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
              <PlayCircle className="h-4 w-4" />
              Iniciar campeonato
            </Button>
          )}
        </>
      )}

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
            feedback.type === "success"
              ? "border-green-500/20 bg-green-500/10 text-green-200"
              : "border-red-500/20 bg-red-500/10 text-red-200"
          }`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
