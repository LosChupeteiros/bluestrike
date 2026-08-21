"use client";

import { useActionState, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Banknote, ChevronLeft, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCpf, formatPhone, PIX_KEY_TYPES, type PixKeyType, type UserProfile } from "@/lib/profile";
import { saveProfile } from "./actions";

interface CadastroFormProps {
  profile: UserProfile;
  isWelcome?: boolean;
}

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

export default function CadastroForm({ profile, isWelcome }: CadastroFormProps) {
  const [errorMessage, formAction, isPending] = useActionState(saveProfile, null);
  const cpfInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const pendingCpfCursorRef = useRef<number | null>(null);
  const pendingPhoneCursorRef = useRef<number | null>(null);

  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [cpfDigits, setCpfDigits] = useState((profile.cpf ?? "").replace(/\D/g, "").slice(0, 11));
  const [phoneDigits, setPhoneDigits] = useState((profile.phone ?? "").replace(/\D/g, "").slice(0, 11));
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? "");
  const [email, setEmail] = useState(profile.email ?? "");
  const [pixKeyType, setPixKeyType] = useState<PixKeyType | null>(profile.pixKeyType);
  const [pixKey, setPixKey] = useState(profile.pixKeyType === "random" ? (profile.pixKey ?? "") : "");

  // CPF/celular/e-mail reaproveitam o que já está no cadastro
  const derivedPixKey =
    pixKeyType === "cpf" ? cpfDigits
    : pixKeyType === "phone" ? phoneDigits
    : pixKeyType === "email" ? email.trim()
    : "";

  const formattedCpf = useMemo(() => formatCpf(cpfDigits), [cpfDigits]);
  const formattedPhone = useMemo(() => formatPhone(phoneDigits), [phoneDigits]);

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
    const el = event.currentTarget;
    const selectionStart = el.selectionStart ?? el.value.length;
    const newDigits = el.value.replace(/\D/g, "").slice(0, 11);
    pendingCpfCursorRef.current = calcMaskedCursorPos(el.value, selectionStart, formatCpf);
    setCpfDigits(newDigits);
  }

  function handlePhoneChange(event: React.ChangeEvent<HTMLInputElement>) {
    const el = event.currentTarget;
    const selectionStart = el.selectionStart ?? el.value.length;
    const newDigits = el.value.replace(/\D/g, "").slice(0, 11);
    pendingPhoneCursorRef.current = calcMaskedCursorPos(el.value, selectionStart, formatPhone);
    setPhoneDigits(newDigits);
  }

  return (
    <div className="mx-auto w-[min(calc(100%-2rem),56rem)]">
      <Link
        href={`/profile/${profile.publicId}`}
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar ao perfil
      </Link>

      {isWelcome && (
        <div className="mb-6 rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/6 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
            <ShieldCheck className="h-4 w-4" />
            Conta Steam conectada com sucesso
          </div>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Preencha os dados abaixo para liberar sua participação nos campeonatos.
          </p>
        </div>
      )}

      {/* Steam account confirmation */}
      <div className="bs-form-card mb-6 flex items-center gap-4 p-5 sm:p-6">
        <Avatar className="h-14 w-14 shrink-0 ring-2 ring-[var(--primary)]/30">
          <AvatarImage src={profile.steamAvatarUrl ?? undefined} alt={profile.steamPersonaName} />
          <AvatarFallback className="text-lg font-black">
            {profile.steamPersonaName.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-black">{profile.steamPersonaName}</span>
            <Badge variant="open">Steam conectado</Badge>
          </div>
          <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            Nível {profile.steamLevel} · ID {profile.steamId}
          </div>
        </div>
      </div>

      {/* Registration form */}
      <div className="bs-command-card p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight">Cadastro competitivo</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
            CPF, celular e data de nascimento ficam protegidos. No perfil público aparecem só nome, idade e ELO.
          </p>
        </div>

        <form action={formAction} className="space-y-5">
          {/* Preserve bio and inGameRole — not editable here */}
          {profile.bio != null && (
            <input type="hidden" name="bio" value={profile.bio} />
          )}
          {profile.inGameRole != null && (
            <input type="hidden" name="inGameRole" value={profile.inGameRole} />
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
              Nome completo
            </label>
            <Input
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome e sobrenome"
              autoComplete="name"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                Data de nascimento
              </label>
              <Input
                type="date"
                name="birthDate"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                E-mail
              </label>
              <Input
                type="text"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                inputMode="email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                CPF
              </label>
              {/* Display-only (formatted) — value sent via hidden input below */}
              <Input
                ref={cpfInputRef}
                value={formattedCpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                inputMode="numeric"
                autoComplete="off"
                maxLength={14}
              />
              <input type="hidden" name="cpf" value={cpfDigits} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                Celular
              </label>
              {/* Display-only (formatted) — value sent via hidden input below */}
              <Input
                ref={phoneInputRef}
                value={formattedPhone}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-0000"
                inputMode="tel"
                autoComplete="tel"
              />
              <input type="hidden" name="phone" value={phoneDigits} />
            </div>
          </div>


          {/* ── Chave PIX (premiação) ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/25 p-4 sm:p-5">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#f5c842]">
              <Banknote className="h-3.5 w-3.5" aria-hidden="true" />
              Chave PIX
            </div>
            <p className="mb-4 text-xs leading-relaxed text-[var(--muted-foreground)]">
              É por aqui que a premiação cai quando seu time vence. Visível só para você e para a
              organização — nunca aparece no seu perfil público.
            </p>

            <div
              role="radiogroup"
              aria-label="Tipo de chave PIX"
              className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {PIX_KEY_TYPES.map((option) => {
                const isActive = pixKeyType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => setPixKeyType(isActive ? null : option.value)}
                    className={`flex min-h-11 flex-col items-center justify-center rounded-xl border px-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/45 ${
                      isActive
                        ? "border-[#f5c842]/55 bg-[#f5c842]/10 text-[#f5c842]"
                        : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[#f5c842]/35 hover:text-[var(--foreground)]"
                    }`}
                  >
                    <span className="text-xs font-black leading-none">{option.label}</span>
                  </button>
                );
              })}
            </div>

            <input type="hidden" name="pixKeyType" value={pixKeyType ?? ""} />

            {pixKeyType === "random" ? (
              <Input
                name="pixKey"
                value={pixKey}
                onChange={(event) => setPixKey(event.target.value)}
                placeholder="Cole a chave aleatória do seu banco"
                autoComplete="off"
                maxLength={140}
              />
            ) : (
              <>
                <input type="hidden" name="pixKey" value={derivedPixKey} />
                <p className="rounded-xl border border-[var(--border)] bg-black/20 px-4 py-3 text-xs text-[var(--muted-foreground)]">
                  {pixKeyType
                    ? derivedPixKey
                      ? `Vamos usar ${PIX_KEY_TYPES.find((o) => o.value === pixKeyType)?.label.toLowerCase()} do cadastro acima.`
                      : "Preencha o campo correspondente acima para usar essa chave."
                    : "Escolha um tipo de chave para receber a premiação."}
                </p>
              </>
            )}
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          {/* Consentimento informado: o jogador vê os documentos antes de enviar
              CPF, celular e chave PIX. */}
          <p className="rounded-xl border border-[var(--border)] bg-[var(--secondary)]/25 px-4 py-3 text-xs leading-6 text-[var(--muted-foreground)]">
            Ao concluir o cadastro, você concorda com os{" "}
            <Link href="/terms" className="font-semibold text-[var(--primary)] underline-offset-2 hover:underline">
              Termos de Uso
            </Link>{" "}
            e declara ter lido a{" "}
            <Link href="/privacy" className="font-semibold text-[var(--primary)] underline-offset-2 hover:underline">
              Política de Privacidade
            </Link>
            . CPF, celular, data de nascimento e chave PIX são usados para validar sua
            maioridade, evitar conta duplicada e pagar premiação — e nunca aparecem no seu
            perfil público.
          </p>

          <Button type="submit" size="lg" variant="gradient" loading={isPending} className="w-full">
            Salvar e entrar no hub
          </Button>
        </form>
      </div>
    </div>
  );
}
