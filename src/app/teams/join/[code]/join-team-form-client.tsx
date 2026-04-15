"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface JoinTeamFormClientProps {
  inviteCode: string;
  teamSlug: string;
  teamName: string;
  requiresPassword: boolean;
}

export default function JoinTeamFormClient({
  inviteCode,
  teamSlug,
  teamName,
  requiresPassword,
}: JoinTeamFormClientProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!joined) {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.push(`/teams/${teamSlug}`);
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [joined, router, teamSlug]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/teams/join/${inviteCode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Nao foi possivel entrar no time.");
        return;
      }

      setJoined(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {requiresPassword && (
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Digite a senha do time"
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {joined && (
        <p className="rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm text-green-200">
          Entrada confirmada. Redirecionando para {teamName}...
        </p>
      )}

      <div className="flex gap-3">
        <Button asChild variant="outline" className="flex-1" type="button">
          <Link href="/teams">Cancelar</Link>
        </Button>
        <Button
          type="submit"
          variant="gradient"
          className="flex-1 gap-2"
          disabled={joined || isPending || (requiresPassword && password.trim().length < 4)}
        >
          <UserPlus className="h-4 w-4" />
          {joined ? "Entrou" : isPending ? "Enviando..." : "Confirmar entrada"}
        </Button>
      </div>
    </form>
  );
}
