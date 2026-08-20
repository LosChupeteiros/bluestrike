"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: React.ReactNode;
  /** Seconds for one full pass. */
  speed?: number;
  reverse?: boolean;
  className?: string;
  /** Fade the horizontal edges into the background. */
  fade?: boolean;
}

/**
 * Seamless infinite rail. Content is rendered twice and translated -50%, so
 * the seam never lands mid-viewport. Pure CSS animation, memoized, and
 * `prefers-reduced-motion` freezes it via the global reduce block.
 */
function MarqueeImpl({ children, speed = 42, reverse = false, className, fade = true }: MarqueeProps) {
  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={
        fade
          ? {
              maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
              WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
            }
          : undefined
      }
    >
      <div
        className="animate-marquee flex w-max shrink-0 items-center"
        style={{
          animationDuration: `${speed}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}

export const Marquee = React.memo(MarqueeImpl);
