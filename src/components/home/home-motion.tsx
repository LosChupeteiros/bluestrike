"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function HomeMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(".bs-hero-copy > *", {
        y: 22,
        opacity: 0.001,
        duration: 0.7,
        stagger: 0.07,
        ease: "power4.out",
      });

      gsap.from(".bs-hero-visual", {
        scale: 0.94,
        opacity: 0.35,
        duration: 1,
        ease: "power4.out",
      });

      gsap.utils.toArray<HTMLElement>(".bs-campaign-image").forEach((image) => {
        gsap.fromTo(
          image,
          { scale: 0.9, opacity: 0.72 },
          {
            scale: 1,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: image,
              start: "top 88%",
              end: "bottom 28%",
              scrub: 0.7,
            },
          },
        );
      });

      const words = gsap.utils.toArray<HTMLElement>(".bs-scrub-copy .bs-word");
      if (words.length) {
        gsap.fromTo(
          words,
          { opacity: 0.28 },
          {
            opacity: 1,
            stagger: 0.04,
            ease: "none",
            scrollTrigger: {
              trigger: ".bs-scrub-copy",
              start: "top 84%",
              end: "bottom 52%",
              scrub: 0.8,
            },
          },
        );
      }
    },
    { scope: root },
  );

  return <div ref={root}>{children}</div>;
}
