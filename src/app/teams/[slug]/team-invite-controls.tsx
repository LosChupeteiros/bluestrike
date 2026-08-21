"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeamInviteControlsProps {
  joinCode: string;
  hasPassword: boolean;
  /** Vagas restantes no elenco — 0 esconde o convite. */
  openSlots: number;
  modeLabel: string;
}

/**
 * O capitão precisa COMPARTILHAR o convite, não entrar no próprio time.
 * Antes era um link que navegava o próprio dono para a tela de entrada.
 */
export default function TeamInviteControls({
  joinCode,
  hasPassword,
  openSlots,
  modeLabel,
}: TeamInviteControlsProps) {
  const [inviteUrl, setInviteUrl] = useState(`/teams/join/${joinCode}`);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  useEffect(() => {
    setInviteUrl(`${window.location.origin}/teams/join/${joinCode}`);
  }, [joinCode]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy(value: string, kind: "link" | "code") {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement("textarea");
      el.value = value;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(kind);
  }

  if (openSlots <= 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)]/30 px-4 py-3">
        <p className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)]">
          <Lock className="h-3.5 w-3.5 text-[var(--muted-foreground)]" aria-hidden="true" />
          Elenco completo
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
          Um time de {modeLabel} já está no limite de jogadores. Remova alguém do elenco para
          liberar o convite.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="rounded-xl border border-[var(--border)] bg-black/25 px-3 py-2.5">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Link do convite
        </p>
        <p className="truncate font-mono text-[11px] text-[var(--foreground)]" title={inviteUrl}>
          {inviteUrl}
        </p>
      </div>

      <Button
        type="button"
        variant="gradient"
        className="w-full gap-2"
        onClick={() => copy(inviteUrl, "link")}
      >
        {copied === "link" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {copied === "link" ? "Link copiado" : "Copiar link do convite"}
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={() => copy(joinCode, "code")}
      >
        {copied === "code" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied === "code" ? "Código copiado" : "Copiar só o código"}
      </Button>

      <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">
        {hasPassword
          ? "Mande o link e a senha para o jogador. Ele abre, digita a senha e entra direto no time."
          : "Esse time não tem senha: quem abrir o link entra direto. Defina uma senha se quiser controlar a entrada."}
        {" "}Restam <span className="font-bold text-[var(--foreground)]">{openSlots}</span>{" "}
        {openSlots === 1 ? "vaga" : "vagas"}.
      </p>
    </div>
  );
}
