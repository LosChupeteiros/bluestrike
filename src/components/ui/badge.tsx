import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Rótulo de status: Archivo semibold em caixa normal sobre fundo tingido com
 * borda de 1px. Mono maiúsculo com tracking largo saiu de propósito — é o
 * "eyebrow" que denuncia interface gerada. Todo variant mantém o texto acima
 * de 4.5:1 na superfície escura em que ele se apoia.
 */
const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5",
    "font-display text-[11px] font-semibold tracking-[-0.005em]",
    "transition-colors duration-200",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-strike/30 bg-strike/12 text-strike",
        secondary: "border-line-2 bg-surface text-ink-2",
        outline: "border-line-2 bg-transparent text-ink-2",
        destructive: "border-loss/30 bg-loss/12 text-loss",
        open: "border-gain/30 bg-gain/12 text-gain",
        ongoing: "border-strike/30 bg-strike/12 text-strike",
        finished: "border-line-2 bg-surface text-ink-3",
        upcoming: "border-prize/30 bg-prize/12 text-prize",
        live: "border-live/35 bg-live/14 text-live",
        gold: "border-prize/30 bg-prize/12 text-prize",
        faceit: "border-faceit/35 bg-faceit/12 text-faceit",
        purple: "border-strike-deep/40 bg-strike-deep/18 text-strike-hi",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
