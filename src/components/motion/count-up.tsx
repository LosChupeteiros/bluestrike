"use client";

import * as React from "react";
import { animate } from "framer-motion";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

interface CountUpProps {
  to: number;
  from?: number;
  /** Seconds. */
  duration?: number;
  format?: (value: number) => string;
  className?: string;
}

const defaultFormat = (value: number) => Math.round(value).toLocaleString("pt-BR");

/**
 * Counts to a value when it scrolls into view.
 *
 * The server renders the *final* number, so the real figure is what ships in
 * the HTML. The rewind to `from` happens in a layout effect, before paint, so
 * there is no flash of the end value.
 */
export function CountUp({ to, from = 0, duration = 1.7, format = defaultFormat, className }: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let controls: ReturnType<typeof animate> | null = null;

    const run = () => {
      controls = animate(from, to, {
        duration,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (value) => {
          if (ref.current) ref.current.textContent = format(value);
        },
      });
    };

    element.textContent = format(from);

    if (typeof IntersectionObserver === "undefined") {
      run();
      return () => controls?.stop();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      controls?.stop();
    };
  }, [from, to, duration, format]);

  return (
    <span ref={ref} className={className}>
      {format(to)}
    </span>
  );
}
