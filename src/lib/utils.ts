import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

/** Formatos de disputa aceitos pela plataforma. */
export const TEAM_SIZE_OPTIONS = [1, 2, 3, 4, 5] as const;

export type TeamSize = (typeof TEAM_SIZE_OPTIONS)[number];

/** 5 -> "5x5". Usado em badge, card e texto de inscricao. */
export function formatTeamSize(teamSize: number | null | undefined): string {
  const size = normalizeTeamSize(teamSize);
  return `${size}x${size}`;
}

/** Protege contra valores fora da faixa vindos do banco ou de payload antigo. */
export function normalizeTeamSize(teamSize: number | null | undefined): TeamSize {
  const size = Math.trunc(Number(teamSize));

  if (!Number.isFinite(size) || size < 1) return 5;
  if (size > 5) return 5;

  return size as TeamSize;
}

/** Rotulo curto do formato, para o admin e para a pagina do campeonato. */
export function teamSizeLabel(teamSize: number | null | undefined): string {
  const size = normalizeTeamSize(teamSize);

  if (size === 1) return "1x1 · Duelo";
  if (size === 2) return "2x2 · Dupla";
  if (size === 5) return "5x5 · Competitivo";

  return `${size}x${size} · Squad`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "open":
      return "text-green-400 bg-green-400/10 border-green-400/20";
    case "ongoing":
      return "text-cyan-400 bg-cyan-400/10 border-cyan-400/20";
    case "finished":
      return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    case "upcoming":
      return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    default:
      return "text-gray-400 bg-gray-400/10 border-gray-400/20";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "open":
      return "Inscrições Abertas";
    case "ongoing":
      return "Em Andamento";
    case "finished":
      return "Finalizado";
    case "upcoming":
      return "Em Breve";
    default:
      return status;
  }
}
