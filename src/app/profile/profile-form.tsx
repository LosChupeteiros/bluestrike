"use client";

import { startTransition, useLayoutEffect, useMemo, useRef, useState } from "react";
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

function calcMaskedCursorPos(rawValue: string, selectionStart: number, formatter: (digits: string) => string) {
  const digits = rawValue.replace(/\D/g, "");
  const digitsBeforeCursor = rawValue.slice(0, selectionStart).replace(/\D/g, "").length;
  const formattedValue = formatter(digits);

  if (digitsBeforeCursor <= 0) {
    return 0;
  }

  let digitCount = 0;

  for (let index = 0; index < formattedValue.length; index += 1) {
    if (/\d/.test(formattedValue[index])) {
      digitCount += 1;

      if (digitCount === digitsBeforeCursor) {
        return index + 1;
      }
    }
  }

  return formattedValue.length;
}

export default function ProfileForm({ profile, onCancel, onSaved }: ProfileFormProps) {
  const router = useRouter();
  const cpfInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const pendingCpfCursorRef = useRef<number | null>(null);
  const pendingPhoneCursorRef = useRef<number | null>(null);

  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [cpfDigits, setCpfDigits] = useState((profile.cpf ?? "").replace(/\D/g, "").slice(0, 11));
  const [phoneDigits, setPhoneDigits] = useState((profile.phone ?? "").replace(/\D/g, "").slice(0, 11));
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [inGameRole, setInGameRole] = useState(profile.inGameRole);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const bioLengthLabel = useMemo(() => `${bio.length}/280`, [bio.length]);
  const formattedCpf = useMemo(() => formatCpf(cpfDigits), [cpfDigits]);
  const formattedPhone = useMemo(() => formatPhone(phoneDigits), [phoneDigits]);
  const currentRoleLabel = useMemo(() => roleLabel(inGameRole), [inGameRole]);

  useLayoutEffect(() => {
    if (pendingCpfCursorRef.current === null || !cpfInputRef.current) {
      return;
    }

    const cursor = pendingCpfCursorRef.current;
    cpfInputRef.current.setSelectionRange(cursor, cursor);
    pendingCpfCursorRef.current = null;
  }, [formattedCpf]);

  useLayoutEffect(() => {
    if (pendingPhoneCursorRef.current === null || !phoneInputRef.current) {
      return;
    }

    const cursor = pendingPhoneCursorRef.current;
    phoneInputRef.current.setSelectionRange(cursor, cursor);
    pendingPhoneCursorRef.current = null;
  }, [formattedPhone]);

  function handleCpfChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.currentTarget.value;
    const selectionStart = event.currentTarget.selectionStart ?? value.length;
    pendingCpfCursorRef.current = calcMaskedCursorPos(value, selectionStart, formatCpf);
    setCpfDigits(value.replace(/\D/g, "").slice(0, 11));
  }

  function handlePhoneChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.currentTarget.value;
    const selectionStart = event.currentTarget.selectionStart ?? value.length;
    pendingPhoneCursorRef.current = calcMaskedCursorPos(value, selectionStart, formatPhone);
    setPhoneDigits(value.replace(/\D/g, "").slice(0, 11));
  }

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
          fullName: fullName.trim(),
          cpf: cpfDigits,
          phone: phoneDigits,
          birthDate,
          bio: bio.trim(),
          inGameRole,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

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
              CPF, celular e nascimento ficam privados. No perfil público aparecem nome, idade, bio,
              função e seu ELO.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {inGameRole && <Badge variant="secondary">{currentRoleLabel}</Badge>}
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
              ref={cpfInputRef}
              value={formattedCpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              inputMode="numeric"
              autoComplete="off"
              maxLength={14}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
              Celular
            </label>
            <Input
              ref={phoneInputRef}
              value={formattedPhone}
              onChange={handlePhoneChange}
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
            <Badge variant="secondary">{currentRoleLabel}</Badge>
          </div>

          <div role="radiogroup" aria-label="Funcao em jogo" className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {IN_GAME_ROLES.map((role) => {
              const isActive = inGameRole === role.value;
              const RoleIcon = ROLE_ICONS[role.value];

              return (
                <label
                  key={role.value}
                  className={cn(
                    "group relative block cursor-pointer overflow-hidden rounded-xl border bg-[var(--card)] p-4 text-left touch-manipulation select-none transform-gpu transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out will-change-transform focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--ring)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--card)] active:scale-[0.99]",
                    isActive
                      ? "border-[var(--primary)]/45 bg-[var(--primary)]/7 shadow-[0_12px_32px_rgba(0,200,255,0.12)]"
                      : "border-[var(--border)] hover:-translate-y-1 hover:border-[var(--primary)]/35 hover:bg-[var(--secondary)]/85 hover:shadow-[0_10px_28px_rgba(0,0,0,0.35)]"
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

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-950/55 via-transparent to-transparent opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100" />

                  <div className="relative flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-gradient-to-br from-cyan-950 to-slate-900 transition-[transform,border-color,box-shadow] duration-200 ease-out",
                        isActive
                          ? "border-[var(--primary)]/45 shadow-[0_0_18px_rgba(0,200,255,0.14)]"
                          : "border-[var(--border)] group-hover:border-[var(--primary)]/25 group-hover:-translate-y-0.5"
                      )}
                    >
                      <RoleIcon className="h-5 w-5 text-[var(--primary)]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span
                          className={cn(
                            "text-sm font-bold transition-colors duration-200",
                            isActive ? "text-[var(--primary)]" : "group-hover:text-[var(--primary)]"
                          )}
                        >
                          {role.label}
                        </span>
                        {isActive && <Badge variant="default">Selecionado</Badge>}
                      </div>
                      <p className="text-xs leading-relaxed text-[var(--muted-foreground)] transition-colors duration-200 group-hover:text-[var(--foreground)]/78">
                        {role.description}
                      </p>
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
