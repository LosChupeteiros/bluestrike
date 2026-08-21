"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CircleDollarSign,
  ImagePlus,
  Loader2,
  Map as MapIcon,
  Plus,
  Server,
  Shield,
  Swords,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TeamModeSelector from "@/components/team/team-mode-selector";
import { getTeamMode, type TeamMode } from "@/lib/team-modes";
import { getMapPoolForMode } from "@/lib/maps";
import { formatCurrency } from "@/lib/utils";

// Eliminação simples fecha certinho com potências de 2.
const BRACKET_SIZES = [4, 8, 16, 32, 64];

const STATUS_OPTIONS = [
  { value: "upcoming", label: "Em breve", hint: "Fica visível, mas sem inscrição" },
  { value: "open", label: "Inscrições abertas", hint: "Times já podem entrar" },
  { value: "ongoing", label: "Em andamento", hint: "Gera a chave imediatamente" },
  { value: "finished", label: "Finalizado", hint: "Somente histórico" },
] as const;

const FORMAT_OPTIONS = [
  { value: "single_elimination", label: "Eliminação simples" },
  { value: "double_elimination", label: "Eliminação dupla" },
  { value: "round_robin", label: "Round robin" },
  { value: "swiss", label: "Swiss" },
] as const;

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function FieldLabel({
  children,
  required,
  hint,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold">
      {children}
      {required && <span className="ml-1 text-red-400">*</span>}
      {hint && (
        <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">{hint}</span>
      )}
    </label>
  );
}

function Section({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: typeof Trophy;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <div className="mb-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {eyebrow}
        </div>
        <h3 className="text-xl font-black tracking-tight">{title}</h3>
        {description && (
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function BoTypePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: 1 | 3;
  onChange: (value: 1 | 3) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)]/30 p-3">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        {label}
      </span>
      <div role="radiogroup" aria-label={label} className="flex gap-2">
        {([1, 3] as const).map((option) => {
          const isActive = option === value;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(option)}
              className={`flex min-h-11 flex-1 flex-col items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50 ${
                isActive
                  ? "border-[var(--primary)]/55 bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/35 hover:text-[var(--foreground)]"
              }`}
            >
              <span className="font-mono text-sm font-black leading-none">BO{option}</span>
              <span className="mt-1 text-[9px] uppercase tracking-[0.1em]">
                {option === 1 ? "1 mapa" : "3 mapas"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CreateTournamentPanel() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // banner state
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // form fields
  const [teamMode, setTeamMode] = useState<TeamMode>("5v5");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prizeTotal, setPrizeTotal] = useState("5000");
  const [entryFee, setEntryFee] = useState("150");
  const [maxTeams, setMaxTeams] = useState("16");
  const [format, setFormat] = useState<string>("single_elimination");
  const [boType, setBoType] = useState<1 | 3>(1);
  const [finalBoType, setFinalBoType] = useState<1 | 3>(3);
  const [status, setStatus] = useState<string>("open");
  const [registrationEnds, setRegistrationEnds] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [featured, setFeatured] = useState(false);
  const [tags, setTags] = useState("aberto,premiado");
  const [rules, setRules] = useState(
    "Check-in obrigatorio\nFair play e respeito aos arbitros\nPrint de bug ou trapaca deve ser enviado a arbitragem"
  );

  const modeConfig = getTeamMode(teamMode);
  const mapPool = useMemo(() => getMapPoolForMode(teamMode), [teamMode]);

  const maxTeamsNumber = Number(maxTeams) || 0;
  const prizeNumber = Number(prizeTotal) || 0;
  const entryNumber = Number(entryFee) || 0;
  const perPlayer = entryNumber > 0 ? Math.ceil(entryNumber / modeConfig.playersPerTeam) : 0;
  const grossRevenue = entryNumber * maxTeamsNumber;
  const margin = grossRevenue - prizeNumber;

  const nameValid = name.trim().length >= 4;
  const descriptionValid = description.trim().length >= 16;
  const datesValid =
    !startsAt || !endsAt || Date.parse(startsAt) <= Date.parse(endsAt);
  const canSubmit = nameValid && descriptionValid && datesValid && maxTeamsNumber >= 2;

  // Ao mudar a modalidade, sugere as regras de elenco daquele formato.
  function handleModeChange(nextMode: TeamMode) {
    setTeamMode(nextMode);
    const next = getTeamMode(nextMode);
    setRules((current) => {
      const withoutRoster = current
        .split("\n")
        .filter((line) => !/^Times com \d+ (titular|titulares)/i.test(line.trim()))
        .join("\n")
        .trim();
      const rosterRule = `Times com ${next.playersPerTeam} ${next.playersPerTeam === 1 ? "titular" : "titulares"}`;
      return withoutRoster ? `${rosterRule}\n${withoutRoster}` : rosterRule;
    });
  }

  function applyDatePreset(hoursFromNow: number) {
    const start = new Date(Date.now() + hoursFromNow * 3600_000);
    const regEnd = new Date(start.getTime() - 30 * 60_000);
    const end = new Date(start.getTime() + 5 * 3600_000);
    setRegistrationEnds(toLocalInputValue(regEnd));
    setStartsAt(toLocalInputValue(start));
    setEndsAt(toLocalInputValue(end));
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
    if (!canSubmit) return;

    startTransition(async () => {
      const response = await fetch("/api/admin/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          teamMode,
          prizeTotal: prizeNumber,
          entryFee: entryNumber,
          maxTeams: maxTeamsNumber,
          format,
          boType,
          finalBoType,
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
          featured,
          bannerUrl: bannerUrl ?? null,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFeedback({ type: "error", message: payload.error ?? "Não foi possível cadastrar o campeonato." });
        return;
      }

      setFeedback({
        type: "success",
        message: `Campeonato de ${modeConfig.label} cadastrado com sucesso.`,
      });
      setName("");
      setDescription("");
      setBannerPreview(null);
      setBannerUrl(null);
      router.refresh();
    });
  }

  return (
    <section className="bs-form-card p-6 sm:p-8">
      <div className="mb-7">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
          <Shield className="h-4 w-4" />
          Área administrativa
        </div>
        <h2 className="text-2xl font-black tracking-tight">Cadastrar campeonato</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          A modalidade define mapa pool, servidor clonado e tamanho do elenco. O resto do fluxo
          (PIX, chave e MatchZy) é montado automaticamente a partir daqui.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="space-y-5">
          {/* ── 1. Modalidade ── */}
          <Section
            icon={Swords}
            eyebrow="Passo 1"
            title="Modalidade"
            description="Escolha o formato disputado. Cada um tem mapa pool e servidor dedicados."
          >
            <TeamModeSelector value={teamMode} onChange={handleModeChange} />

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)]/40 p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  <Users className="h-3 w-3" aria-hidden="true" /> Em quadra
                </div>
                <div className="mt-1.5 font-mono text-lg font-black text-[var(--foreground)]">
                  {modeConfig.playersPerTeam}v{modeConfig.playersPerTeam}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)]/40 p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  <Server className="h-3 w-3" aria-hidden="true" /> Servidor
                </div>
                <div className="mt-1.5 text-sm font-black text-[var(--foreground)]">
                  {modeConfig.wingman ? "Wingman" : modeConfig.gameModeLabel}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)]/40 p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  <MapIcon className="h-3 w-3" aria-hidden="true" /> Mapas
                </div>
                <div className="mt-1.5 text-sm font-black text-[var(--foreground)]">
                  {mapPool.length} no veto
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {mapPool.map((map) => (
                <span
                  key={map.name}
                  className="rounded-md border border-[var(--border)] bg-black/25 px-2 py-1 text-[10px] font-bold text-[var(--muted-foreground)]"
                >
                  {map.label}
                </span>
              ))}
            </div>

            {modeConfig.fixedSides && (
              <p className="mt-3 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-3 py-2 text-xs text-[var(--primary)]">
                No 1x1 não existe faca: os lados já saem definidos (time 1 começa CT) e o colete
                é liberado no servidor.
              </p>
            )}
          </Section>

          {/* ── 2. Identidade ── */}
          <Section
            icon={Trophy}
            eyebrow="Passo 2"
            title="Identidade do campeonato"
            description="Como o torneio aparece no catálogo e na página de detalhe."
          >
            <div className="space-y-4">
              <div>
                <FieldLabel hint="JPG, PNG ou WebP · max 5 MB · 1200×400px">
                  Banner
                </FieldLabel>

                {bannerPreview ? (
                  <div className="relative overflow-hidden rounded-xl border border-[var(--border)]">
                    <Image
                      src={bannerPreview}
                      alt="Preview do banner"
                      width={1200}
                      height={400}
                      className="h-40 w-full object-cover"
                      unoptimized
                    />

                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 text-sm font-semibold text-white">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Enviando...
                      </div>
                    )}

                    {!isUploading && bannerUrl && (
                      <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/20 px-2.5 py-1 text-xs font-semibold text-green-300">
                        <Check className="h-3 w-3" /> Salvo
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={removeBanner}
                      className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition-colors hover:bg-black/80"
                      aria-label="Remover banner"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--secondary)]/40 text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                  >
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-sm font-medium">Clique para selecionar o banner</span>
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

              <div>
                <FieldLabel htmlFor="tournament-name" required>Nome do campeonato</FieldLabel>
                <Input
                  id="tournament-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`Ex.: BlueStrike ${modeConfig.label} Open #01`}
                />
                {name.length > 0 && !nameValid && (
                  <p className="mt-1.5 text-xs text-red-300">Use pelo menos 4 caracteres.</p>
                )}
              </div>

              <div>
                <FieldLabel htmlFor="tournament-description" required>Descrição</FieldLabel>
                <Textarea
                  id="tournament-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique proposta, público e nível do campeonato."
                  className="min-h-28"
                />
                {description.length > 0 && !descriptionValid && (
                  <p className="mt-1.5 text-xs text-red-300">
                    Descreva melhor — mínimo de 16 caracteres.
                  </p>
                )}
              </div>

              <div>
                <FieldLabel htmlFor="tournament-tags" hint="separadas por vírgula">Tags</FieldLabel>
                <Input
                  id="tournament-tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="aberto,premiado,hub"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/30 px-4 py-3">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="text-sm">
                  <span className="font-semibold">Destacar na home</span>
                  <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                    Aparece primeiro no catálogo
                  </span>
                </span>
              </label>
            </div>
          </Section>

          {/* ── 3. Formato e vagas ── */}
          <Section
            icon={Users}
            eyebrow="Passo 3"
            title="Formato e vagas"
            description="Eliminação simples fecha sem bye quando o número de vagas é potência de 2."
          >
            <div className="space-y-4">
              <div>
                <FieldLabel htmlFor="tournament-max-teams" required>Máximo de times</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {BRACKET_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setMaxTeams(String(size))}
                      className={`min-h-11 min-w-14 rounded-xl border px-3 text-sm font-black transition-colors ${
                        maxTeamsNumber === size
                          ? "border-[var(--primary)]/55 bg-[var(--primary)]/10 text-[var(--primary)]"
                          : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/35 hover:text-[var(--foreground)]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                  <Input
                    id="tournament-max-teams"
                    type="number"
                    min={2}
                    max={128}
                    value={maxTeams}
                    onChange={(e) => setMaxTeams(e.target.value)}
                    className="h-11 w-24"
                    aria-label="Máximo de times personalizado"
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  {maxTeamsNumber >= 2
                    ? `${maxTeamsNumber} times · ${maxTeamsNumber * modeConfig.playersPerTeam} jogadores no total`
                    : "Informe pelo menos 2 times."}
                </p>
              </div>

              <div>
                <FieldLabel>Formato das partidas</FieldLabel>
                <div className="grid gap-3 sm:grid-cols-2">
                  <BoTypePicker
                    label="Rodadas normais"
                    value={boType}
                    onChange={setBoType}
                  />
                  <BoTypePicker
                    label="Grande final"
                    value={finalBoType}
                    onChange={setFinalBoType}
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  {boType === 1 ? "Mata-mata em mapa único" : "Mata-mata em melhor de 3"} ·{" "}
                  final em {finalBoType === 1 ? "mapa único" : "melhor de 3"}.
                  {(boType === 3 || finalBoType === 3) && modeConfig.mapPool !== "competitive"
                    ? " Séries de vários mapas em modalidade de workshop trocam de mapa dentro da mesma partida."
                    : ""}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="tournament-format">Chaveamento</FieldLabel>
                  <select
                    id="tournament-format"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="flex h-11 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm"
                  >
                    {FORMAT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel htmlFor="tournament-status">Status inicial</FieldLabel>
                  <select
                    id="tournament-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="flex h-11 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                    {STATUS_OPTIONS.find((o) => o.value === status)?.hint}
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* ── 4. Premiação ── */}
          <Section
            icon={CircleDollarSign}
            eyebrow="Passo 4"
            title="Premiação e inscrição"
            description="O valor por jogador é calculado com base na modalidade."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="tournament-prize">Premiação total (R$)</FieldLabel>
                <Input
                  id="tournament-prize"
                  type="number"
                  min={0}
                  value={prizeTotal}
                  onChange={(e) => setPrizeTotal(e.target.value)}
                />
              </div>

              <div>
                <FieldLabel htmlFor="tournament-fee">Inscrição por time (R$)</FieldLabel>
                <Input
                  id="tournament-fee"
                  type="number"
                  min={0}
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                />
                <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                  {perPlayer > 0
                    ? `${formatCurrency(perPlayer)} por jogador (${modeConfig.playersPerTeam} em quadra)`
                    : "Campeonato gratuito"}
                </p>
              </div>
            </div>

            {entryNumber > 0 && maxTeamsNumber >= 2 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)]/40 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                    Arrecadação cheia
                  </div>
                  <div className="mt-1 font-mono text-base font-black">{formatCurrency(grossRevenue)}</div>
                </div>
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-yellow-400/70">
                    Premiação
                  </div>
                  <div className="mt-1 font-mono text-base font-black text-yellow-400">
                    {formatCurrency(prizeNumber)}
                  </div>
                </div>
                <div
                  className={`rounded-xl border p-3 ${
                    margin >= 0
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-red-500/25 bg-red-500/8"
                  }`}
                >
                  <div
                    className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                      margin >= 0 ? "text-emerald-400/70" : "text-red-400/80"
                    }`}
                  >
                    {margin >= 0 ? "Margem" : "Prejuízo"}
                  </div>
                  <div
                    className={`mt-1 font-mono text-base font-black ${
                      margin >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {formatCurrency(Math.abs(margin))}
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* ── 5. Datas ── */}
          <Section
            icon={CalendarDays}
            eyebrow="Passo 5"
            title="Agenda"
            description="O campeonato entra em andamento sozinho na hora do início — ou antes, pelo botão de iniciar na página dele."
          >
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                { label: "Em 2h", hours: 2 },
                { label: "Em 6h", hours: 6 },
                { label: "Amanhã", hours: 24 },
                { label: "Em 7 dias", hours: 24 * 7 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyDatePreset(preset.hours)}
                  className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-bold text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <FieldLabel htmlFor="tournament-reg-ends">Inscrições até</FieldLabel>
                <Input
                  id="tournament-reg-ends"
                  type="datetime-local"
                  value={registrationEnds}
                  onChange={(e) => setRegistrationEnds(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="tournament-starts">Início</FieldLabel>
                <Input
                  id="tournament-starts"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="tournament-ends">Fim</FieldLabel>
                <Input
                  id="tournament-ends"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>

            {!datesValid && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-red-300">
                <AlertTriangle className="h-3.5 w-3.5" /> A data de fim está antes do início.
              </p>
            )}
          </Section>

          {/* ── 6. Regras ── */}
          <Section
            icon={Shield}
            eyebrow="Passo 6"
            title="Regras"
            description="Uma regra por linha. Aparecem na aba Regras do campeonato."
          >
            <Textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="min-h-32 font-mono text-xs"
            />
          </Section>
        </div>

        {/* ── Resumo sticky ── */}
        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="rounded-2xl border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--primary)]/5 p-5">
            <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">
              <Trophy className="h-3.5 w-3.5" /> Resumo
            </div>

            <div className="mb-4 overflow-hidden rounded-xl border border-[var(--border)] bg-black/25">
              {bannerPreview ? (
                <Image
                  src={bannerPreview}
                  alt=""
                  width={600}
                  height={200}
                  className="h-20 w-full object-cover opacity-80"
                  unoptimized
                />
              ) : (
                <div className="h-20 w-full bg-gradient-to-br from-[#081522] via-[#070d15] to-black" />
              )}
              <div className="p-3">
                <p className="truncate text-sm font-black">{name || "Sem nome ainda"}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  BlueStrike E-Sports
                </p>
              </div>
            </div>

            <dl className="space-y-2.5 text-sm">
              {[
                { label: "Modalidade", value: `${modeConfig.label} · ${modeConfig.gameModeLabel}` },
                { label: "Vagas", value: `${maxTeamsNumber || "—"} times` },
                { label: "Série", value: `BO${boType} · final BO${finalBoType}` },
                { label: "Premiação", value: formatCurrency(prizeNumber) },
                { label: "Inscrição", value: entryNumber > 0 ? formatCurrency(entryNumber) : "Gratuito" },
                { label: "Por jogador", value: perPlayer > 0 ? formatCurrency(perPlayer) : "—" },
                { label: "Mapa pool", value: `${mapPool.length} mapas` },
                { label: "Status", value: STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--muted-foreground)]">{row.label}</dt>
                  <dd className="truncate text-right font-semibold">{row.value}</dd>
                </div>
              ))}
            </dl>

            <Button
              type="submit"
              variant="gradient"
              className="mt-5 w-full gap-2"
              disabled={!canSubmit || isPending || isUploading}
            >
              <Plus className="h-4 w-4" />
              {isPending ? "Salvando..." : isUploading ? "Aguardando upload..." : "Criar campeonato"}
            </Button>

            {!canSubmit && (
              <p className="mt-2.5 text-center text-[11px] text-[var(--muted-foreground)]">
                {!nameValid
                  ? "Informe o nome do campeonato."
                  : !descriptionValid
                    ? "Escreva a descrição."
                    : !datesValid
                      ? "Corrija as datas."
                      : "Informe pelo menos 2 vagas."}
              </p>
            )}

            {feedback && (
              <div
                className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                  feedback.type === "success"
                    ? "border-green-500/20 bg-green-500/10 text-green-200"
                    : "border-red-500/20 bg-red-500/10 text-red-200"
                }`}
                role="status"
                aria-live="polite"
              >
                {feedback.message}
              </div>
            )}
          </div>

          <p className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/30 px-4 py-3 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
            Admins são definidos no Supabase alterando{" "}
            <code className="font-mono text-[var(--foreground)]">public.profiles.is_admin</code>{" "}
            para <code className="font-mono text-[var(--foreground)]">true</code>.
          </p>
        </aside>
      </form>
    </section>
  );
}
