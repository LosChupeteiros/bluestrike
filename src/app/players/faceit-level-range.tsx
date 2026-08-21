"use client";

import { useEffect, useRef, useState } from "react";
import { FaceitSkillIcon } from "@/components/ui/faceit-skill-icon";
import { useLiveFilters } from "@/components/ui/live-filters";

interface FaceitLevelRangeProps {
  initialMin: number;
  initialMax: number;
}

export default function FaceitLevelRange({ initialMin, initialMax }: FaceitLevelRangeProps) {
  const { setParams } = useLiveFilters();
  const [minimum, setMinimum] = useState(initialMin);
  const [maximum, setMaximum] = useState(initialMax);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
  }, []);

  // O range dispara muitos eventos ao arrastar — só aplica quando o valor para.
  function commit(nextMin: number, nextMax: number) {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => {
      setParams({
        faceitMin: nextMin > 1 ? String(nextMin) : null,
        faceitMax: nextMax < 10 ? String(nextMax) : null,
      });
    }, 320);
  }

  return (
    <fieldset className="min-w-0 rounded-xl border border-[var(--border)] bg-black/15 px-3 py-2.5">
      <legend className="sr-only">Faixa de nível FACEIT</legend>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
          FACEIT level
        </span>
        <span className="flex items-center gap-1.5 text-xs font-black text-[#ff7a00]">
          <FaceitSkillIcon level={minimum} size={16} />
          {minimum}–{maximum}
          <FaceitSkillIcon level={maximum} size={16} />
        </span>
      </div>

      <div className="relative mt-2 h-4">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/8" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#ff7a00]"
          style={{
            left: `${((minimum - 1) / 9) * 100}%`,
            right: `${100 - ((maximum - 1) / 9) * 100}%`,
          }}
        />
        <input
          aria-label="Nível FACEIT mínimo"
          className="pointer-events-none absolute inset-0 h-4 w-full appearance-none bg-transparent accent-[#ff7a00] [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
          max={10}
          min={1}
          name="faceitMin"
          onChange={(event) => {
            const next = Math.min(Number(event.target.value), maximum);
            setMinimum(next);
            commit(next, maximum);
          }}
          type="range"
          value={minimum}
        />
        <input
          aria-label="Nível FACEIT máximo"
          className="pointer-events-none absolute inset-0 h-4 w-full appearance-none bg-transparent accent-[#ff7a00] [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
          max={10}
          min={1}
          name="faceitMax"
          onChange={(event) => {
            const next = Math.max(Number(event.target.value), minimum);
            setMaximum(next);
            commit(minimum, next);
          }}
          type="range"
          value={maximum}
        />
      </div>
    </fieldset>
  );
}
