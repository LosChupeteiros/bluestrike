"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, QrCode, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface TournamentRegistrationCardProps {
  tournamentId: string;
  tournamentName: string;
  entryFee: number;
  canRegister: boolean;
  disabledReason: string | null;
  currentTeamName: string | null;
}

export default function TournamentRegistrationCard({
  tournamentId,
  tournamentName,
  entryFee,
  canRegister,
  disabledReason,
  currentTeamName,
}: TournamentRegistrationCardProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showPix, setShowPix] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [isPending, startTransition] = useTransition();

  function registerTeam(paymentConfirmed: boolean) {
    setFeedback(null);

    startTransition(async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentConfirmed }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFeedback(payload.error ?? "Nao foi possivel concluir a inscricao.");
        return;
      }

      setRegistered(true);
      setShowPix(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="space-y-3">
        <Button
          type="button"
          variant={canRegister ? "gradient" : "outline"}
          className="w-full gap-2 font-bold"
          size="lg"
          disabled={!canRegister || isPending || registered}
          onClick={() => {
            if (!canRegister) {
              return;
            }

            if (entryFee > 0) {
              setShowPix(true);
              return;
            }

            registerTeam(true);
          }}
        >
          <Trophy className="h-4 w-4" />
          {registered ? "Inscricao concluida" : entryFee > 0 ? "Inscrever meu time" : "Confirmar inscricao"}
        </Button>

        {currentTeamName && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
            Time selecionado: <span className="font-semibold text-[var(--foreground)]">{currentTeamName}</span>
          </div>
        )}

        {disabledReason && (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-xs text-orange-200">
            {disabledReason}
          </div>
        )}

        {feedback && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {feedback}
          </div>
        )}

        {registered && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs text-green-200">
            Inscricao confirmada com sucesso.
          </div>
        )}
      </div>

      {showPix && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
            <div className="mb-2 text-sm font-semibold text-[var(--primary)]">Pagamento PIX fake</div>
            <h3 className="text-2xl font-black tracking-tight">{tournamentName}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
              Essa etapa simula a experiencia de pagamento para o fluxo de inscricao. O registro vai para o
              Supabase como pago e pronto para escala posterior.
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  QR fake
                </div>
                <div className="flex h-36 w-36 items-center justify-center rounded-2xl border border-dashed border-[var(--primary)]/30 bg-black/30">
                  <QrCode className="h-16 w-16 text-[var(--primary)]" />
                </div>
              </div>

              <div className="space-y-3">
                {/* Subtotal PIX */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    Valor da inscrição
                  </div>
                  <div className="mt-2 text-3xl font-black text-[var(--primary)]">{formatCurrency(entryFee)}</div>
                  <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">valor total do time (5 players)</div>
                </div>

                {/* Arte de divisão BlueStrike */}
                <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--primary)]">
                    <Users className="h-3 w-3" />
                    Sugestão da BlueStrike
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-1 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 py-1.5"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/25">
                          <Users className="h-3 w-3 text-[var(--primary)]" />
                        </div>
                        <div className="text-[10px] font-black text-[var(--primary)]">
                          {formatCurrency(Math.ceil(entryFee / 5))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Divida o valor da inscrição em partes iguais entre os 5 players.
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    Chave PIX
                  </div>
                  <div className="mt-2 break-all font-mono text-sm text-[var(--foreground)]">pix@bluestrike.com.br</div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    Time
                  </div>
                  <div className="mt-2 text-sm font-semibold text-[var(--foreground)]">{currentTeamName}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="outline" className="flex-1 gap-2" onClick={() => navigator.clipboard.writeText("pix@bluestrike.com.br")}>
                <Copy className="h-4 w-4" />
                Copiar chave
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPix(false)}>
                Cancelar
              </Button>
              <Button type="button" variant="gradient" className="flex-1 gap-2" disabled={isPending} onClick={() => registerTeam(true)}>
                <CheckCircle2 className="h-4 w-4" />
                {isPending ? "Processando..." : "Ja paguei"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
