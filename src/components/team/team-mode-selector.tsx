"use client";

import { Check, Users } from "lucide-react";
import { TEAM_MODE_LIST, type TeamMode } from "@/lib/team-modes";
import { cn } from "@/lib/utils";

interface TeamModeSelectorProps {
  value: TeamMode;
  onChange: (mode: TeamMode) => void;
  /** Modalidades que não podem ser escolhidas neste contexto. */
  disabledModes?: TeamMode[];
  name?: string;
  className?: string;
}

const POOL_LABEL: Record<string, string> = {
  competitive: "Mapa pool competitiva",
  wingman: "Mapa pool wingman",
  aim: "Mapa pool de aim",
};

export default function TeamModeSelector({
  value,
  onChange,
  disabledModes,
  name,
  className,
}: TeamModeSelectorProps) {
  const disabled = new Set(disabledModes ?? []);

  return (
    <div
      role="radiogroup"
      aria-label="Modalidade"
      className={cn("grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5", className)}
    >
      {name && <input type="hidden" name={name} value={value} />}

      {TEAM_MODE_LIST.map((mode) => {
        const isActive = mode.id === value;
        const isDisabled = disabled.has(mode.id);

        return (
          <button
            key={mode.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={isDisabled}
            onClick={() => onChange(mode.id)}
            title={mode.description}
            className={cn(
              "group relative flex min-h-[7.5rem] flex-col justify-between overflow-hidden rounded-2xl border p-3.5 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50",
              isDisabled && "cursor-not-allowed opacity-40",
              isActive
                ? "border-[var(--primary)]/55 bg-[var(--primary)]/[0.07] shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
                : !isDisabled &&
                    "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/[0.03]"
            )}
          >
            {isActive && (
              <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)]">
                <Check className="h-3 w-3 text-black" aria-hidden="true" />
              </span>
            )}

            <div>
              <span
                className={cn(
                  "block font-mono text-2xl font-black leading-none tracking-tight transition-colors",
                  isActive ? "text-[var(--primary)]" : "text-[var(--foreground)]"
                )}
              >
                {mode.label}
              </span>
              <span className="mt-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                {mode.gameModeLabel}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              <Users
                className={cn(
                  "h-3 w-3 shrink-0",
                  isActive ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
                )}
                aria-hidden="true"
              />
              <span className="text-[10px] text-[var(--muted-foreground)]">
                {mode.maxMembers === mode.playersPerTeam
                  ? `${mode.playersPerTeam} jogador`
                  : `${mode.playersPerTeam} + ${mode.maxMembers - mode.playersPerTeam} reserva`}
              </span>
            </div>

            <span className="mt-1 block truncate text-[9px] uppercase tracking-[0.1em] text-[var(--muted-foreground)]/70">
              {POOL_LABEL[mode.mapPool]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
