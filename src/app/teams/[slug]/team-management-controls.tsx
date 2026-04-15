"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, UserMinus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditDescriptionButtonProps {
  teamSlug: string;
  currentDescription: string | null | undefined;
}

export function EditDescriptionButton({ teamSlug, currentDescription }: EditDescriptionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentDescription ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setValue(currentDescription ?? "");
      setFeedback(null);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open, currentDescription]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  function handleSave() {
    setFeedback(null);
    startTransition(async () => {
      const response = await fetch(`/api/teams/${teamSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: value.trim() || null }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setFeedback(payload.error ?? "Nao foi possivel salvar.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  const modal = open && typeof document !== "undefined"
    ? createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[var(--background)] shadow-[0_32px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h2 className="text-base font-black tracking-tight text-[var(--foreground)]">Editar descricao do time</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={400}
                rows={4}
                placeholder="Conte sobre o time, estilo de jogo, objetivos..."
                className="w-full resize-none rounded-xl border border-white/10 bg-[var(--secondary)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/30 transition-colors"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted-foreground)]">{value.length}/400</span>
                {feedback && <span className="text-xs text-red-300">{feedback}</span>}
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="button" variant="gradient" onClick={handleSave} disabled={isPending}>
                  {isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)]/30 hover:text-[var(--foreground)]"
        aria-label="Editar descricao"
      >
        <Pencil className="h-3 w-3" />
        Editar
      </button>
      {modal}
    </>
  );
}

interface KickMemberButtonProps {
  teamSlug: string;
  memberId: string;
  displayName: string;
}

interface DeleteTeamButtonProps {
  teamSlug: string;
  redirectPath: string;
}

export function KickMemberButton({ teamSlug, memberId, displayName }: KickMemberButtonProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-2 border-red-500/20 text-red-300 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-200"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm(`Expulsar ${displayName} do time?`)) {
            return;
          }

          setFeedback(null);
          startTransition(async () => {
            const response = await fetch(`/api/teams/${teamSlug}/members/${memberId}`, {
              method: "DELETE",
            });

            const payload = (await response.json()) as { error?: string };

            if (!response.ok) {
              setFeedback(payload.error ?? "Nao foi possivel expulsar o jogador.");
              return;
            }

            router.refresh();
          });
        }}
      >
        <UserMinus className="h-4 w-4" />
        Expulsar
      </Button>

      {feedback && <span className="text-xs text-red-300">{feedback}</span>}
    </div>
  );
}

export function DeleteTeamButton({ teamSlug, redirectPath }: DeleteTeamButtonProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="destructive"
        className="w-full gap-2"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm("Excluir esse time agora? Essa acao arquiva a equipe e remove os membros ativos.")) {
            return;
          }

          setFeedback(null);
          startTransition(async () => {
            const response = await fetch(`/api/teams/${teamSlug}`, {
              method: "DELETE",
            });

            const payload = (await response.json()) as { error?: string; redirectPath?: string };

            if (!response.ok) {
              setFeedback(payload.error ?? "Nao foi possivel excluir o time.");
              return;
            }

            router.push(payload.redirectPath ?? redirectPath);
          });
        }}
      >
        <Trash2 className="h-4 w-4" />
        {isPending ? "Excluindo..." : "Excluir time"}
      </Button>

      {feedback && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {feedback}
        </div>
      )}
    </div>
  );
}
