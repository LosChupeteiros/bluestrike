"use client";

import { useState } from "react";
import { FaceitSkillIcon } from "@/components/ui/faceit-skill-icon";

interface FaceitLevelRangeProps {
  initialMin: number;
  initialMax: number;
}

export default function FaceitLevelRange({ initialMin, initialMax }: FaceitLevelRangeProps) {
  const [minimum, setMinimum] = useState(initialMin);
  const [maximum, setMaximum] = useState(initialMax);

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
          onChange={(event) => setMinimum(Math.min(Number(event.target.value), maximum))}
          type="range"
          value={minimum}
        />
        <input
          aria-label="Nível FACEIT máximo"
          className="pointer-events-none absolute inset-0 h-4 w-full appearance-none bg-transparent accent-[#ff7a00] [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
          max={10}
          min={1}
          name="faceitMax"
          onChange={(event) => setMaximum(Math.max(Number(event.target.value), minimum))}
          type="range"
          value={maximum}
        />
      </div>
    </fieldset>
  );
}
