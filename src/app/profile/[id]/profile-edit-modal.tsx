"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Eye, ShieldCheck, Sparkles, Swords, Target, Users, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IN_GAME_ROLES, roleLabel, type InGameRole, type UserProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";
import ProfileModalShell from "./profile-modal-shell";

interface ProfileEditModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

type Feedback = { type: "success" | "error"; message: string } | null;

const ROLE_ICONS: Record<(typeof IN_GAME_ROLES)[number]["value"], LucideIcon> = {
  awper: Target,
  igl: Crown,
  "entry-fragger": Zap,
  rifler: Swords,
  lurker: Eye,
  support: ShieldCheck,
  coach: Users,
};

export default function ProfileEditModal({ profile, isOpen, onClose }: ProfileEditModalProps) {
  const router = useRouter();
  const [bio, setBio] = useState(profile.bio ?? "");
  const [inGameRole, setInGameRole] = useState<InGameRole | null>(profile.inGameRole);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setBio(profile.bio ?? "");
    setInGameRole(profile.inGameRole);
    setFeedback(null);
  }, [isOpen, profile.bio, profile.inGameRole]);

  const currentRoleLabel = useMemo(() => roleLabel(inGameRole), [inGameRole]);
  const bioLengthLabel = useMemo(() => `${bio.length}/280`, [bio.length]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile/bio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bio.trim(), inGameRole }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel salvar.");
      }

      onClose();
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel salvar.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ProfileModalShell
      open={isOpen}
      onClose={onClose}
      title="Editar perfil"
      description="Atualize apenas o que aparece no seu perfil publico: bio e funcao em jogo."
      widthClassName="max-w-2xl"
    >
      <div className="space-y-6 p-6">
        <section className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(8,24,36,0.94),rgba(6,10,18,0.92))] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                <Sparkles className="h-3.5 w-3.5" />
                Perfil competitivo
              </div>
              <h3 className="text-lg font-black text-[var(--foreground)]">{profile.steamPersonaName}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
                Ajuste como voce se apresenta para capitaes, lineups e organizadores.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{currentRoleLabel}</Badge>
              <Badge variant="outline">{profile.elo} ELO</Badge>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-[var(--foreground)]">Bio publica</label>
              <span className="text-xs text-[var(--muted-foreground)]">{bioLengthLabel}</span>
            </div>
            <Textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={280}
              className="min-h-32"
              placeholder="Descreva seu estilo, comunicacao, pontos fortes e o tipo de time em que voce rende melhor."
            />
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-[var(--foreground)]">Funcao em jogo</label>
              <Badge variant="secondary">{currentRoleLabel}</Badge>
            </div>

            <div role="radiogroup" aria-label="Funcao em jogo" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {IN_GAME_ROLES.map((role) => {
                const isActive = inGameRole === role.value;
                const RoleIcon = ROLE_ICONS[role.value];

                return (
                  <label
                    key={role.value}
                    className={cn(
                      "group relative block cursor-pointer overflow-hidden rounded-2xl border bg-[var(--card)] p-4 text-left transition-[border-color,background-color,transform] duration-200",
                      isActive
                        ? "border-[var(--primary)]/45 bg-[var(--primary)]/7"
                        : "border-[var(--border)] hover:-translate-y-0.5 hover:border-[var(--primary)]/35 hover:bg-[var(--secondary)]/85"
                    )}
                  >
                    <input
                      type="radio"
                      name="inGameRole"
                      value={role.value}
                      checked={isActive}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setInGameRole(role.value);
                        }
                      }}
                      className="sr-only"
                    />

                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br from-cyan-950 to-slate-900",
                          isActive ? "border-[var(--primary)]/45" : "border-[var(--border)]"
                        )}
                      >
                        <RoleIcon className="h-4 w-4 text-[var(--primary)]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <span className={cn("text-sm font-bold", isActive && "text-[var(--primary)]")}>
                            {role.label}
                          </span>
                          {isActive && <Badge variant="default">Ativo</Badge>}
                        </div>
                        <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">{role.description}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setInGameRole(null)}
              className="mt-3 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              Limpar funcao
            </button>
          </section>

          {feedback && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                feedback.type === "success"
                  ? "border-green-500/20 bg-green-500/10 text-green-300"
                  : "border-red-500/20 bg-red-500/10 text-red-300"
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" loading={isSaving}>
              Salvar alteracoes
            </Button>
          </div>
        </form>
      </div>
    </ProfileModalShell>
  );
}
