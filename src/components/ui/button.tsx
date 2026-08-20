"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Depth comes from edge refraction (a 1px inner highlight) and a tinted
 * shadow, never from a neon outer glow. Press feedback is physical:
 * the surface drops 1px and compresses slightly.
 */
const buttonVariants = cva(
  [
    "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap",
    "rounded-lg text-sm font-semibold tracking-[-0.01em]",
    "transition-[transform,background-color,border-color,box-shadow,color] duration-300 [transition-timing-function:var(--ease-out-quint)]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strike",
    "disabled:pointer-events-none disabled:opacity-45",
    "active:translate-y-px active:scale-[0.985] active:duration-75",
    "cursor-pointer",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-strike text-strike-ink",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_1px_2px_rgba(0,0,0,0.5)]",
          "hover:bg-strike-hi hover:-translate-y-px",
          "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_10px_26px_-10px_var(--color-strike-deep)]",
        ].join(" "),

        /* The hero CTA. Same material as default, plus a directional sheen. */
        gradient: [
          "overflow-hidden bg-strike text-strike-ink font-bold",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.5)]",
          "hover:bg-strike-hi hover:-translate-y-px",
          "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.36),0_14px_32px_-12px_var(--color-strike-deep)]",
          "before:pointer-events-none before:absolute before:inset-y-0 before:-left-full before:w-1/2",
          "before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)]",
          "before:transition-transform before:duration-[900ms] before:[transition-timing-function:var(--ease-out-expo)]",
          "hover:before:translate-x-[400%]",
          "motion-reduce:before:hidden",
        ].join(" "),

        outline: [
          "border border-line-2 bg-surface/40 text-ink backdrop-blur-sm",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
          "hover:border-strike/45 hover:bg-surface hover:text-ink hover:-translate-y-px",
        ].join(" "),

        secondary: [
          "bg-surface text-ink border border-line",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
          "hover:bg-surface-2 hover:border-line-2",
        ].join(" "),

        ghost: "text-ink-2 hover:bg-surface hover:text-ink",

        link: "h-auto p-0 text-strike underline-offset-4 hover:underline active:translate-y-0 active:scale-100",

        destructive: [
          "bg-loss text-void font-bold",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(0,0,0,0.5)]",
          "hover:brightness-110 hover:-translate-y-px",
        ].join(" "),

        orange: [
          "bg-faceit text-white font-bold",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_1px_2px_rgba(0,0,0,0.5)]",
          "hover:brightness-110 hover:-translate-y-px",
          "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_12px_28px_-12px_var(--color-faceit)]",
        ].join(" "),
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 px-7 text-[0.9375rem]",
        xl: "h-14 rounded-xl px-9 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <span
              className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
              aria-hidden="true"
            />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
