"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TournamentCard from "@/components/tournament/tournament-card";
import type { Tournament } from "@/types";

interface TournamentsCarouselProps {
  tournaments: Tournament[];
}

export default function TournamentsCarousel({ tournaments }: TournamentsCarouselProps) {
  const useCarousel = tournaments.length > 4;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }

  useEffect(() => {
    if (!useCarousel) return;
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [useCarousel]);

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  }

  if (!useCarousel) {
    return (
      <div className={`grid gap-5 ${tournaments.length === 1 ? "grid-cols-1 max-w-md" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
        {tournaments.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} featured />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-0 top-[45%] -translate-y-1/2 -translate-x-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] shadow-xl hover:border-[var(--primary)]/50 hover:text-[var(--primary)] transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-0 top-[45%] -translate-y-1/2 translate-x-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] shadow-xl hover:border-[var(--primary)]/50 hover:text-[var(--primary)] transition-colors"
          aria-label="Próximo"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tournaments.map((tournament) => (
          <div key={tournament.id} className="snap-start shrink-0 w-[300px] sm:w-[340px] lg:w-[380px]">
            <TournamentCard tournament={tournament} featured />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="mt-4 flex justify-center gap-1.5">
        {tournaments.map((t) => (
          <div
            key={t.id}
            className="h-1.5 w-1.5 rounded-full bg-[var(--border)]"
          />
        ))}
      </div>
    </div>
  );
}
