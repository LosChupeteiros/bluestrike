import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
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
