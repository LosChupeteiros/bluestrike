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
        destructive: "border-transparent bg-red-500/10 text-red-400 border-red-500/20",
        outline: "border-[var(--border)] text-[var(--foreground)]",
        open: "border-green-500/30 bg-green-500/10 text-green-400",
        ongoing: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
        finished: "border-gray-500/30 bg-gray-500/10 text-gray-400",
        upcoming: "border-orange-500/30 bg-orange-500/10 text-orange-400",
        live: "border-red-500/30 bg-red-500/10 text-red-400",
        gold: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
        purple: "border-purple-500/30 bg-purple-500/10 text-purple-400",
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
