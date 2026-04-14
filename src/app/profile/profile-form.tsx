"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Crown,
  Eye,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Users,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCpf, formatPhone, IN_GAME_ROLES, roleLabel, type UserProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

interface ProfileFormProps {
  profile: UserProfile;
  onCancel?: () => void;
  onSaved?: () => void;
}

type Feedback =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

const ROLE_ICONS: Record<(typeof IN_GAME_ROLES)[number]["value"], LucideIcon> = {
  awper: Target,
  igl: Crown,
  "entry-fragger": Zap,
  rifler: Swords,
  lurker: Eye,
  support: ShieldCheck,
  coach: Users,
};

export default function ProfileForm({ profile, onCancel, onSaved }: ProfileFormProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [cpf, setCpf] = useState(formatCpf(profile.cpf));
  const [phone, setPhone] = useState(formatPhone(profile.phone));
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [inGameRole, setInGameRole] = useState(profile.inGameRole);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const bioLengthLabel = useMemo(() => `${bio.length}/280`, [bio.length]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          cpf,
          phone,
          birthDate,
          bio,
          inGameRole,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível salvar o perfil.");
      }

      setFeedback({
        type: "success",
        message: "Perfil atualizado com sucesso.",
      });

      onSaved?.();
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível salvar o perfil.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
              <Sparkles className="w-4 h-4" />
              Editar perfil
            </div>
            <h2 className="text-2xl font-black tracking-tight">Ajuste sua ficha competitiva</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
              CPF, celular e nascimento ficam privados. No perfil publico aparecem nome, idade, bio,
              função e seu ELO.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {profile.inGameRole && <Badge variant="secondary">{roleLabel(profile.inGameRole)}</Badge>}
            {onCancel && (
              <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                Fechar
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
              Nome completo
            </label>
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Seu nome e sobrenome"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
              Data de nascimento
            </label>
            <Input
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
              CPF
            </label>
            <Input
              value={cpf}
              onChange={(event) => setCpf(formatCpf(event.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
              Celular
            </label>
            <Input
              value={phone}
              onChange={(event) => setPhone(formatPhone(event.target.value))}
              placeholder="(11) 99999-0000"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-6">
          <h2 className="text-xl font-black tracking-tight">Apresentação pública</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Essa parte molda como você aparece para times, capitães e organizadores no hub.
          </p>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-[var(--foreground)]">Bio</label>
            <span className="text-xs text-[var(--muted-foreground)]">{bioLengthLabel}</span>
          </div>
          <Textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            maxLength={280}
            placeholder="Fale rápido do seu estilo, comunicação e do que seu time encontra quando joga com você."
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-[var(--foreground)]">
              Função em jogo
            </label>
            <Badge variant="secondary">{roleLabel(inGameRole)}</Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {IN_GAME_ROLES.map((role) => {
              const isActive = inGameRole === role.value;
              const RoleIcon = ROLE_ICONS[role.value];

              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setInGameRole(role.value)}
                  aria-pressed={isActive}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border bg-[var(--card)] p-4 text-left card-hover",
                    isActive
                      ? "border-[var(--primary)]/40 bg-[var(--primary)]/6 shadow-[0_0_24px_rgba(0,200,255,0.08)]"
                      : "border-[var(--border)] hover:border-[var(--primary)]/30"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/50 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                  <div className="relative flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-gradient-to-br from-cyan-950 to-slate-900",
                        isActive ? "border-[var(--primary)]/40" : "border-[var(--border)]"
                      )}
                    >
                      <RoleIcon className="h-5 w-5 text-[var(--primary)]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span
                          className={cn(
                            "text-sm font-bold transition-colors",
                            isActive ? "text-[var(--primary)]" : "group-hover:text-[var(--primary)]"
                          )}
                        >
                          {role.label}
                        </span>
                        {isActive && <Badge variant="default">Selecionado</Badge>}
                      </div>
                      <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setInGameRole(null)}
            className="mt-3 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            Limpar função
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight">Salvar alteracoes</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Assim que salvar, seu perfil público e seu cadastro competitivo ficam atualizados.
            </p>
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" size="lg" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" size="lg" variant="gradient" loading={isSaving}>
              Salvar perfil
            </Button>
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-green-500/20 bg-green-500/10 text-green-300"
                : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>
    </form>
  );
}
