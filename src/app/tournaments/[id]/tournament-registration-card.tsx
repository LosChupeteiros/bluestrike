"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardCopy,
  Clock,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Timer,
  Trophy,
  Users,
  X,
} from "lucide-react";
import type { Team, TeamMember } from "@/types";
import type { TournamentRegistrationIntent } from "@/lib/tournament-registration-intents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const PIX_EXPIRY_MS = 15 * 60 * 1000;
const MIN_ROSTER = 5;

const TERMS = `1. O capitao confirma que todos os membros do time leram e aceitaram as regras do campeonato.

2. A taxa de inscricao e obrigatoria para campeonatos pagos e a vaga so e confirmada apos aprovacao do pagamento.

3. A reserva do PIX dura 15 minutos. Depois disso, a vaga volta a ficar disponivel para outros times.

4. O capitao e responsavel por check-in, comunicacao e comportamento competitivo do time.

5. Cheats, exploits, smurfing abusivo ou conduta antidesportiva podem resultar em desclassificacao sem reembolso.

6. Ao continuar, o capitao declara ciencia e concordancia com estes termos em nome do time.`;

type FlowStep = "idle" | "team-select" | "roster-select" | "confirm" | "payment-summary" | "pix";

interface PixData {
  paymentId: string;
  qrCodeBase64: string;
  qrCode: string;
  expiresAt: number;
}

interface TournamentRegistrationCardProps {
  tournamentId: string;
  tournamentName: string;
  entryFee: number;
  canRegister: boolean;
  disabledReason: string | null;
  captainTeams: Team[];
  registeredTeamIds: string[];
  initialIntent: TournamentRegistrationIntent | null;
}

function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose?: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !onClose) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/80 px-4 pb-4 pt-12 backdrop-blur-sm sm:items-center sm:py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && onClose) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--background)] shadow-[0_32px_100px_rgba(0,0,0,0.7)]"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#0d0d0d] px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-black tracking-tight">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{subtitle}</p>}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              aria-label="Fechar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function TeamMark({ team }: { team: Team }) {
  if (team.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={team.logoUrl} alt={team.name} className="h-11 w-11 rounded-xl object-cover" />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--primary)]/25 bg-[var(--primary)]/10 text-sm font-black text-[var(--primary)]">
      {team.tag}
    </div>
  );
}

function SmallTeamMark({ team }: { team: Team }) {
  if (team.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={team.logoUrl} alt={team.name} className="h-8 w-8 rounded-lg object-cover" />
    );
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--primary)]/25 bg-[var(--primary)]/10 text-xs font-black text-[var(--primary)]">
      {team.tag}
    </div>
  );
}

function PixCheckout({
  amount,
  pixData,
  isPaid,
  loading,
  error,
  onRetry,
  onApproved,
}: {
  amount: number;
  pixData: PixData | null;
  isPaid: boolean;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onApproved: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [nowTick, setNowTick] = useState(0);

  useEffect(() => {
    if (!pixData) return;
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [pixData]);

  if (isPaid) {
    return (
      <div className="flex flex-col items-center gap-6 py-6 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500/15 ring-2 ring-green-500/30">
          <div className="absolute h-24 w-24 animate-ping rounded-full bg-green-500/10" />
          <Check className="relative h-10 w-10 text-green-400" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-green-400/70">Mercado Pago</p>
          <p className="mt-1 text-2xl font-black text-green-300">Pagamento aprovado</p>
          <p className="mt-1 text-3xl font-black text-green-400">{formatCurrency(amount)}</p>
        </div>
        <div className="w-full rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-left text-xs text-green-200">
          Seu time foi confirmado no campeonato. A pagina sera atualizada com a inscricao oficial.
        </div>
        <Button type="button" variant="outline" className="w-full border-green-500/30 text-green-300 hover:bg-green-500/10" onClick={onApproved}>
          Ver inscricao confirmada
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <Loader2 className="h-9 w-9 animate-spin text-[var(--primary)]" />
        <p className="text-sm font-semibold">Gerando QR Code...</p>
        <p className="text-xs text-[var(--muted-foreground)]">Aguarde um instante.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 py-2">
        <div className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
        <Button type="button" variant="outline" className="w-full gap-2" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!pixData) return null;

  const activePixData = pixData;
  const secondsLeft = nowTick > 0
    ? Math.max(0, Math.floor((activePixData.expiresAt - nowTick) / 1000))
    : Math.max(1, Math.floor(PIX_EXPIRY_MS / 1000));
  const expired = secondsLeft === 0;
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  if (expired) {
    return (
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)]">
          <Clock className="h-11 w-11 text-[var(--muted-foreground)]" />
        </div>
        <div>
          <p className="font-mono text-4xl font-black tabular-nums text-[var(--muted-foreground)]">00:00</p>
          <p className="mt-1 text-xl font-black">QR Code expirado</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Feche e inicie uma nova reserva se ainda houver vagas.</p>
        </div>
      </div>
    );
  }

  function handleCopy() {
    navigator.clipboard.writeText(activePixData.qrCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="w-full text-center">
        <div className="text-3xl font-black text-[var(--primary)]">{formatCurrency(amount)}</div>
        <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">taxa de inscricao</div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="rounded-2xl bg-white p-3 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${activePixData.qrCodeBase64}`} alt="QR Code PIX" className="h-44 w-44" />
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">Escaneie com o app do seu banco</p>
      </div>

      <div className="flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">ou use copia e cola</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <div className="flex w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 py-2.5">
        <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-[var(--muted-foreground)]">
          {activePixData.qrCode}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-black transition-all ${
            copied ? "bg-green-500/15 text-green-400" : "bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
          }`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>

      <div className="w-full space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Timer className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
          <span>Expira em <span className="font-black tabular-nums text-[var(--foreground)]">{minutes}:{seconds}</span></span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Check className="h-3.5 w-3.5 shrink-0 text-green-400" />
          Confirmacao automatica apos o pagamento
        </div>
      </div>
    </div>
  );
}

export default function TournamentRegistrationCard({
  tournamentId,
  tournamentName,
  entryFee,
  canRegister,
  disabledReason,
  captainTeams,
  registeredTeamIds,
  initialIntent,
}: TournamentRegistrationCardProps) {
  const router = useRouter();
  const [flowStep, setFlowStep] = useState<FlowStep>("idle");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedRoster, setSelectedRoster] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [intent, setIntent] = useState<TournamentRegistrationIntent | null>(initialIntent);
  const [submitting, setSubmitting] = useState(false);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState("");
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [pixPaid, setPixPaid] = useState(false);

  const selectedTeam = useMemo(
    () => captainTeams.find((t) => t.id === selectedTeamId) ?? null,
    [captainTeams, selectedTeamId]
  );

  const rosterMembers = useMemo<TeamMember[]>(
    () => (selectedTeam?.members ?? []).filter((m) => selectedRoster.includes(m.profileId)),
    [selectedTeam, selectedRoster]
  );

  const perPlayer = entryFee > 0 ? Math.ceil(entryFee / Math.max(1, rosterMembers.length || MIN_ROSTER)) : 0;

  const canResumeIntent = Boolean(
    intent?.status === "pending" &&
    intent.paymentStatus !== "paid" &&
    Date.parse(intent.expiresAt) > Date.now()
  );
  const buttonDisabled = (!canRegister && !canResumeIntent) || submitting;

  useEffect(() => {
    if (flowStep !== "pix" || !intent || !pixData || pixPaid) return;

    let cancelled = false;
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/tournaments/${tournamentId}/payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intentId: intent.id, mpPaymentId: pixData.paymentId }),
        });
        const payload = (await response.json()) as { ok?: boolean; error?: string };
        if (!cancelled && response.ok && payload.ok) {
          setPixPaid(true);
        }
      } catch {
        // Polling is best-effort; the webhook is the source of truth.
      }
    };

    verifyPayment();
    const timer = setInterval(verifyPayment, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [flowStep, intent, pixData, pixPaid, tournamentId]);

  function handleStartRegistration() {
    if (captainTeams.length === 1) {
      const team = captainTeams[0]!;
      const defaultRoster = (team.members ?? [])
        .filter((m) => m.isStarter)
        .slice(0, MIN_ROSTER)
        .map((m) => m.profileId);
      setSelectedTeamId(team.id);
      setSelectedRoster(defaultRoster);
      setFlowStep("roster-select");
    } else {
      setSelectedTeamId(null);
      setSelectedRoster([]);
      setFlowStep("team-select");
    }
  }

  function handleTeamSelect(team: Team) {
    const defaultRoster = (team.members ?? [])
      .filter((m) => m.isStarter)
      .slice(0, MIN_ROSTER)
      .map((m) => m.profileId);
    setSelectedTeamId(team.id);
    setSelectedRoster(defaultRoster);
    setFlowStep("roster-select");
  }

  function toggleRosterMember(profileId: string) {
    setSelectedRoster((prev) =>
      prev.includes(profileId) ? prev.filter((id) => id !== profileId) : [...prev, profileId]
    );
  }

  async function registerFreeTournament() {
    const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentConfirmed: true,
        teamId: selectedTeamId,
        rosterProfileIds: selectedRoster,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      throw new Error(payload.error ?? "Nao foi possivel concluir a inscricao.");
    }
  }

  async function createIntent() {
    const response = await fetch(`/api/tournaments/${tournamentId}/registration-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: selectedTeamId, rosterProfileIds: selectedRoster }),
    });
    const payload = (await response.json()) as { intent?: TournamentRegistrationIntent; error?: string };
    if (!response.ok || !payload.intent) {
      throw new Error(payload.error ?? "Nao foi possivel reservar a inscricao.");
    }
    setIntent(payload.intent);
    return payload.intent;
  }

  async function handleConfirm() {
    if (!termsAccepted || !selectedTeam) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      if (entryFee <= 0) {
        await registerFreeTournament();
        setFlowStep("idle");
        router.refresh();
        return;
      }

      await createIntent();
      setFlowStep("payment-summary");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel continuar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePixCreate(sourceIntent?: TournamentRegistrationIntent | null) {
    const currentIntent = sourceIntent ?? intent;
    if (!currentIntent) return;

    setPixLoading(true);
    setPixError("");
    setPixData(null);
    setPixPaid(false);

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/pix-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentId: currentIntent.id }),
      });
      const payload = (await response.json()) as {
        paymentId?: string;
        qrCodeBase64?: string;
        qrCode?: string;
        expiresAt?: string;
        error?: string;
      };

      if (!response.ok || !payload.paymentId || !payload.qrCodeBase64 || !payload.qrCode) {
        setPixError(payload.error ?? "Erro ao gerar QR Code. Tente novamente.");
        return;
      }

      setPixData({
        paymentId: payload.paymentId,
        qrCodeBase64: payload.qrCodeBase64,
        qrCode: payload.qrCode,
        expiresAt: payload.expiresAt ? Date.parse(payload.expiresAt) : Date.now() + PIX_EXPIRY_MS,
      });
    } finally {
      setPixLoading(false);
    }
  }

  function closeModal() {
    setFlowStep("idle");
    setPixError("");
    setFeedback(null);
    setTermsAccepted(false);
    if (!pixPaid) setPixData(null);
  }

  const ctaLabel = canResumeIntent
    ? "Retomar pagamento"
    : entryFee > 0
      ? "Inscrever meu time"
      : "Confirmar inscricao";

  const previewTeam = captainTeams.length === 1 ? captainTeams[0] : null;
  const previewStarters = useMemo(
    () => (previewTeam?.members ?? []).filter((m) => m.isStarter).slice(0, 5),
    [previewTeam]
  );

  return (
    <>
      <div className="space-y-3">
        <Button
          type="button"
          variant={canRegister || canResumeIntent ? "gradient" : "outline"}
          className="w-full gap-2 font-bold"
          size="lg"
          disabled={buttonDisabled}
          onClick={() => {
            if (canResumeIntent) {
              setFlowStep("pix");
              void handlePixCreate(intent);
              return;
            }
            if (canRegister) handleStartRegistration();
          }}
        >
          <Trophy className="h-4 w-4" />
          {ctaLabel}
        </Button>

        {/* Show single team preview or multi-team hint */}
        {captainTeams.length > 0 && !canResumeIntent && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 py-3 text-xs">
            {captainTeams.length === 1 && previewTeam ? (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <TeamMark team={previewTeam} />
                  <div className="min-w-0">
                    <div className="truncate font-bold text-[var(--foreground)]">{previewTeam.name}</div>
                    <div className="text-[var(--muted-foreground)]">{previewTeam.elo} ELO medio</div>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {previewStarters.map((member) => (
                    <Avatar key={member.id} className="h-6 w-6 border border-[var(--background)]">
                      <AvatarImage src={member.profile?.steamAvatarUrl ?? ""} />
                      <AvatarFallback className="bg-[var(--card)] text-[9px]">
                        {(member.profile?.steamPersonaName ?? "?").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <Users className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
                <span>
                  Voce tem <span className="font-bold text-[var(--foreground)]">{captainTeams.length} times</span> disponíveis para inscrever.
                </span>
              </div>
            )}
          </div>
        )}

        {canResumeIntent && (
          <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
            Voce tem um PIX pendente segurando essa vaga por tempo limitado.
          </div>
        )}

        {disabledReason && !canResumeIntent && (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-xs text-orange-200">
            {disabledReason}
          </div>
        )}

        {feedback && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {feedback}
          </div>
        )}
      </div>

      {/* ── Step: Team selection ── */}
      <Modal
        open={flowStep === "team-select"}
        onClose={closeModal}
        title="Escolher time"
        subtitle="Selecione qual dos seus times vai participar."
      >
        <div className="space-y-2 p-5">
          {captainTeams.map((team) => {
            const alreadyRegistered = registeredTeamIds.includes(team.id);
            const memberCount = (team.members ?? []).length;
            const starterCount = (team.members ?? []).filter((m) => m.isStarter).length;
            const hasEnoughPlayers = memberCount >= MIN_ROSTER;

            return (
              <button
                key={team.id}
                type="button"
                disabled={alreadyRegistered}
                onClick={() => handleTeamSelect(team)}
                className={`group w-full rounded-xl border p-3 text-left transition-all ${
                  alreadyRegistered
                    ? "cursor-not-allowed border-[var(--border)] opacity-40"
                    : "border-[var(--border)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <SmallTeamMark team={team} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold transition-colors group-hover:text-[var(--primary)]">
                        {team.name}
                      </span>
                      {alreadyRegistered && (
                        <span className="shrink-0 rounded-full bg-green-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-green-400">
                          Inscrito
                        </span>
                      )}
                      {!hasEnoughPlayers && !alreadyRegistered && (
                        <span className="shrink-0 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-orange-400">
                          Poucos jogadores
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">
                      {team.elo} ELO · {starterCount} titular{starterCount !== 1 ? "es" : ""} · {memberCount} no elenco
                    </div>
                  </div>
                  {!alreadyRegistered && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--primary)]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Modal>

      {/* ── Step: Roster selection ── */}
      <Modal
        open={flowStep === "roster-select"}
        onClose={closeModal}
        title="Escolher jogadores"
        subtitle={selectedTeam ? `${selectedTeam.name} · selecione pelo menos ${MIN_ROSTER} jogadores` : undefined}
      >
        <div className="space-y-4 p-5">
          {selectedTeam && (
            <>
              <div className="space-y-1.5">
                {(selectedTeam.members ?? []).map((member) => {
                  const isSelected = selectedRoster.includes(member.profileId);
                  const isCaptain = member.profileId === selectedTeam.captainId;

                  return (
                    <label
                      key={member.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                        isSelected
                          ? "border-[var(--primary)]/40 bg-[var(--primary)]/8"
                          : "border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--secondary)]/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRosterMember(member.profileId)}
                        className="h-4 w-4 shrink-0 cursor-pointer rounded accent-cyan-400"
                      />
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={member.profile?.steamAvatarUrl ?? ""} />
                        <AvatarFallback className="bg-[var(--card)] text-[9px]">
                          {(member.profile?.steamPersonaName ?? "?").slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold">
                            {member.profile?.steamPersonaName ?? "Player"}
                          </span>
                          {isCaptain && (
                            <span className="text-[10px] font-black text-[var(--primary)]">C</span>
                          )}
                        </div>
                        <div className="text-[10px] text-[var(--muted-foreground)]">
                          {member.isStarter ? "Titular" : "Reserva"}{member.inGameRole ? ` · ${member.inGameRole}` : ""}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className={`rounded-xl border px-4 py-2.5 text-xs font-semibold ${
                selectedRoster.length >= MIN_ROSTER
                  ? "border-[var(--primary)]/20 bg-[var(--primary)]/5 text-[var(--primary)]"
                  : "border-orange-500/20 bg-orange-500/5 text-orange-300"
              }`}>
                {selectedRoster.length} de {(selectedTeam.members ?? []).length} jogadores selecionados
                {selectedRoster.length < MIN_ROSTER && ` · selecione mais ${MIN_ROSTER - selectedRoster.length}`}
              </div>

              {feedback && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {feedback}
                </div>
              )}

              <Button
                type="button"
                variant="gradient"
                className="w-full gap-2"
                disabled={selectedRoster.length < MIN_ROSTER}
                onClick={() => {
                  setFeedback(null);
                  setFlowStep("confirm");
                }}
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </Modal>

      {/* ── Step: Confirm ── */}
      <Modal
        open={flowStep === "confirm"}
        onClose={closeModal}
        title="Confirmar inscricao"
        subtitle="Revise seu time e aceite os termos antes de continuar."
      >
        <div className="space-y-4 p-5">
          {selectedTeam && (
            <div className="rounded-xl border border-[var(--primary)]/20 bg-[var(--secondary)] p-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Time BlueStrike</div>
              <div className="flex items-center gap-3">
                <TeamMark team={selectedTeam} />
                <div className="min-w-0">
                  <p className="truncate font-black">{selectedTeam.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{rosterMembers.length} jogadores selecionados</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {rosterMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2 py-1 text-xs">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={member.profile?.steamAvatarUrl ?? ""} />
                      <AvatarFallback className="bg-[var(--secondary)] text-[6px]">
                        {(member.profile?.steamPersonaName ?? "?").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[90px] truncate">{member.profile?.steamPersonaName ?? "Player"}</span>
                    {member.profileId === selectedTeam.captainId && (
                      <span className="text-[10px] font-bold text-[var(--primary)]">C</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Campeonato</div>
            <p className="mb-1 font-bold">{tournamentName}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
              <span>Inscricao oficial BlueStrike</span>
              {entryFee > 0 ? (
                <span className="font-semibold text-[var(--foreground)]">{formatCurrency(perPlayer)} por player</span>
              ) : (
                <span className="font-semibold text-green-300">Gratuito</span>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Termos de participacao</div>
            <div className="h-36 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
              <pre className="whitespace-pre-wrap font-sans">{TERMS}</pre>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] p-3 transition-colors hover:border-[var(--primary)]/30">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-cyan-400"
            />
            <span className="text-xs leading-relaxed text-[var(--muted-foreground)]">
              Li e aceito os termos em nome de todos os membros do time.
            </span>
          </label>

          {feedback && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {feedback}
            </div>
          )}

          <Button type="button" variant="gradient" className="w-full gap-2" disabled={!termsAccepted || submitting} onClick={handleConfirm}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {entryFee > 0 ? "Continuar para pagamento" : "Confirmar inscricao gratuita"}
          </Button>
        </div>
      </Modal>

      {/* ── Step: Payment summary ── */}
      <Modal
        open={flowStep === "payment-summary"}
        onClose={closeModal}
        title="Resumo do pagamento"
        subtitle="Confira o valor antes de gerar o PIX."
      >
        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/10 p-5 text-center">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Total da inscricao</div>
            <div className="text-4xl font-black text-[var(--primary)]">{formatCurrency(entryFee)}</div>
            <div className="mt-1 text-xs text-[var(--muted-foreground)]">{tournamentName}</div>
          </div>

          <div className="rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--primary)]">
              <Users className="h-3.5 w-3.5" />
              Sugestao da BlueStrike
            </div>
            <div className="mb-3 flex gap-1.5">
              {rosterMembers.map((member) => (
                <div key={member.id} className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/10 py-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={member.profile?.steamAvatarUrl ?? ""} />
                    <AvatarFallback className="bg-[var(--secondary)] text-[8px]">
                      {(member.profile?.steamPersonaName ?? "?").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-full truncate px-1 text-[9px] text-[var(--muted-foreground)]">
                    {member.profile?.steamPersonaName ?? "Player"}
                  </div>
                  <div className="text-[10px] font-black text-[var(--primary)]">{formatCurrency(perPlayer)}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--muted-foreground)]">{rosterMembers.length || MIN_ROSTER} players x {formatCurrency(perPlayer)}</span>
              <span className="font-black">{formatCurrency(entryFee)}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-xs text-yellow-100">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" />
            O PIX reserva a vaga por 15 minutos. A inscricao aparece no campeonato somente apos a aprovacao.
          </div>

          <Button
            type="button"
            variant="gradient"
            className="w-full gap-2"
            onClick={() => {
              setFlowStep("pix");
              void handlePixCreate();
            }}
          >
            Gerar QR Code PIX
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Modal>

      {/* ── Step: PIX ── */}
      <Modal
        open={flowStep === "pix"}
        onClose={closeModal}
        title={pixPaid ? "Pagamento confirmado" : "Pagar com PIX"}
        subtitle={pixPaid ? undefined : "Escaneie o QR Code ou use o Copia e Cola."}
      >
        <div className="p-5">
          <PixCheckout
            amount={entryFee}
            pixData={pixData}
            isPaid={pixPaid}
            loading={pixLoading}
            error={pixError}
            onRetry={() => handlePixCreate(intent)}
            onApproved={() => {
              setFlowStep("idle");
              setPixData(null);
              setPixPaid(false);
              router.refresh();
            }}
          />
        </div>
      </Modal>
    </>
  );
}
