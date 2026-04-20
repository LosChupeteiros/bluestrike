"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MatchResultFormProps {
  matchId: string;
  tournamentId: string;
  team1: { id: string; name: string };
  team2: { id: string; name: string };
}

export default function MatchResultForm({ matchId, tournamentId, team1, team2 }: MatchResultFormProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!selected) return;
    setError(null);

    startTransition(async () => {
      const res = await fetch(`/api/admin/matches/${matchId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId: selected }),
      });

      const body = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(body.error ?? "Não foi possível salvar o resultado.");
        return;
      }

      router.push(`/tournaments/${tournamentId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[team1, team2].map((team) => (
          <button
            key={team.id}
            type="button"
            onClick={() => setSelected(team.id)}
            className={`rounded-xl border p-4 text-left transition-all ${
              selected === team.id
                ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)]"
                : "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/30"
            }`}
          >
            <div className="flex items-center gap-2">
              {selected === team.id && <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />}
              <Trophy className={`h-4 w-4 ${selected === team.id ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`} />
            </div>
            <div className="mt-2 font-bold">{team.name}</div>
            <div className="text-xs">Selecionar como vencedor</div>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <Button
        type="button"
        variant="gradient"
        className="w-full gap-2"
        disabled={!selected || isPending}
        onClick={submit}
      >
        <CheckCircle2 className="h-4 w-4" />
        {isPending ? "Salvando..." : "Confirmar resultado"}
      </Button>
    </div>
  );
}
