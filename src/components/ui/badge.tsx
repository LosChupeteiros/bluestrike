import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]",
        secondary: "border-transparent bg-[var(--secondary)] text-[var(--secondary-foreground)]",
        destructive: "border-red-200 bg-red-50 text-red-700",
        outline: "border-[var(--border)] text-[var(--foreground)]",
        open: "border-emerald-200 bg-emerald-50 text-emerald-700",
        ongoing: "border-blue-200 bg-blue-50 text-blue-700",
        finished: "border-slate-200 bg-slate-100 text-slate-600",
        upcoming: "border-slate-200 bg-slate-50 text-slate-600",
        live: "border-red-200 bg-red-50 text-red-700",
        gold: "border-amber-200 bg-amber-50 text-amber-700",
        faceit: "border-orange-200 bg-orange-50 text-orange-700",
        purple: "border-violet-200 bg-violet-50 text-violet-700",
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
