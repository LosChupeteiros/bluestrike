"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";
import { FaceitSkillIcon } from "@/components/ui/faceit-skill-icon";

interface HeaderEloProps {
  initialElo: number;
  faceitLevel?: number | null;
  faceitElo?: number | null;
}

export default function HeaderElo({ initialElo, faceitLevel, faceitElo }: HeaderEloProps) {
  const pathname = usePathname();
  const [elo, setElo] = useState(initialElo);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/profile/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { elo: number } | null) => {
        if (!cancelled && data?.elo != null) {
          setElo(data.elo);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div className="mt-0.5 flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Zap className="h-3 w-3 fill-[var(--primary)] text-[var(--primary)]" />
        <span className="text-[11px] font-mono font-bold text-[var(--primary)]">{elo}</span>
      </div>

      {faceitLevel != null && faceitElo != null && (
        <>
          <span className="text-[var(--border)] select-none">|</span>
          <div className="flex items-center gap-1">
            <FaceitSkillIcon level={faceitLevel} size={15} />
            <span className="text-[11px] font-mono font-bold text-orange-400">{faceitElo}</span>
          </div>
        </>
      )}
    </div>
  );
}
