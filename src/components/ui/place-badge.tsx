import { cn } from "@/lib/utils";

/**
 * Insígnia de colocação desenhada — substitui os emojis de medalha, que
 * renderizam diferente em cada sistema e derrubam o acabamento da página.
 * Anel + numeral tabular, na cor do lugar.
 */

const PLACE_TONE = [
  { ring: "var(--color-prize)", text: "var(--color-prize)", label: "1º lugar" },
  { ring: "oklch(0.8 0.006 250)", text: "oklch(0.86 0.006 250)", label: "2º lugar" },
  { ring: "oklch(0.63 0.085 58)", text: "oklch(0.72 0.09 58)", label: "3º lugar" },
] as const;

const SIZES = {
  sm: { box: "h-6 w-6", text: "text-[10px]" },
  md: { box: "h-8 w-8", text: "text-xs" },
  lg: { box: "h-11 w-11", text: "text-sm" },
} as const;

interface PlaceBadgeProps {
  /** 1, 2 ou 3. */
  place: number;
  size?: keyof typeof SIZES;
  className?: string;
}

export function PlaceBadge({ place, size = "md", className }: PlaceBadgeProps) {
  const tone = PLACE_TONE[place - 1] ?? {
    ring: "var(--color-line-2)",
    text: "var(--color-ink-3)",
    label: `${place}º lugar`,
  };
  const dimensions = SIZES[size];

  return (
    <span
      role="img"
      aria-label={tone.label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border",
        dimensions.box,
        className
      )}
      style={{
        borderColor: `color-mix(in oklab, ${tone.ring} 50%, transparent)`,
        background: `color-mix(in oklab, ${tone.ring} 10%, transparent)`,
      }}
    >
      <span
        className={cn("tabular font-semibold leading-none", dimensions.text)}
        style={{ color: tone.text }}
      >
        {place}
      </span>
    </span>
  );
}

export { PLACE_TONE };
