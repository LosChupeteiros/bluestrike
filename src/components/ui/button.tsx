"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 shadow-md hover:shadow-[0_0_16px_rgba(0,200,255,0.4)] active:scale-[0.98]",
        destructive:
          "bg-[var(--destructive)] text-white hover:bg-[var(--destructive)]/90 shadow-md active:scale-[0.98]",
        outline:
          "border border-[var(--border)] bg-transparent hover:bg-[var(--secondary)] hover:border-[var(--primary)]/40 active:scale-[0.98]",
        secondary:
          "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/80 active:scale-[0.98]",
        ghost:
          "hover:bg-[var(--secondary)] hover:text-[var(--foreground)] active:scale-[0.98]",
        link: "text-[var(--primary)] underline-offset-4 hover:underline p-0 h-auto",
        gradient:
          "bg-gradient-to-r from-cyan-500 to-cyan-600 text-black font-bold hover:from-cyan-400 hover:to-cyan-500 shadow-md hover:shadow-[0_0_20px_rgba(0,200,255,0.5)] active:scale-[0.98]",
        orange:
          "bg-orange-500 text-white hover:bg-orange-400 shadow-md hover:shadow-[0_0_16px_rgba(249,115,22,0.4)] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
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
        {...props}
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
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
