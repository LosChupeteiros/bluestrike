"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface HeaderEloProps {
  /** ELO inicial vindo do servidor — evita flash de conteúdo no primeiro render */
  initialElo: number;
}

export default function HeaderElo({ initialElo }: HeaderEloProps) {
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
      .catch(() => {/* silencioso — fallback para o valor inicial */});

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div className="mt-0.5 text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-[var(--primary)]/80">
      {elo} ELO
    </div>
  );
}
