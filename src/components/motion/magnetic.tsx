"use client";

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

interface MagneticProps {
  children: React.ReactNode;
  /** How far the element travels toward the cursor, 0–1. */
  strength?: number;
  className?: string;
}

/**
 * Pulls its child toward the pointer with spring physics.
 * Position lives entirely in motion values — nothing here re-renders React,
 * so this stays cheap even with several on screen.
 */
export function Magnetic({ children, strength = 0.28, className }: MagneticProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 240, damping: 24, mass: 0.45 });
  const springY = useSpring(y, { stiffness: 240, damping: 24, mass: 0.45 });

  const handleMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (reduceMotion || event.pointerType !== "mouse") return;
      const element = ref.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
      y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
    },
    [reduceMotion, strength, x, y]
  );

  const handleLeave = React.useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      className={className}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={reduceMotion ? undefined : { x: springX, y: springY }}
    >
      {children}
    </motion.div>
  );
}
