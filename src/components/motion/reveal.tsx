"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll reveal that enhances an already-visible default.
 *
 * The server renders the content fully visible. On mount (before paint) we
 * check whether the element is below the fold: only then is it armed with a
 * hidden state and handed to an IntersectionObserver. Anything already in the
 * first viewport is left alone — no flash, and a headless render or a JS
 * failure still ships readable content.
 *
 * NOTE: the hidden state must never use `clip-path` or `overflow: hidden`.
 * Both shrink the element's intersection rectangle to zero, so the observer
 * that is supposed to un-hide it never fires and the section ships blank.
 * The wipe is done with an oversized `mask-image` instead, which is a paint
 * operation and leaves the intersection rect intact.
 */

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

type RevealVariant = "rise" | "mask" | "blur" | "fade";

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: RevealVariant;
  /** Seconds. */
  delay?: number;
  /** Seconds. */
  duration?: number;
  distance?: number;
  as?: "div" | "section" | "li" | "article" | "header" | "footer";
}

/**
 * Mask com 3x a altura do elemento: sólido até 33%, limpo a partir de 40%.
 *
 * Em `0% 100%` o mask sobe 2H, e o elemento inteiro cai na faixa transparente
 * (escondido). Em `0% 0%` o mask alinha pelo topo e o elemento inteiro cai na
 * faixa sólida (visível), com a transição terminando bem depois da borda de
 * baixo. Qualquer deslocamento positivo deixaria o topo do elemento FORA do
 * mask — e, com `no-repeat`, fora do mask é transparente: era isso que cortava
 * o topo dos títulos.
 */
const MASK_IMAGE = "linear-gradient(to bottom, #000 0%, #000 33%, rgba(0,0,0,0) 40%)";
const MASK_SIZE = "100% 300%";

const maskBase: React.CSSProperties = {
  maskImage: MASK_IMAGE,
  WebkitMaskImage: MASK_IMAGE,
  maskSize: MASK_SIZE,
  WebkitMaskSize: MASK_SIZE,
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
};

function hiddenStyle(variant: RevealVariant, distance: number): React.CSSProperties {
  switch (variant) {
    case "mask":
      return {
        ...maskBase,
        maskPosition: "0% 100%",
        WebkitMaskPosition: "0% 100%",
        transform: `translateY(${distance * 0.35}px)`,
      };
    case "blur":
      return { opacity: 0, filter: "blur(10px)", transform: `translateY(${distance * 0.5}px)` };
    case "fade":
      return { opacity: 0 };
    case "rise":
    default:
      return { opacity: 0, transform: `translateY(${distance}px)` };
  }
}

function shownStyle(variant: RevealVariant): React.CSSProperties {
  switch (variant) {
    case "mask":
      return {
        ...maskBase,
        maskPosition: "0% 0%",
        WebkitMaskPosition: "0% 0%",
        transform: "translateY(0)",
      };
    case "blur":
      return { opacity: 1, filter: "blur(0px)", transform: "translateY(0)" };
    case "fade":
      return { opacity: 1 };
    case "rise":
    default:
      return { opacity: 1, transform: "translateY(0)" };
  }
}

function transitionFor(variant: RevealVariant, duration: number, delay: number) {
  const easing = "var(--ease-out-quint)";
  const base = [
    `opacity ${duration}s ${easing} ${delay}s`,
    `transform ${duration}s ${easing} ${delay}s`,
    `filter ${duration}s ${easing} ${delay}s`,
  ];

  if (variant === "mask") {
    const wipe = duration * 1.2;
    base.push(
      `mask-position ${wipe}s ${easing} ${delay}s`,
      `-webkit-mask-position ${wipe}s ${easing} ${delay}s`
    );
  }

  return base.join(", ");
}

export function Reveal({
  children,
  className,
  variant = "rise",
  delay = 0,
  duration = 0.75,
  distance = 22,
  as: Tag = "div",
  style,
  ...rest
}: RevealProps) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [phase, setPhase] = React.useState<"static" | "hidden" | "shown">("static");

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    // Already in the first viewport? It was part of the initial paint. Leave it.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    setPhase("hidden");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setPhase("shown");
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const motionStyle: React.CSSProperties =
    phase === "static"
      ? {}
      : phase === "hidden"
        ? { ...hiddenStyle(variant, distance), willChange: "transform, opacity, filter, mask-position" }
        : { ...shownStyle(variant), transition: transitionFor(variant, duration, delay) };

  // Polymorphic host element: widen so any of the allowed tags accepts the ref.
  const Component = Tag as React.ElementType;

  return (
    <Component ref={ref} className={cn(className)} style={{ ...style, ...motionStyle }} {...rest}>
      {children}
    </Component>
  );
}

/** Cadence helper so stagger timings stay consistent across sections. */
export const stagger = (index: number, step = 0.07, base = 0) => base + index * step;
