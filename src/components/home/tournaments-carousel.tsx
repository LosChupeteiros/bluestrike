"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TournamentCard from "@/components/tournament/tournament-card";
import FaceitTournamentCard from "@/components/tournament/faceit-tournament-card";
import type { Tournament } from "@/types";
import type { FaceitChampionship } from "@/lib/faceit";

export type CarouselItem =
  | { source: "bluestrike"; tournament: Tournament }
  | { source: "faceit"; championship: FaceitChampionship };

interface TournamentsCarouselProps {
  items: CarouselItem[];
}

export default function TournamentsCarousel({ items }: TournamentsCarouselProps) {
  const useCarousel = items.length > 4;
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
    el.scrollBy({ left: direction === "left" ? -el.clientWidth * 0.8 : el.clientWidth * 0.8, behavior: "smooth" });
  }

  function renderCard(item: CarouselItem) {
    if (item.source === "faceit") {
      return <FaceitTournamentCard championship={item.championship} featured />;
    }
    return <TournamentCard tournament={item.tournament} featured />;
  }

  if (!useCarousel) {
    return (
      <div className={`grid gap-5 ${items.length === 1 ? "grid-cols-1 max-w-md" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
        {items.map((item, i) => (
          <div key={item.source === "faceit" ? `faceit-${item.championship.id}` : item.tournament.id}>
            {renderCard(item)}
          </div>
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
          className="absolute left-0 top-[45%] -translate-x-5 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] shadow-xl hover:border-[var(--primary)]/50 hover:text-[var(--primary)] transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-0 top-[45%] translate-x-5 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] shadow-xl hover:border-[var(--primary)]/50 hover:text-[var(--primary)] transition-colors"
          aria-label="Próximo"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const key = item.source === "faceit" ? `faceit-${item.championship.id}` : item.tournament.id;
          return (
            <div key={key} className="snap-start shrink-0 w-[300px] sm:w-[340px] lg:w-[380px]">
              {renderCard(item)}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-center gap-1.5">
        {items.map((item) => {
          const key = item.source === "faceit" ? `faceit-dot-${item.championship.id}` : `bs-dot-${item.tournament.id}`;
          return <div key={key} className="h-1.5 w-1.5 rounded-full bg-[var(--border)]" />;
        })}
      </div>
    </div>
  );
}
