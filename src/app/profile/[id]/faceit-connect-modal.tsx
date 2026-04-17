"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import ProfileModalShell from "./profile-modal-shell";

interface FaceitConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type State = "idle" | "loading" | "success" | "error" | "mismatch";

export default function FaceitConnectModal({ isOpen, onClose }: FaceitConnectModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [successNick, setSuccessNick] = useState("");

  // Após sucesso, fecha o modal e atualiza a página
  useEffect(() => {
    if (state !== "success") return;
    const t = setTimeout(() => {
      router.refresh();
      onClose();
    }, 1800);
    return () => clearTimeout(t);
  }, [state, router, onClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nickname = inputRef.current?.value.trim() ?? "";

    if (!nickname) {
      setState("error");
      setErrorMsg("Informe seu nickname da FACEIT.");
      return;
    }

    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/profile/faceit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState(res.status === 422 ? "mismatch" : "error");
        setErrorMsg(data?.error ?? "Erro ao conectar FACEIT.");
        return;
      }

      setSuccessNick(nickname);
      setState("success");
    } catch {
      setState("error");
      setErrorMsg("Sem conexão. Tente novamente.");
    }
  }

  function handleClose() {
    setState("idle");
    setErrorMsg("");
    setSuccessNick("");
    onClose();
  }

  return (
    <ProfileModalShell
      open={isOpen}
      onClose={handleClose}
      title="Conectar FACEIT"
      description="Informe seu nickname da FACEIT para vincular sua conta e exibir seu perfil competitivo."
      widthClassName="max-w-md"
    >
      <div className="p-6">
        {state === "success" ? (
          /* ── Tela de sucesso ── */
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-green-500/30 bg-green-500/15">
              <ShieldCheck className="h-7 w-7 text-green-400" />
            </div>
            <div>
              <div className="text-base font-black text-[var(--foreground)]">
                FACEIT conectada
              </div>
              <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                <span className="font-semibold text-[var(--foreground)]">{successNick}</span> foi vinculada ao seu perfil com sucesso.
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
              <span className="h-3 w-3 animate-spin rounded-full border border-[var(--muted-foreground)]/30 border-t-[var(--muted-foreground)]" />
              Atualizando perfil...
            </div>
          </div>
        ) : (
          <>
            {/* ── Branding strip ── */}
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#FF5500]/20 bg-[#FF5500]/8 px-4 py-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: "#FF5500" }}
              >
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" aria-hidden="true">
                  <path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="white"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-black" style={{ color: "#FF5500" }}>FACEIT</div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  O SteamID da conta deve ser o mesmo da BlueStrike.
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="faceit-nickname"
                  className="mb-2 block text-sm font-semibold text-[var(--foreground)]"
                >
                  Nickname FACEIT
                </label>
                <input
                  ref={inputRef}
                  id="faceit-nickname"
                  type="text"
                  placeholder="Ex: IsacChupeta"
                  autoComplete="off"
                  autoFocus
                  disabled={state === "loading"}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none transition-colors focus:border-[#FF5500]/60 focus:ring-1 focus:ring-[#FF5500]/30 disabled:opacity-50"
                />
              </div>

              {(state === "error" || state === "mismatch") && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    state === "mismatch"
                      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={state === "loading"}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: "#FF5500" }}
              >
                {state === "loading" ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Verificando...
                  </>
                ) : (
                  "Conectar conta FACEIT"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </ProfileModalShell>
  );
}
