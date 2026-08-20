"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Check,
  ImagePlus,
  Loader2,
  Plus,
  ScrollText,
  Swords,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatCurrency, TEAM_SIZE_OPTIONS, type TeamSize } from "@/lib/utils";
import { getMapPool, isWingmanFormat } from "@/lib/maps";

// ── Metadados de apoio ────────────────────────────────────────────────────────

const TEAM_SIZE_META: Record<TeamSize, { title: string; hint: string }> = {
  1: { title: "Duelo", hint: "Wingman · 1 por lado" },
  2: { title: "Dupla", hint: "Wingman · 2 por lado" },
  3: { title: "Trio", hint: "Competitivo · 3 por lado" },
  4: { title: "Squad", hint: "Competitivo · 4 por lado" },
  5: { title: "Competitivo", hint: "Formato oficial do CS2" },
};

const BRACKET_FORMATS = [
  { value: "single_elimination", label: "Eliminacao simples", hint: "Perdeu, esta fora" },
  { value: "double_elimination", label: "Eliminacao dupla", hint: "Chave de perdedores" },
  { value: "round_robin", label: "Round robin", hint: "Todos contra todos" },
  { value: "swiss", label: "Swiss", hint: "Pareamento por desempenho" },
];

const STATUS_OPTIONS = [
  { value: "upcoming", label: "Em breve", dot: "bg-orange-400" },
  { value: "open", label: "Inscricoes abertas", dot: "bg-green-400" },
  { value: "ongoing", label: "Em andamento", dot: "bg-cyan-400" },
  { value: "finished", label: "Finalizado", dot: "bg-gray-400" },
];

const MAX_TEAMS_PRESETS = [4, 8, 16, 32, 64];

function defaultRulesFor(teamSize: number) {
  return [
    "Check-in obrigatorio 30 minutos antes da partida",
    `Times com ${teamSize} titular${teamSize > 1 ? "es" : ""} em quadra`,
    isWingmanFormat(teamSize) ? "Modo wingman - veto no pool de mapas da Workshop" : "Veto de mapas padrao CS2",
    "Fair play e respeito aos arbitros",
  ].join("\n");
}

// ── Blocos de layout ──────────────────────────────────────────────────────────

function FieldSection({
  icon: Icon,
  label,
  title,
  children,
}: {
  icon: React.ElementType;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--background)]/40 p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/8">
          <Icon className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">{label}</div>
          <h3 className="text-sm font-black tracking-tight">{title}</h3>
        </div>
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 flex flex-wrap items-baseline gap-2">
        <span className="text-sm font-semibold">{label}</span>
        {hint && <span className="text-[11px] font-normal text-[var(--muted-foreground)]">{hint}</span>}
      </label>

      {children}

      {error && (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function SelectCard({
  active,
  onClick,
  title,
  hint,
  prefix,
  ariaLabel,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint: string;
  prefix?: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-start gap-0.5 overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer",
        active
          ? "border-[var(--primary)]/50 bg-[var(--primary)]/10"
          : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 hover:bg-[var(--secondary)]"
      )}
    >
      {active && (
        <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-[var(--primary)]" aria-hidden="true" />
      )}

      {prefix}

      <span
        className={cn(
          "text-sm font-black tracking-tight transition-colors",
          active ? "text-[var(--primary)]" : "group-hover:text-[var(--foreground)]"
        )}
      >
        {title}
      </span>
      <span className="text-[10px] leading-tight text-[var(--muted-foreground)]">{hint}</span>
    </button>
  );
}

// ── Painel ────────────────────────────────────────────────────────────────────

export default function CreateTournamentPanel() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // banner
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // campos
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prizeTotal, setPrizeTotal] = useState("5000");
  const [entryFee, setEntryFee] = useState("150");
  const [maxTeams, setMaxTeams] = useState("16");
  const [teamSize, setTeamSize] = useState<TeamSize>(5);
  const [format, setFormat] = useState("single_elimination");
  const [status, setStatus] = useState("open");
  const [registrationEnds, setRegistrationEnds] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [tags, setTags] = useState("aberto,premiado");
  const [rules, setRules] = useState(() => defaultRulesFor(5));
  const [rulesTouched, setRulesTouched] = useState(false);

  const [submitAttempted, setSubmitAttempted] = useState(false);

  const parsedMaxTeams = Number(maxTeams) || 0;
  const parsedEntryFee = Number(entryFee) || 0;

  const errors = useMemo(() => {
    return {
      name: name.trim().length < 4 ? "Informe um nome com pelo menos 4 caracteres." : null,
      description:
        description.trim().length < 16 ? "Descreva o campeonato com pelo menos 16 caracteres." : null,
      maxTeams: parsedMaxTeams < 2 ? "O campeonato precisa de pelo menos 2 times." : null,
      dates:
        startsAt && endsAt && new Date(startsAt) > new Date(endsAt)
          ? "A data de inicio precisa vir antes da data de fim."
          : null,
    };
  }, [name, description, parsedMaxTeams, startsAt, endsAt]);

  const hasErrors = Object.values(errors).some(Boolean);

  // Custo por jogador ajuda o admin a calibrar a taxa antes de publicar.
  const perPlayerFee = parsedEntryFee > 0 ? Math.ceil(parsedEntryFee / teamSize) : 0;
  const wingmanSelected = isWingmanFormat(teamSize);
  const selectedMapPool = getMapPool(teamSize);
  const totalPlayers = parsedMaxTeams * teamSize;

  function applyTeamSize(next: TeamSize) {
    setTeamSize(next);

    // So sobrescreve as regras enquanto o admin nao editou o texto na mao.
    if (!rulesTouched) {
      setRules(defaultRulesFor(next));
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setBannerPreview(URL.createObjectURL(file));
    setBannerUrl(null);
    setIsUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch("/api/admin/upload-banner", {
        method: "POST",
        body: form,
      });

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        setUploadError(payload.error ?? "Falha no upload da imagem.");
        setBannerPreview(null);
        return;
      }

      setBannerUrl(payload.url);
    } catch {
      setUploadError("Erro de conexão ao enviar imagem.");
      setBannerPreview(null);
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeBanner() {
    setBannerPreview(null);
    setBannerUrl(null);
    setUploadError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setSubmitAttempted(true);

    if (hasErrors) {
      setFeedback({ type: "error", message: "Revise os campos destacados antes de publicar." });
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/admin/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          prizeTotal: Number(prizeTotal),
          entryFee: Number(entryFee),
          maxTeams: Number(maxTeams),
          teamSize,
          format,
          status,
          registrationEnds: registrationEnds ? new Date(registrationEnds).toISOString() : null,
          registrationStarts: null,
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          endsAt: endsAt ? new Date(endsAt).toISOString() : null,
          rules: rules.split("\n").map((v) => v.trim()).filter(Boolean),
          tags: tags.split(",").map((v) => v.trim()).filter(Boolean),
          checkInRequired: true,
          checkInWindowMins: 30,
          region: "BR",
          featured: false,
          bannerUrl: bannerUrl ?? null,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFeedback({ type: "error", message: payload.error ?? "Não foi possível cadastrar o campeonato." });
        return;
      }

      setFeedback({ type: "success", message: "Campeonato cadastrado com sucesso." });
      setName("");
      setDescription("");
      setBannerPreview(null);
      setBannerUrl(null);
      setSubmitAttempted(false);
      router.refresh();
    });
  }

  const showError = (key: keyof typeof errors) => (submitAttempted ? errors[key] : null);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ── Resumo ao vivo — o admin confere o formato antes de publicar ── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-4 py-3">
        <span className="rounded-md bg-[var(--primary)]/15 px-2 py-1 font-mono text-sm font-black text-[var(--primary)]">
          {teamSize}x{teamSize}
        </span>
        <span className="text-sm font-bold">{name.trim() || "Campeonato sem nome"}</span>
        <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--muted-foreground)]">
          <span>
            <strong className="font-mono text-[var(--foreground)]">{parsedMaxTeams || 0}</strong> times
          </span>
          <span aria-hidden="true">/</span>
          <span>
            ate <strong className="font-mono text-[var(--foreground)]">{totalPlayers || 0}</strong> jogadores
          </span>
          <span aria-hidden="true">/</span>
          <span>{BRACKET_FORMATS.find((f) => f.value === format)?.label}</span>
          <span aria-hidden="true">/</span>
          <span className="text-[#f5c842]">{formatCurrency(Number(prizeTotal) || 0)}</span>
        </span>
      </div>

      {/* ── 1. Identidade ── */}
      <FieldSection icon={Trophy} label="Etapa 1" title="Identidade do campeonato">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-semibold">Banner</span>
              <span className="text-[11px] font-normal text-[var(--muted-foreground)]">
                JPG, PNG ou WebP · max 5 MB · recomendado 1200×400px
              </span>
            </label>

            {bannerPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-[var(--border)]">
                <Image
                  src={bannerPreview}
                  alt="Preview do banner"
                  width={1200}
                  height={400}
                  className="h-36 w-full object-cover"
                  unoptimized
                />

                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 text-sm font-semibold text-white">
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Enviando...
                  </div>
                )}

                {!isUploading && bannerUrl && (
                  <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/20 px-2.5 py-1 text-xs font-semibold text-green-300">
                    <Check className="h-3 w-3" aria-hidden="true" />
                    Salvo
                  </div>
                )}

                <button
                  type="button"
                  onClick={removeBanner}
                  className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition-colors hover:bg-black/80 cursor-pointer"
                  aria-label="Remover banner"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--secondary)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <ImagePlus className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-medium">Selecionar banner</span>
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />

            {uploadError && <p className="mt-1.5 text-xs text-red-300">{uploadError}</p>}
          </div>

          <Field label="Nome do campeonato" htmlFor="tournament-name" error={showError("name")}>
            <Input
              id="tournament-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: BlueStrike Open #13"
              aria-invalid={Boolean(showError("name"))}
              aria-describedby={showError("name") ? "tournament-name-error" : undefined}
            />
          </Field>

          <Field
            label="Descricao"
            hint="Aparece na pagina publica do campeonato"
            htmlFor="tournament-description"
            error={showError("description")}
          >
            <Textarea
              id="tournament-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique proposta, publico e nivel do campeonato."
              className="min-h-24"
              aria-invalid={Boolean(showError("description"))}
              aria-describedby={showError("description") ? "tournament-description-error" : undefined}
            />
          </Field>
        </div>
      </FieldSection>

      {/* ── 2. Formato ── */}
      <FieldSection icon={Swords} label="Etapa 2" title="Formato de disputa">
        <div className="space-y-5">
          <div>
            <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-semibold">Jogadores por time</span>
              <span className="text-[11px] font-normal text-[var(--muted-foreground)]">
                Define o roster minimo exigido na inscricao
              </span>
            </div>

            <div role="radiogroup" aria-label="Jogadores por time" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {TEAM_SIZE_OPTIONS.map((size) => (
                <SelectCard
                  key={size}
                  active={teamSize === size}
                  onClick={() => applyTeamSize(size)}
                  ariaLabel={`Formato ${size} contra ${size}`}
                  prefix={
                    <span
                      className={cn(
                        "font-mono text-lg font-black leading-none",
                        teamSize === size ? "text-[var(--primary)]" : "text-[var(--foreground)]"
                      )}
                    >
                      {size}x{size}
                    </span>
                  }
                  title={TEAM_SIZE_META[size].title}
                  hint={TEAM_SIZE_META[size].hint}
                />
              ))}
            </div>

            {/* O formato decide o modo de jogo, o mappool do veto e ate qual
                servidor e clonado — vale o admin ver isso antes de publicar. */}
            <div
              className={cn(
                "mt-3 rounded-lg border px-3 py-2.5",
                wingmanSelected
                  ? "border-orange-500/25 bg-orange-500/5"
                  : "border-[var(--primary)]/20 bg-[var(--primary)]/5"
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest",
                    wingmanSelected
                      ? "bg-orange-500/15 text-orange-300"
                      : "bg-[var(--primary)]/15 text-[var(--primary)]"
                  )}
                >
                  {wingmanSelected ? "Modo wingman" : "Modo competitivo"}
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  {wingmanSelected
                    ? "Servidor sobe em wingman e o veto usa o pool da Workshop."
                    : "Servidor competitivo padrao, com o pool oficial de mapas."}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedMapPool.map((map) => (
                  <span
                    key={map.name}
                    className="rounded border border-[var(--border)] bg-[var(--card)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)]"
                  >
                    {map.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-sm font-semibold">Chaveamento</div>
            <div role="radiogroup" aria-label="Chaveamento" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {BRACKET_FORMATS.map((option) => (
                <SelectCard
                  key={option.value}
                  active={format === option.value}
                  onClick={() => setFormat(option.value)}
                  ariaLabel={option.label}
                  title={option.label}
                  hint={option.hint}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Maximo de times"
              hint="Potencias de 2 evitam byes na chave"
              htmlFor="tournament-max-teams"
              error={showError("maxTeams")}
            >
              <div className="mb-2 flex flex-wrap gap-1.5">
                {MAX_TEAMS_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={parsedMaxTeams === preset}
                    onClick={() => setMaxTeams(String(preset))}
                    className={cn(
                      "min-h-[32px] rounded-md border px-3 py-1 font-mono text-xs font-bold transition-colors cursor-pointer",
                      parsedMaxTeams === preset
                        ? "border-[var(--primary)]/50 bg-[var(--primary)]/12 text-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/30 hover:text-[var(--foreground)]"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <Input
                id="tournament-max-teams"
                type="number"
                min={2}
                max={128}
                value={maxTeams}
                onChange={(e) => setMaxTeams(e.target.value)}
                aria-invalid={Boolean(showError("maxTeams"))}
                aria-describedby={showError("maxTeams") ? "tournament-max-teams-error" : undefined}
              />
            </Field>

            <Field label="Status inicial" htmlFor="tournament-status">
              <div role="radiogroup" aria-label="Status inicial" className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={status === option.value}
                    onClick={() => setStatus(option.value)}
                    className={cn(
                      "flex min-h-[38px] items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer",
                      status === option.value
                        ? "border-[var(--primary)]/50 bg-[var(--primary)]/10 text-[var(--foreground)]"
                        : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/30"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", option.dot)} aria-hidden="true" />
                    {option.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </div>
      </FieldSection>

      {/* ── 3. Valores ── */}
      <FieldSection icon={Wallet} label="Etapa 3" title="Premiacao e inscricao">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Premiacao total" hint="Em reais" htmlFor="tournament-prize">
            <Input
              id="tournament-prize"
              type="number"
              min={0}
              value={prizeTotal}
              onChange={(e) => setPrizeTotal(e.target.value)}
            />
          </Field>

          <Field
            label="Inscricao via PIX"
            hint={perPlayerFee > 0 ? `${formatCurrency(perPlayerFee)} por jogador` : "Gratuito"}
            htmlFor="tournament-entry-fee"
          >
            <Input
              id="tournament-entry-fee"
              type="number"
              min={0}
              value={entryFee}
              onChange={(e) => setEntryFee(e.target.value)}
            />
          </Field>
        </div>
      </FieldSection>

      {/* ── 4. Agenda ── */}
      <FieldSection icon={CalendarClock} label="Etapa 4" title="Agenda">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Inscricoes ate" htmlFor="tournament-registration-ends">
            <Input
              id="tournament-registration-ends"
              type="datetime-local"
              value={registrationEnds}
              onChange={(e) => setRegistrationEnds(e.target.value)}
            />
          </Field>

          <Field label="Inicio" htmlFor="tournament-starts-at" error={showError("dates")}>
            <Input
              id="tournament-starts-at"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              aria-invalid={Boolean(showError("dates"))}
              aria-describedby={showError("dates") ? "tournament-starts-at-error" : undefined}
            />
          </Field>

          <Field label="Fim" htmlFor="tournament-ends-at">
            <Input
              id="tournament-ends-at"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </Field>
        </div>
      </FieldSection>

      {/* ── 5. Regras ── */}
      <FieldSection icon={ScrollText} label="Etapa 5" title="Regras e tags">
        <div className="space-y-4">
          <Field label="Regras" hint="Uma por linha" htmlFor="tournament-rules">
            <Textarea
              id="tournament-rules"
              value={rules}
              onChange={(e) => {
                setRules(e.target.value);
                setRulesTouched(true);
              }}
              className="min-h-28"
            />
          </Field>

          <Field label="Tags" hint="Separadas por virgula" htmlFor="tournament-tags">
            <Input
              id="tournament-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="aberto,premiado,hub"
            />
          </Field>
        </div>
      </FieldSection>

      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            feedback.type === "success"
              ? "border-green-500/20 bg-green-500/10 text-green-200"
              : "border-red-500/20 bg-red-500/10 text-red-200"
          )}
        >
          {feedback.message}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          Admins sao definidos em <code className="font-mono">public.profiles.is_admin</code>
        </div>

        <Button type="submit" variant="gradient" className="gap-2" disabled={isPending || isUploading}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="h-4 w-4" aria-hidden="true" />
          )}
          {isPending
            ? "Salvando..."
            : isUploading
              ? "Aguardando upload..."
              : `Publicar campeonato ${teamSize}x${teamSize}`}
        </Button>
      </div>
    </form>
  );
}
