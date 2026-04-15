"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Eye, ShieldCheck, Swords, Target, Users, X, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IN_GAME_ROLES, roleLabel, type InGameRole, type UserProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

interface EditModalProps {
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

export default function EditModal({ profile, isOpen, onClose }: EditModalProps) {
  const router = useRouter();

  const [bio, setBio] = useState(profile.bio ?? "");
  const [inGameRole, setInGameRole] = useState<InGameRole | null>(profile.inGameRole);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setBio(profile.bio ?? "");
      setInGameRole(profile.inGameRole);
      setFeedback(null);
    }
  }, [isOpen, profile.bio, profile.inGameRole]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

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
        throw new Error(payload.error ?? "Não foi possível salvar.");
      }

      onClose();
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível salvar.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const currentRoleLabel = useMemo(() => roleLabel(inGameRole), [inGameRole]);
  const bioLengthLabel = useMemo(() => `${bio.length}/280`, [bio.length]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-10 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background)] shadow-2xl">
        {/* Fixed header */}
        <div className="shrink-0 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-6 py-4">
          <div>
            <div className="text-sm font-semibold text-[var(--primary)]">Editar perfil</div>
            <div className="text-xs text-[var(--muted-foreground)]">Bio e função em jogo</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--border)] p-2 text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bio */}
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold text-[var(--foreground)]">Bio</label>
                <span className="text-xs text-[var(--muted-foreground)]">{bioLengthLabel}</span>
              </div>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={280}
                placeholder="Fale rápido do seu estilo, comunicação e do que seu time encontra quando joga com você."
              />
            </div>

            {/* In-game role */}
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold text-[var(--foreground)]">
                  Função em jogo
                </label>
                <Badge variant="secondary">{currentRoleLabel}</Badge>
              </div>

              <div role="radiogroup" aria-label="Função em jogo" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {IN_GAME_ROLES.map((role) => {
                  const isActive = inGameRole === role.value;
                  const RoleIcon = ROLE_ICONS[role.value];

                  return (
                    <label
                      key={role.value}
                      className={cn(
                        "group relative block cursor-pointer overflow-hidden rounded-xl border bg-[var(--card)] p-4 text-left touch-manipulation select-none transition-[border-color,background-color] duration-200",
                        isActive
                          ? "border-[var(--primary)]/45 bg-[var(--primary)]/7"
                          : "border-[var(--border)] hover:border-[var(--primary)]/35 hover:bg-[var(--secondary)]/85"
                      )}
                    >
                      <input
                        type="radio"
                        name="inGameRole"
                        value={role.value}
                        checked={isActive}
                        onChange={(e) => {
                          if (e.target.checked) setInGameRole(role.value);
                        }}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-gradient-to-br from-cyan-950 to-slate-900",
                            isActive ? "border-[var(--primary)]/45" : "border-[var(--border)]"
                          )}
                        >
                          <RoleIcon className="h-4 w-4 text-[var(--primary)]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className={cn(
                              "text-sm font-bold",
                              isActive ? "text-[var(--primary)]" : "group-hover:text-[var(--primary)]"
                            )}
                          >
                            {role.label}
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)]">{role.description}</p>
                        </div>
                        {isActive && (
                          <Badge variant="default" className="ml-auto shrink-0">
                            Ativo
                          </Badge>
                        )}
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
                Limpar função
              </button>
            </div>

            {feedback && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  feedback.type === "success"
                    ? "border-green-500/20 bg-green-500/10 text-green-300"
                    : "border-red-500/20 bg-red-500/10 text-red-300"
                }`}
              >
                {feedback.message}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="gradient" loading={isSaving}>
                Salvar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
