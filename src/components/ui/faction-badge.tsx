import { cn } from "@/lib/utils";

/**
 * Selo de lado (CT / TR).
 *
 * Substitui os logos em `/assets/sides/Ct_logo.webp` e `Tr_logo.webp`, que eram
 * referenciados em quatro lugares e **nunca existiram no repositório** — a
 * pasta `public/assets/sides/` não existe, então todos renderizavam quebrado.
 *
 * A versão em texto não depende de asset, funciona em qualquer tamanho e segue
 * as cores que já identificavam cada lado no resto da plataforma.
 */

const SIDE_STYLES = {
  ct: {
    label: "CT",
    text: "text-[#7B96FF]",
    ring: "ring-[#7B96FF]/40",
    bg: "bg-[#7B96FF]/12",
  },
  t: {
    label: "TR",
    text: "text-[#FB923C]",
    ring: "ring-[#FB923C]/40",
    bg: "bg-[#FB923C]/12",
  },
} as const;

export type FactionSide = keyof typeof SIDE_STYLES;

export function FactionBadge({
  side,
  className,
  size = "md",
}: {
  side: FactionSide;
  className?: string;
  /** `sm` para uso inline, `md` padrão, `lg` para destaque em cabeçalho. */
  size?: "sm" | "md" | "lg";
}) {
  const style = SIDE_STYLES[side];

  const sizeClass =
    size === "sm" ? "h-5 min-w-[1.75rem] text-[9px] rounded-[4px]"
    : size === "lg" ? "h-9 min-w-[2.75rem] text-sm rounded-lg"
    : "h-7 min-w-[2.25rem] text-[11px] rounded-md";

  return (
    <span
      aria-label={style.label}
      className={cn(
        "inline-flex select-none items-center justify-center px-1.5 font-mono font-black leading-none tracking-tight ring-1 ring-inset",
        sizeClass,
        style.text,
        style.ring,
        style.bg,
        className
      )}
    >
      {style.label}
    </span>
  );
}
