"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCopy,
  Clock,
  ExternalLink,
  Loader2,
  Lock,
  RefreshCw,
  Timer,
  Users,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import type { FaceitChampionship, FaceitTeam } from "@/lib/faceit";
import type { FaceitRegistration } from "@/lib/faceit-registrations";
import type { UserProfile } from "@/lib/profile";

// ── ícone FACEIT ────────────────────────────────────────────────────────────

// Número do WhatsApp de suporte
const WHATSAPP_SUPPORT = "5511985112608";
function whatsappUrl(msg: string) {
  return `https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(msg)}`;
}


const FACEIT_ICON = (
  <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" aria-hidden>
    <path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="#FF5500" />
  </svg>
);

// ── modal genérico ───────────────────────────────────────────────────────────

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
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open || !onClose) return;
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/80 px-4 pb-4 pt-12 backdrop-blur-sm sm:items-center sm:py-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--background)] shadow-[0_32px_100px_rgba(0,0,0,0.7)]"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/8 bg-[#0d0d0d] px-5 py-4">
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

// ── item do checklist pós-inscrição ─────────────────────────────────────────

function StatusItem({
  done,
  loading,
  label,
  detail,
  action,
  rightSlot,
}: {
  done: boolean;
  loading?: boolean;
  label: string;
  detail?: ReactNode;
  action?: ReactNode;
  rightSlot?: ReactNode;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-3.5 transition-colors ${
      done
        ? "border-green-500/25 bg-green-500/8"
        : "border-[var(--border)] bg-[var(--secondary)]"
    }`}>
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
        done ? "bg-green-500/20" : "bg-[var(--border)]"
      }`}>
        {loading ? (
          <span className="h-3 w-3 animate-spin rounded-full border border-[var(--muted-foreground)]/30 border-t-[var(--muted-foreground)]" />
        ) : done ? (
          <Check className="h-3 w-3 text-green-400" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted-foreground)]/50" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${done ? "text-green-300" : "text-[var(--foreground)]"}`}>
          {label}
        </p>
        {detail && <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">{detail}</div>}
        {action && !done && <div className="mt-2">{action}</div>}
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
  );
}

// ── card pós-inscrição ───────────────────────────────────────────────────────

function PostRegistrationCard({
  registration,
  championship,
  blueStrikeProfileUrl,
}: {
  registration: FaceitRegistration;
  championship: FaceitChampionship;
  blueStrikeProfileUrl: string;
}) {
  const [liveStatus, setLiveStatus] = useState({
    friendCheck: registration.friendCheck,
    teamConfirmed: registration.teamConfirmed,
    registrationStatus: registration.registrationStatus,
    paymentStatus: registration.paymentStatus as "pending" | "paid",
  });
  const [refreshing, setRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [retomandoPix, setRetomandoPix] = useState(false);
  const [retomandoErro, setRetomandoErro] = useState("");
  const [retomandoPixData, setRetomandoPixData] = useState<PixData | null>(null);
  const [retomandoModalOpen, setRetomandoModalOpen] = useState(false);

  const poll = useRef(() => {});
  poll.current = () => {
    fetch(`/api/tournaments/faceit/${championship.id}/live-status`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { friendCheck: boolean; teamConfirmed: boolean; registrationStatus: string; paymentStatus?: string } | null) => {
        if (d) setLiveStatus({
          friendCheck: d.friendCheck,
          teamConfirmed: d.teamConfirmed,
          registrationStatus: (d.registrationStatus ?? "active") as "active" | "cancelled",
          paymentStatus: (d.paymentStatus ?? "pending") as "pending" | "paid",
        });
      })
      .catch(() => {/* best-effort */});
  };

  // Polling automático: sempre roda enquanto não cancelado (15s pending, 30s confirmado)
  useEffect(() => {
    if (liveStatus.registrationStatus === "cancelled") return;
    const interval = liveStatus.teamConfirmed ? 30_000 : 15_000;
    poll.current();
    const t = setInterval(() => poll.current(), interval);
    return () => clearInterval(t);
  }, [liveStatus.teamConfirmed, liveStatus.registrationStatus]);

  // Countdown do cooldown manual
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1_000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function handleManualRefresh() {
    if (cooldown > 0 || refreshing) return;
    setRefreshing(true);
    poll.current();
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
    setCooldown(30);
  }

  async function handleRetomar() {
    // Se já tem QR válido, apenas reabre o modal sem chamar a API
    if (retomandoPixData && retomandoPixData.expiresAt > Date.now()) {
      setRetomandoModalOpen(true);
      return;
    }
    setRetomandoPix(true);
    setRetomandoErro("");
    setRetomandoPixData(null);
    try {
      const res = await fetch(`/api/tournaments/faceit/${championship.id}/pix-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: registration.id }),
      });
      const data = await res.json() as { paymentId?: string; qrCodeBase64?: string; qrCode?: string; error?: string };
      if (!res.ok || !data.qrCodeBase64 || !data.qrCode) {
        setRetomandoErro(data.error ?? "Erro ao gerar QR Code. Tente novamente.");
        return;
      }
      setRetomandoPixData({
        paymentId: data.paymentId!,
        qrCodeBase64: data.qrCodeBase64,
        qrCode: data.qrCode,
        expiresAt: Date.now() + PIX_EXPIRY_MS,
      });
      setRetomandoModalOpen(true);
    } finally {
      setRetomandoPix(false);
    }
  }

  const isPaid = liveStatus.paymentStatus === "paid";
  const isConfirmed = liveStatus.teamConfirmed;
  const isCancelled = liveStatus.registrationStatus === "cancelled";
  const allDone = isPaid && liveStatus.friendCheck && liveStatus.teamConfirmed;
  const faceitUrl = championship.faceitUrl || `https://www.faceit.com/pt-br/championship/${championship.id}`;

  return (
    <div className="space-y-3">
      {/* Banner CANCELADO */}
      {isCancelled && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3.5">
          <X className="h-5 w-5 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-black text-red-300">INSCRIÇÃO CANCELADA</p>
            <p className="text-xs text-red-400/70">O time saiu do campeonato na FACEIT. Siga os passos abaixo.</p>
          </div>
        </div>
      )}

      {/* Banner TIME CONFIRMADO */}
      {isConfirmed && !isCancelled && (
        <div className="flex items-center gap-2.5 rounded-xl border border-green-500/35 bg-green-500/12 px-4 py-3.5">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
          <div>
            <p className="text-sm font-black text-green-300">TIME CONFIRMADO</p>
            <p className="text-xs text-green-400/70">Inscrição aceita no campeonato.</p>
          </div>
        </div>
      )}

      {/* Link direto para o campeonato na FACEIT — sempre visível */}
      <a
        href={faceitUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#FF5500] bg-[#FF5500] py-2.5 text-sm font-black text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
      >
        {FACEIT_ICON}
        Ver campeonato na FACEIT
        <ExternalLink className="h-3.5 w-3.5" />
      </a>

      {/* Card principal */}
      <div className="rounded-xl border border-[#FF5500]/20 bg-[var(--card)] p-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: "#FF5500" }}>
            {FACEIT_ICON}
            Inscrição BlueStrike
          </div>
          {!allDone && !isCancelled && (
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={cooldown > 0 || refreshing}
              title={cooldown > 0 ? `Disponível em ${cooldown}s` : "Atualizar status"}
              className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition-all disabled:cursor-not-allowed"
              style={{
                borderColor: cooldown > 0 ? "rgba(255,255,255,0.08)" : "rgba(255,85,0,0.30)",
                color: cooldown > 0 ? "var(--muted-foreground)" : "#FF5500",
                backgroundColor: cooldown > 0 ? "transparent" : "rgba(255,85,0,0.08)",
              }}
            >
              <RefreshCw
                className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
                style={{ opacity: cooldown > 0 ? 0.4 : 1 }}
              />
              {cooldown > 0 ? `${cooldown}s` : "Atualizar"}
            </button>
          )}
        </div>

        <div className="space-y-2">
          {/* 1. Time selecionado */}
          <StatusItem
            done
            label={registration.faceitTeamName}
            detail="Time selecionado"
            rightSlot={
              registration.faceitTeamAvatar ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-green-500/40 ring-offset-2 ring-offset-[var(--card)]">
                  <Image
                    src={registration.faceitTeamAvatar}
                    alt={registration.faceitTeamName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 ring-2 ring-green-500/40 ring-offset-2 ring-offset-[var(--card)] text-xs font-black text-green-300">
                  {registration.faceitTeamName.slice(0, 2).toUpperCase()}
                </div>
              )
            }
          />

          {/* 2. Pagamento */}
          <StatusItem
            done={isPaid}
            loading={!isPaid}
            label={isPaid ? "Pagamento aprovado" : "Pagamento pendente"}
            detail={
              isPaid
                ? "Valor da inscrição confirmado."
                : "Pague para garantir sua vaga. Após o pagamento, a confirmação é automática."
            }
            action={
              !isPaid ? (
                <div className="flex flex-col gap-2">
                  {retomandoErro && (
                    <p className="text-[10px] text-red-400">{retomandoErro}</p>
                  )}
                  <button
                    type="button"
                    disabled={retomandoPix}
                    onClick={handleRetomar}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black text-[#00c8ff] transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ border: "1px solid rgba(0,200,255,0.3)", backgroundColor: "rgba(0,200,255,0.08)" }}
                  >
                    {retomandoPix ? (
                      <><Loader2 className="h-3 w-3 animate-spin" />Gerando QR...</>
                    ) : retomandoPixData && retomandoPixData.expiresAt > Date.now() ? (
                      <>Voltar para o pagamento</>
                    ) : (
                      <>Pagar agora via PIX</>
                    )}
                  </button>
                </div>
              ) : null
            }
          />

          {/* 3. Amizade BlueStrikeCS */}
          <StatusItem
            done={liveStatus.friendCheck}
            loading={!liveStatus.friendCheck}
            label={
              liveStatus.friendCheck
                ? "BlueStrikeCS adicionado"
                : "Adicionar BlueStrikeCS na FACEIT"
            }
            detail={
              liveStatus.friendCheck
                ? "Amizade confirmada. Invite a caminho."
                : "Para receber o convite de time, adicione o perfil da BlueStrike como amigo."
            }
            action={
              !liveStatus.friendCheck ? (
                <a
                  href={blueStrikeProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#FF5500]/35 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-[#FF5500]/60"
                  style={{ color: "#FF5500" }}
                >
                  Abrir perfil BlueStrikeCS
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null
            }
          />

          {/* 4. Time inscrito na FACEIT */}
          <StatusItem
            done={liveStatus.teamConfirmed}
            loading={!liveStatus.teamConfirmed && liveStatus.friendCheck && !isCancelled}
            label={
              liveStatus.teamConfirmed
                ? "Inscrição confirmada na FACEIT"
                : "Aguardando entrada no torneio"
            }
            detail={
              liveStatus.teamConfirmed ? (
                "Seu time está oficialmente inscrito."
              ) : (
                <>
                  Entre na página do campeonato na FACEIT, clique em{" "}
                  <strong className="text-[var(--foreground)]">ENTRAR NO TORNEIO</strong> e
                  selecione o time{" "}
                  <strong className="text-[var(--foreground)]">{registration.faceitTeamName}</strong>.
                </>
              )
            }
            action={
              !liveStatus.teamConfirmed && !isCancelled ? (
                <a
                  href={championship.faceitUrl || `https://www.faceit.com/pt-br/championship/${championship.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#FF5500]/35 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-[#FF5500]/60"
                  style={{ color: "#FF5500" }}
                >
                  Abrir campeonato na FACEIT
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null
            }
          />

          {/* 5 & 6. Etapas de recuperação — visíveis apenas quando cancelado */}
          {isCancelled && (
            <>
              {/* 5. Contatar suporte */}
              <StatusItem
                done={false}
                label="Contatar suporte BlueStrike"
                detail="Entre em contato com nosso suporte para verificar o cancelamento e liberar sua reinscrição."
                action={
                  <a
                    href={whatsappUrl(
                      `*SUPORTE BLUESTRIKE -- INSCRI\u00C7\u00C3O CANCELADA*\n\n` +
                      `*CAMPEONATO*\n` +
                      `Nome: ${championship.name}\n` +
                      `ID: ${championship.id}\n` +
                      `Link: ${championship.faceitUrl || `https://www.faceit.com/pt-br/championship/${championship.id}`}\n\n` +
                      `*TIME*\n` +
                      `Nome: ${registration.faceitTeamName}\n` +
                      `ID FACEIT: ${registration.faceitTeamId}\n\n` +
                      `*PAGAMENTO*\n` +
                      `Status: ${registration.paymentStatus === "paid" ? "Pago" : "Pendente"}\n` +
                      `Inscrito em: ${new Date(registration.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n` +
                      `*SITUA\u00C7\u00C3O*\n` +
                      `Inscri\u00E7\u00E3o cancelada na FACEIT. Solicito suporte para verifica\u00E7\u00E3o e reativa\u00E7\u00E3o.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-green-500/35 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-300 transition-colors hover:bg-green-500/20"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 shrink-0" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.533 5.845L.057 23.492a.5.5 0 0 0 .614.608l5.796-1.516A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.805 9.805 0 0 1-5.032-1.386l-.36-.214-3.733.977.998-3.642-.235-.374A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                    </svg>
                    Abrir WhatsApp de suporte
                  </a>
                }
              />

              {/* 6. Entrar novamente no torneio */}
              <StatusItem
                done={false}
                label="Entrar novamente no torneio"
                detail={
                  <>
                    Após o suporte liberar, acesse o campeonato na FACEIT e clique em{" "}
                    <strong className="text-[var(--foreground)]">ENTRAR NO TORNEIO</strong>{" "}
                    com o time{" "}
                    <strong className="text-[var(--foreground)]">{registration.faceitTeamName}</strong>.
                  </>
                }
                action={
                  <a
                    href={championship.faceitUrl || `https://www.faceit.com/pt-br/championship/${championship.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#FF5500]/35 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-[#FF5500]/60"
                    style={{ color: "#FF5500" }}
                  >
                    {FACEIT_ICON}
                    Abrir campeonato na FACEIT
                    <ExternalLink className="h-3 w-3" />
                  </a>
                }
              />
            </>
          )}
        </div>
      </div>

      {/* Modal PIX — retomar pagamento */}
      <Modal
        open={retomandoModalOpen}
        onClose={() => setRetomandoModalOpen(false)}
        title={isPaid ? "Pagamento confirmado" : "Pagar com PIX"}
        subtitle={isPaid ? undefined : "Escaneie o QR Code ou use o Copia e Cola."}
      >
        <div className="p-5">
          <PixCheckout
            amount={championship.entryFee}
            qrCodeBase64={retomandoPixData?.qrCodeBase64 ?? ""}
            qrCode={retomandoPixData?.qrCode ?? ""}
            expiresAt={retomandoPixData?.expiresAt ?? Date.now()}
            isPaid={isPaid}
            loading={retomandoPix && !retomandoPixData}
            error={retomandoErro}
            onRetry={() => { setRetomandoPixData(null); handleRetomar(); }}
            onApproved={() => setRetomandoModalOpen(false)}
          />
        </div>
      </Modal>
    </div>
  );
}

// ── seletor de times ─────────────────────────────────────────────────────────

function TeamSelector({
  teams,
  loading,
  selected,
  onSelect,
  onOpen,
}: {
  teams: FaceitTeam[] | null;
  loading: boolean;
  selected: FaceitTeam | null;
  onSelect: (t: FaceitTeam) => void;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleToggle() {
    if (!open) onOpen();
    setOpen((v) => !v);
  }

  const validTeams = (teams ?? []).filter((t) => t.members.length >= 5);
  const incompleteTeams = (teams ?? []).filter((t) => t.members.length < 5);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 py-2.5 text-sm transition-colors hover:border-[#FF5500]/40"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />
        ) : selected ? (
          <>
            {selected.avatar ? (
              <Image src={selected.avatar} alt={selected.name} width={20} height={20} className="rounded" unoptimized />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded bg-[#FF5500]/20 text-[8px] font-black" style={{ color: "#FF5500" }}>
                {selected.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="flex-1 truncate text-left font-semibold">{selected.name}</span>
            <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
              {selected.members.length} jogadores
            </span>
          </>
        ) : (
          <>
            <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span className="flex-1 text-left text-[var(--muted-foreground)]">Selecionar time CS2</span>
          </>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
          {teams === null || loading ? (
            <div className="flex items-center justify-center gap-2 py-5 text-xs text-[var(--muted-foreground)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Carregando times...
            </div>
          ) : teams.length === 0 ? (
            <div className="px-4 py-5 text-center">
              <p className="mb-2 text-sm text-[var(--muted-foreground)]">Nenhum time CS2 encontrado na sua conta FACEIT.</p>
              <a
                href="https://www.faceit.com/pt-br/create-team"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80"
                style={{ color: "#FF5500" }}
              >
                Criar time na FACEIT
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <>
              {/* Times válidos (≥5 membros) */}
              {validTeams.map((t) => (
                <button
                  key={t.teamId}
                  type="button"
                  onClick={() => { onSelect(t); setOpen(false); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--secondary)]"
                >
                  {t.avatar ? (
                    <Image src={t.avatar} alt={t.name} width={32} height={32} className="rounded-lg" unoptimized />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FF5500]/20 text-xs font-black" style={{ color: "#FF5500" }}>
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{t.members.length} jogadores</p>
                  </div>
                  <div className="shrink-0">
                    <div className="flex gap-0.5">
                      {t.members.slice(0, 5).map((m) => (
                        <Avatar key={m.userId} className="h-4 w-4">
                          <AvatarImage src={m.avatar ?? ""} />
                          <AvatarFallback className="text-[6px] bg-[var(--secondary)]">
                            {m.nickname.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                </button>
              ))}

              {/* Times incompletos (cinza, desabilitados) */}
              {incompleteTeams.map((t) => (
                <div
                  key={t.teamId}
                  className="flex items-center gap-3 px-4 py-3 opacity-40"
                  title={`${t.members.length}/5 jogadores — incompleto`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--secondary)] text-xs font-black text-[var(--muted-foreground)]">
                    {t.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[var(--muted-foreground)]">{t.name}</p>
                    <p className="text-xs text-red-400">{t.members.length}/5 — incompleto</p>
                  </div>
                  <Lock className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
                </div>
              ))}

              {/* Link criar time */}
              <div className="border-t border-[var(--border)] px-4 py-3">
                <a
                  href="https://www.faceit.com/pt-br/create-team"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
                  style={{ color: "#FF5500" }}
                >
                  Criar novo time na FACEIT
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── PIX Checkout Transparente ────────────────────────────────────────────────

function PixCheckout({
  amount,
  qrCodeBase64,
  qrCode,
  expiresAt,
  isPaid,
  loading,
  error,
  onRetry,
  onApproved,
}: {
  amount: number;
  qrCodeBase64: string;
  qrCode: string;
  expiresAt: number;
  isPaid?: boolean;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onApproved?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
  );

  useEffect(() => {
    if (!qrCode) return;
    setSecondsLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
    const t = setInterval(() =>
      setSecondsLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))), 1000
    );
    return () => clearInterval(t);
  }, [qrCode, expiresAt]);

  function handleCopy() {
    navigator.clipboard.writeText(qrCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const expired = secondsLeft === 0 && !loading && !!qrCode;

  // ── Estado: Pagamento aprovado ──────────────────────────────────────────
  if (isPaid) {
    return (
      <div className="flex flex-col items-center gap-6 py-6 text-center">
        {/* Ícone animado */}
        <div className="relative flex items-center justify-center">
          <div
            className="absolute h-28 w-28 animate-ping rounded-full bg-green-500/15"
            style={{ animationDuration: "2.5s" }}
          />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500/12 ring-2 ring-green-500/30 ring-offset-2 ring-offset-[var(--background)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <Check className="h-9 w-9 text-green-400" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Texto */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-widest text-green-500/70">Mercado Pago</p>
          <p className="text-2xl font-black text-green-300">Pagamento aprovado!</p>
          <p className="text-3xl font-black text-green-400">{formatCurrency(amount)}</p>
        </div>

        {/* Info próximo passo */}
        <div className="w-full rounded-xl border border-green-500/20 bg-green-500/6 px-4 py-3.5 text-left">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-green-400/70">Próximos passos</p>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 text-xs text-green-300/80">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
              Adicione a BlueStrikeCS como amigo na FACEIT
            </div>
            <div className="flex items-start gap-2 text-xs text-green-300/80">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
              Entre no torneio na FACEIT com seu time
            </div>
          </div>
        </div>

        {onApproved && (
          <button
            type="button"
            onClick={onApproved}
            className="w-full rounded-xl border border-green-500/25 py-3 text-sm font-black text-green-300 transition-all hover:bg-green-500/10"
          >
            Ver status da inscrição
          </button>
        )}
      </div>
    );
  }

  // ── Estado: QR expirado ─────────────────────────────────────────────────
  if (expired) {
    return (
      <div className="flex flex-col items-center gap-6 py-6 text-center">
        {/* Ícone relógio */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)]">
          <Clock className="h-11 w-11 text-[var(--muted-foreground)]" />
        </div>

        {/* Contador zerado */}
        <div className="space-y-1.5">
          <p className="font-mono text-4xl font-black tabular-nums text-[var(--muted-foreground)]">00:00</p>
          <p className="text-xl font-black text-[var(--foreground)]">QR Code expirado</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            O tempo para pagamento esgotou.<br />Gere um novo código para continuar.
          </p>
        </div>

        <button
          type="button"
          onClick={onRetry}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#00c8ff]/10 py-3.5 text-sm font-black text-[#00c8ff] ring-1 ring-[#00c8ff]/25 transition-all hover:bg-[#00c8ff]/20"
        >
          <RefreshCw className="h-4 w-4" />
          Gerar novo QR Code
        </button>
      </div>
    );
  }

  // ── Estado: Carregando ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <Loader2 className="h-9 w-9 animate-spin text-[#00c8ff]" />
        <p className="text-sm font-semibold text-[var(--foreground)]">Gerando QR Code...</p>
        <p className="text-xs text-[var(--muted-foreground)]">Aguarde um instante.</p>
      </div>
    );
  }

  // ── Estado: Erro ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#00c8ff]/30 py-3 text-sm font-black text-[#00c8ff] transition-all hover:bg-[#00c8ff]/8"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    );
  }

  // ── Estado: QR Code ativo ───────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-5">
      {/* Valor */}
      <div className="w-full text-center">
        <div className="text-3xl font-black text-[#00c8ff]">{formatCurrency(amount)}</div>
        <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">taxa de inscrição</div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-2xl bg-white p-3 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${qrCodeBase64}`}
            alt="QR Code PIX"
            className="h-44 w-44"
          />
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">Escaneie com o app do seu banco</p>
      </div>

      {/* Divisor */}
      <div className="flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">ou use o Copia e Cola</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      {/* Copia e Cola */}
      <div className="flex w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 py-2.5">
        <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-[var(--muted-foreground)]">
          {qrCode}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          title="Copiar código PIX"
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-black transition-all ${
            copied
              ? "bg-green-500/15 text-green-400"
              : "bg-[#00c8ff]/10 text-[#00c8ff] hover:bg-[#00c8ff]/20"
          }`}
        >
          {copied ? (
            <><Check className="h-3.5 w-3.5" />Copiado!</>
          ) : (
            <><ClipboardCopy className="h-3.5 w-3.5" />Copiar</>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="w-full space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Timer className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
          <span>Expira em <span className="font-black tabular-nums text-[var(--foreground)]">{mins}:{secs}</span></span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Check className="h-3.5 w-3.5 shrink-0 text-green-400" />
          Confirmação automática após o pagamento
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Check className="h-3.5 w-3.5 shrink-0 text-green-400" />
          Ambiente seguro · Powered by Mercado Pago
        </div>
      </div>
    </div>
  );
}

// ── termos e condições (definido antes do componente principal) ──────────────

const TERMOS = `1. Ao se inscrever, o time confirma ter lido e concordar com todas as regras do campeonato publicadas na FACEIT.

2. A taxa de inscrição é obrigatória e não reembolsável após a confirmação do pagamento.

3. A BlueStrike não se responsabiliza por penalidades decorrentes do descumprimento das regras da FACEIT ou de comportamento antidesportivo por parte dos membros.

4. O capitão do time é o responsável legal pelo comportamento de todos os integrantes durante o campeonato.

5. O uso de cheats, exploits ou qualquer prática que viole o fair play resultará em desclassificação imediata e possível banimento da plataforma BlueStrike.

6. A BlueStrike se reserva o direito de desclassificar times por violação destes termos a qualquer momento, sem direito a reembolso.

7. Ao marcar a caixa abaixo, o capitão declara ter ciência e concordância de todos os membros do time com estes termos.`;

// ── componente principal ─────────────────────────────────────────────────────

type FlowStep = "idle" | "confirm" | "payment-summary" | "pix";

const PIX_EXPIRY_MS = 10 * 60 * 1000;

interface PixData {
  paymentId: string;
  qrCodeBase64: string;
  qrCode: string;
  expiresAt: number;
}

interface FaceitRegistrationFlowProps {
  championship: FaceitChampionship;
  currentProfile: UserProfile | null;
  initialRegistration: FaceitRegistration | null;
  blueStrikeProfileUrl: string;
}

export default function FaceitRegistrationFlow({
  championship,
  currentProfile,
  initialRegistration,
  blueStrikeProfileUrl,
}: FaceitRegistrationFlowProps) {
  const router = useRouter();

  // Flow state
  const [flowStep, setFlowStep] = useState<FlowStep>("idle");
  const [selectedTeam, setSelectedTeam] = useState<FaceitTeam | null>(null);
  const [teams, setTeams] = useState<FaceitTeam[] | null>(null);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState("");
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [pixPaid, setPixPaid] = useState(false);
  const [pendingReg, setPendingReg] = useState<FaceitRegistration | null>(null);

  // Polling de status de pagamento enquanto o modal PIX está aberto
  useEffect(() => {
    if (flowStep !== "pix" || !pendingReg || pixPaid) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/tournaments/faceit/${championship.id}/live-status`);
        if (!res.ok) return;
        const d = await res.json() as { paymentStatus?: string };
        if (d.paymentStatus === "paid") setPixPaid(true);
      } catch { /* best-effort */ }
    }, 5000);
    return () => clearInterval(t);
  }, [flowStep, pendingReg, pixPaid, championship.id]);

  // Carrega times FACEIT na primeira abertura do dropdown
  async function loadTeams() {
    if (teams !== null || teamsLoading) return;
    setTeamsLoading(true);
    try {
      const res = await fetch("/api/profile/faceit-teams");
      if (!res.ok) { setTeams([]); return; }
      const d = await res.json() as { teams: FaceitTeam[] };
      setTeams(d.teams ?? []);
    } finally {
      setTeamsLoading(false);
    }
  }

  // Step 1→2: criar inscrição no DB
  async function handleConfirm() {
    if (!selectedTeam || !termsAccepted) return;
    setRegistering(true);
    setError("");
    try {
      const res = await fetch(`/api/tournaments/faceit/${championship.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeam.teamId,
          teamName: selectedTeam.name,
          teamAvatar: selectedTeam.avatar,
        }),
      });
      const data = await res.json() as { registration?: FaceitRegistration; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Erro ao registrar.");
        return;
      }
      setPendingReg(data.registration!);
      // Se taxa = 0, pula pagamento e marca como pago
      if (championship.entryFee === 0) {
        await fetch(`/api/tournaments/faceit/${championship.id}/payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId: data.registration!.id }),
        });
        setFlowStep("idle");
        router.refresh();
      } else {
        setFlowStep("payment-summary");
      }
    } finally {
      setRegistering(false);
    }
  }

  // Step final: gera PIX transparente (QR Code + Copia e Cola)
  async function handlePixCreate(registrationId?: string) {
    const regId = registrationId ?? pendingReg?.id;
    if (!regId) return;
    setPixLoading(true);
    setPixError("");
    setPixData(null);
    try {
      const res = await fetch(`/api/tournaments/faceit/${championship.id}/pix-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: regId }),
      });
      const data = await res.json() as { paymentId?: string; qrCodeBase64?: string; qrCode?: string; error?: string };
      if (!res.ok || !data.qrCodeBase64 || !data.qrCode) {
        setPixError(data.error ?? "Erro ao gerar QR Code. Tente novamente.");
        return;
      }
      setPixData({ paymentId: data.paymentId!, qrCodeBase64: data.qrCodeBase64, qrCode: data.qrCode, expiresAt: Date.now() + PIX_EXPIRY_MS });
    } finally {
      setPixLoading(false);
    }
  }

  // ─── guard: já inscrito ────────────────────────────────────────────────────
  if (initialRegistration) {
    return (
      <PostRegistrationCard
        registration={initialRegistration}
        championship={championship}
        blueStrikeProfileUrl={blueStrikeProfileUrl}
      />
    );
  }

  // ─── guard: campeonato não aceita inscrições ───────────────────────────────
  if (championship.status !== "join") {
    return (
      <a
        href={championship.faceitUrl || `https://www.faceit.com/pt-br/championship/${championship.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: "#FF5500" }}
      >
        Ver na FACEIT
        <ArrowRight className="h-4 w-4" />
      </a>
    );
  }

  // ─── guard: não logado ────────────────────────────────────────────────────
  if (!currentProfile) {
    return (
      <a
        href="/auth/login"
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white transition-all hover:opacity-90"
        style={{ backgroundColor: "#FF5500" }}
      >
        Entrar para se inscrever
        <ArrowRight className="h-4 w-4" />
      </a>
    );
  }

  // ─── guard: sem FACEIT conectado ──────────────────────────────────────────
  if (!currentProfile.faceitId) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-4 text-center">
        <p className="mb-2 text-sm text-[var(--muted-foreground)]">
          Conecte sua conta FACEIT para se inscrever.
        </p>
        <a
          href={`/profile/${currentProfile.publicId}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ color: "#FF5500" }}
        >
          Acessar meu perfil
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  // ─── guard: campeonato lotado ─────────────────────────────────────────────
  if (championship.full) {
    return (
      <button
        disabled
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-red-500/15 py-3 text-sm font-black text-red-400"
      >
        Campeonato lotado
      </button>
    );
  }

  const perPlayer = championship.entryFee > 0 ? Math.ceil(championship.entryFee / 5) : 0;

  // ─── CTA principal ────────────────────────────────────────────────────────
  return (
    <>
      {/* Seletor de time */}
      <div className="mb-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)]">
          <Users className="h-3.5 w-3.5" />
          Seu time CS2 na FACEIT
        </div>
        <TeamSelector
          teams={teams}
          loading={teamsLoading}
          selected={selectedTeam}
          onSelect={setSelectedTeam}
          onOpen={loadTeams}
        />
      </div>

      {/* Valor da inscrição */}
      {championship.entryFee > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
          <span>Valor da inscrição</span>
          <div className="text-right">
            <span className="font-black text-[var(--foreground)]">
              {formatCurrency(perPlayer)} por player
            </span>
            <div className="text-[10px] text-[var(--muted-foreground)]">total {formatCurrency(championship.entryFee)}</div>
          </div>
        </div>
      )}

      {/* Botão inscrever */}
      <button
        type="button"
        disabled={!selectedTeam}
        onClick={() => setFlowStep("confirm")}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        style={{ backgroundColor: "#FF5500" }}
      >
        Inscrever meu time
        <ArrowRight className="h-4 w-4" />
      </button>

      {/* ── Modal 1: Confirmação ─────────────────────────────────────────── */}
      <Modal
        open={flowStep === "confirm"}
        onClose={() => { setFlowStep("idle"); setError(""); setTermsAccepted(false); }}
        title="Certifique-se das suas informações"
        subtitle="Revise os dados antes de confirmar a inscrição."
      >
        <div className="space-y-4 p-5">
          {/* Card do time */}
          {selectedTeam && (
            <div className="rounded-xl border border-[#FF5500]/20 bg-[var(--secondary)] p-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Time</div>
              <div className="flex items-center gap-3">
                {selectedTeam.avatar ? (
                  <Image
                    src={selectedTeam.avatar}
                    alt={selectedTeam.name}
                    width={44}
                    height={44}
                    className="rounded-xl"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF5500]/15 text-sm font-black" style={{ color: "#FF5500" }}>
                    {selectedTeam.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-black">{selectedTeam.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{selectedTeam.members.length} membros</p>
                </div>
              </div>
              {/* Roster */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedTeam.members.slice(0, 5).map((m) => (
                  <div key={m.userId} className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2 py-1 text-xs">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={m.avatar ?? ""} />
                      <AvatarFallback className="text-[6px] bg-[var(--secondary)]">
                        {m.nickname.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[80px] truncate">{m.nickname}</span>
                    {m.membership === "leader" && (
                      <span className="text-[10px] font-bold" style={{ color: "#FF5500" }}>C</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo do campeonato */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Campeonato</div>
            <p className="mb-1 font-bold">{championship.name}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
              <span>Nível {championship.joinChecks.minSkillLevel}–{championship.joinChecks.maxSkillLevel}</span>
              <span>{championship.slots} vagas · {championship.currentSubscriptions} inscritos</span>
              {championship.entryFee > 0 && (
                <span className="font-semibold text-[var(--foreground)]">
                  {formatCurrency(perPlayer)} por player
                </span>
              )}
            </div>
          </div>

          {/* Termos */}
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Termos de participação</div>
            <div className="h-36 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
              <pre className="whitespace-pre-wrap font-sans">{TERMOS}</pre>
            </div>
          </div>

          {/* Checkbox aceitar */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] p-3 transition-colors hover:border-[#FF5500]/30">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-[#FF5500]"
            />
            <span className="text-xs leading-relaxed text-[var(--muted-foreground)]">
              Li e aceito os termos de participação em nome de todos os membros do time.
            </span>
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={!termsAccepted || registering}
            onClick={handleConfirm}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: "#FF5500" }}
          >
            {registering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                {championship.entryFee > 0 ? "Continuar para pagamento" : "Confirmar inscrição gratuita"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* ── Modal 2: Resumo de pagamento ─────────────────────────────────── */}
      <Modal
        open={flowStep === "payment-summary"}
        title="Resumo do pagamento"
        subtitle="Confira o valor antes de prosseguir."
      >
        <div className="space-y-4 p-5">
          {/* Valor total */}
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/6 p-5 text-center">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Total da inscrição</div>
            <div className="text-4xl font-black text-yellow-400">{formatCurrency(championship.entryFee)}</div>
            <div className="mt-1 text-xs text-[var(--muted-foreground)]">{championship.name}</div>
          </div>

          {/* Divisão sugerida */}
          <div className="rounded-xl border border-[#FF5500]/20 bg-[#FF5500]/5 p-4">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: "#FF5500" }}>
              <Users className="h-3.5 w-3.5" />
              Sugestão da BlueStrike
            </div>
            <div className="flex gap-1.5 mb-3">
              {selectedTeam?.members.slice(0, 5).map((m) => (
                <div
                  key={m.userId}
                  className="flex-1 flex flex-col items-center gap-1 rounded-lg py-2"
                  style={{ backgroundColor: "rgba(255,85,0,0.10)", border: "1px solid rgba(255,85,0,0.20)" }}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={m.avatar ?? ""} />
                    <AvatarFallback className="text-[8px] bg-[var(--secondary)]">
                      {m.nickname.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-[9px] text-[var(--muted-foreground)] max-w-full truncate px-1">{m.nickname}</div>
                  <div className="text-[10px] font-black" style={{ color: "#FF5500" }}>
                    {formatCurrency(perPlayer)}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--muted-foreground)]">5 players × {formatCurrency(perPlayer)}</span>
              <span className="font-black text-[var(--foreground)]">{formatCurrency(championship.entryFee)}</span>
            </div>
            <p className="mt-1.5 text-[10px] text-[var(--muted-foreground)]">
              Divida o valor da inscrição em partes iguais entre os membros do time.
            </p>
          </div>

          {/* Time */}
          {selectedTeam && (
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
              {selectedTeam.avatar ? (
                <Image src={selectedTeam.avatar} alt={selectedTeam.name} width={36} height={36} className="rounded-lg" unoptimized />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF5500]/15 text-xs font-black" style={{ color: "#FF5500" }}>
                  {selectedTeam.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-bold">{selectedTeam.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{selectedTeam.members.length} membros</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => { setFlowStep("pix"); handlePixCreate(); }}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#FF5500" }}
          >
            Gerar QR Code PIX
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </Modal>

      {/* ── Modal 3: PIX Checkout Transparente ──────────────────────────── */}
      <Modal
        open={flowStep === "pix"}
        onClose={() => { if (!pixPaid) { setFlowStep("idle"); setPixData(null); } setPixError(""); }}
        title={pixPaid ? "Pagamento confirmado" : "Pagar com PIX"}
        subtitle={pixPaid ? undefined : "Escaneie o QR Code ou use o Copia e Cola."}
      >
        <div className="p-5">
          <PixCheckout
            amount={championship.entryFee}
            qrCodeBase64={pixData?.qrCodeBase64 ?? ""}
            qrCode={pixData?.qrCode ?? ""}
            expiresAt={pixData?.expiresAt ?? Date.now()}
            isPaid={pixPaid}
            loading={pixLoading}
            error={pixError}
            onRetry={() => { setPixPaid(false); handlePixCreate(); }}
            onApproved={() => { setFlowStep("idle"); setPixData(null); setPixPaid(false); router.refresh(); }}
          />
        </div>
      </Modal>
    </>
  );
}
