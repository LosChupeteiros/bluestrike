import { cn } from "@/lib/utils";

/**
 * Selo de lado (CT / TR).
 *
 * Canto chanfrado em diagonal, como marcação de HUD militar — é o que conversa
 * com a identidade do CS sem virar ícone. Substitui os logos em
 * `/assets/sides/*.webp`, que eram referenciados em quatro lugares e nunca
 * existiram no repositório.
 *
 * O chanfro é `clip-path`, que o compositor resolve: não custa layout nem
 * repaint quando o elemento entra em cena junto com uma animação.
 */

const SIDE_STYLES = {
  ct: { label: "CT", cor: "#7B96FF" },
  t: { label: "TR", cor: "#FB923C" },
} as const;

export type FactionSide = keyof typeof SIDE_STYLES;

const SIZES = {
  sm: { h: "1.375rem", min: "2.375rem", fs: "0.625rem", corte: "5px", pad: "0 0.5rem" },
  md: { h: "1.875rem", min: "3.25rem", fs: "0.75rem", corte: "7px", pad: "0 0.75rem" },
  lg: { h: "2.375rem", min: "4rem", fs: "0.875rem", corte: "9px", pad: "0 1rem" },
} as const;

export function FactionBadge({
  side,
  className,
  size = "md",
}: {
  side: FactionSide;
  className?: string;
  /** `sm` inline sobre card, `md` padrão, `lg` para cabeçalho. */
  size?: keyof typeof SIZES;
}) {
  const { label, cor } = SIDE_STYLES[side];
  const s = SIZES[size];

  return (
    <span
      aria-label={label}
      className={cn(
        "inline-flex select-none items-center justify-center font-mono font-black leading-none",
        className
      )}
      style={{
        height: s.h,
        minWidth: s.min,
        padding: s.pad,
        fontSize: s.fs,
        letterSpacing: "0.08em",
        color: cor,
        backgroundColor: `color-mix(in srgb, ${cor} 16%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${cor} 45%, transparent)`,
        // Chanfro nos cantos superior-esquerdo e inferior-direito.
        clipPath: `polygon(${s.corte} 0, 100% 0, 100% calc(100% - ${s.corte}), calc(100% - ${s.corte}) 100%, 0 100%, 0 ${s.corte})`,
      }}
    >
      {label}
    </span>
  );
}
