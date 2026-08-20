"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
gsap.registerPlugin(useGSAP);

export default function HomeMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(".bs-hero-copy > *", {
        y: 18,
        opacity: 0,
        duration: 0.68,
        stagger: 0.065,
        ease: "power4.out",
      });

      gsap.from(".bs-hero-visual", {
        y: 22,
        scale: 0.975,
        opacity: 0,
        duration: 0.9,
        delay: 0.16,
        ease: "power4.out",
      });
    },
    { scope: root }
  );

  return <div ref={root} className="bs-home-frame">{children}</div>;
}
