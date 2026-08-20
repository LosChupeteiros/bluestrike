import type { ElementType, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Radio } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, description, actions, className }: { eyebrow: string; title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn("flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="max-w-3xl"><div className="bs-kicker">{eyebrow}</div><h1 className="mt-2 text-4xl font-bold tracking-[-0.045em] sm:text-5xl">{title}</h1>{description && <div className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">{description}</div>}</div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}

export function MetricCard({ icon: Icon, value, label, detail, positive = false }: { icon: ElementType; value: ReactNode; label: string; detail?: ReactNode; positive?: boolean }) {
  return (
    <div className="bs-panel flex items-center gap-4 p-5"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]"><Icon className="h-5 w-5" /></div><div><div className={cn("font-mono text-2xl font-bold tracking-[-0.03em]", positive && "text-emerald-700")}>{value}</div><div className="mt-0.5 text-xs text-[var(--muted-foreground)]">{label}</div>{detail && <div className={cn("mt-1 text-[10px] text-[var(--muted-foreground)]", positive && "text-emerald-700")}>{detail}</div>}</div></div>
  );
}

export function StatusBadge({ label, variant = "secondary", live = false }: { label: string; variant?: BadgeProps["variant"]; live?: boolean }) {
  return <Badge variant={variant}>{live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}{label}</Badge>;
}

export function PlayerIdentity({ name, avatarUrl, href, meta }: { name: string; avatarUrl?: string | null; href?: string; meta?: ReactNode }) {
  const content = <><div className="relative h-9 w-9 overflow-hidden rounded-full bg-[var(--accent)]">{avatarUrl ? <Image src={avatarUrl} alt={name} fill sizes="36px" className="object-cover" unoptimized /> : <span className="flex h-full items-center justify-center text-xs font-bold text-[var(--primary)]">{name.slice(0, 1).toUpperCase()}</span>}</div><div className="min-w-0"><div className="truncate text-sm font-semibold">{name}</div>{meta && <div className="text-[10px] text-[var(--muted-foreground)]">{meta}</div>}</div></>;
  return href ? <Link href={href} className="flex min-w-0 items-center gap-3 hover:text-[var(--primary)]">{content}</Link> : <div className="flex min-w-0 items-center gap-3">{content}</div>;
}

export function TeamIdentity({ name, tag, logoUrl, href, meta }: { name: string; tag: string; logoUrl?: string | null; href?: string; meta?: ReactNode }) {
  const content = <><div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--accent)] text-xs font-bold text-[var(--primary)]">{logoUrl ? <Image src={logoUrl} alt={name} fill sizes="40px" className="object-contain p-1" unoptimized /> : tag}</div><div className="min-w-0"><div className="truncate text-sm font-semibold">{name}</div>{meta && <div className="text-[10px] text-[var(--muted-foreground)]">{meta}</div>}</div></>;
  return href ? <Link href={href} className="flex min-w-0 items-center gap-3 hover:text-[var(--primary)]">{content}</Link> : <div className="flex min-w-0 items-center gap-3">{content}</div>;
}

export function EloDisplay({ value, source = "bluestrike", size = "md", label }: { value: number | string; source?: "bluestrike" | "faceit"; size?: "sm" | "md" | "lg"; label?: string }) {
  return <div><div className={cn("font-mono font-bold tracking-[-0.04em]", source === "faceit" ? "text-[#e65300]" : "text-[var(--primary)]", size === "sm" ? "text-base" : size === "lg" ? "text-4xl" : "text-2xl")}>{typeof value === "number" ? value.toLocaleString("pt-BR") : value}</div>{label && <div className="mt-1 text-[10px] text-[var(--muted-foreground)]">{label}</div>}</div>;
}

export function FilterToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("bs-panel flex flex-col gap-3 p-4 lg:flex-row lg:items-center", className)}>{children}</div>;
}

export function SectionHeader({ title, eyebrow, detail, href, linkLabel = "Ver todos" }: { title: string; eyebrow?: string; detail?: ReactNode; href?: string; linkLabel?: string }) {
  return <div className="mb-5 flex items-end justify-between gap-4"><div>{eyebrow && <div className="bs-kicker">{eyebrow}</div>}<h2 className={cn("text-2xl font-bold tracking-[-0.03em]", eyebrow && "mt-2")}>{title}</h2>{detail && <div className="mt-1 text-sm text-[var(--muted-foreground)]">{detail}</div>}</div>{href && <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">{linkLabel}<ArrowRight className="h-4 w-4" /></Link>}</div>;
}

export function ProgressCard({ label, value, total, children }: { label: string; value: number; total: number; children?: ReactNode }) {
  const percent = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return <div className="bs-panel p-6"><div className="bs-kicker">{label}</div><div className="mt-4 font-mono text-3xl font-bold">{value} <span className="text-lg text-[var(--muted-foreground)]">de {total}</span></div><Progress value={percent} className="mt-4 h-2" />{children && <div className="mt-5">{children}</div>}</div>;
}

export function LiveIndicator({ label = "Ao vivo" }: { label?: string }) {
  return <span className="inline-flex items-center gap-2 text-xs font-semibold text-red-700"><Radio className="h-3.5 w-3.5" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />{label}</span>;
}
