"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface JoinTeamFormProps {
  teamSlug: string;
  teamName: string;
  requiresPassword: boolean;
}

export default function JoinTeamForm({ teamSlug, teamName, requiresPassword }: JoinTeamFormProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      // TODO: replace with real API call to /api/teams/[slug]/join (POST)
      // const res = await fetch(`/api/teams/${teamSlug}/join`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ password }),
      // });
      // if (!res.ok) {
      //   const data = await res.json();
      //   setError(data.error ?? "Erro ao entrar no time");
      //   return;
      // }
      // router.push(`/teams/${teamSlug}`);
      await new Promise((r) => setTimeout(r, 800));
      alert(`Solicitação enviada para ${teamName}! O capitão será notificado.`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {requiresPassword && (
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite a senha do time"
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div className="flex gap-3">
        <Button asChild variant="outline" className="flex-1" type="button">
          <Link href="/teams">Cancelar</Link>
        </Button>
        <Button
          type="submit"
          variant="gradient"
          className="flex-1 gap-2"
          disabled={isPending || (requiresPassword && password.trim().length < 4)}
        >
          <UserPlus className="w-4 h-4" />
          {isPending ? "Enviando..." : "Confirmar entrada"}
        </Button>
      </div>
    </form>
  );
}
