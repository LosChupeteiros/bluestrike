import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ShieldCheck, Swords } from "lucide-react";
import type { Metadata } from "next";
import { sanitizeNextPath } from "@/lib/auth/steam";
import { getCurrentProfile, resolveProfilePath } from "@/lib/profiles";

export const metadata: Metadata = { title: "Entrar" };

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  steam_not_configured: "A chave da Steam ainda nao foi configurada no ambiente.",
  supabase_not_configured: "As variaveis do Supabase ainda nao foram configuradas no ambiente.",
  steam_validation_failed: "Nao foi possivel validar o retorno da Steam. Tente novamente.",
  steam_profile_fetch_failed: "A Steam autenticou, mas falhou ao buscar os dados publicos do perfil.",
  profile_save_failed: "A Steam autenticou, mas o BlueStrike nao conseguiu salvar seu perfil no Supabase. Use uma chave secreta de backend em SUPABASE_SECRET_KEY.",
  steam_login_failed: "A Steam autenticou, mas houve uma falha ao criar sua sessao no BlueStrike.",
};

function SteamIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.187.008l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z" />
    </svg>
  );
}

interface LoginPageProps {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [currentProfile, params] = await Promise.all([getCurrentProfile(), searchParams]);

  const nextPath = sanitizeNextPath(params.next);

  if (currentProfile) {
    redirect(nextPath === "/profile" ? resolveProfilePath(currentProfile) : nextPath);
  }

  const steamLoginHref =
    nextPath === "/profile" ? "/api/auth/steam" : `/api/auth/steam?next=${encodeURIComponent(nextPath)}`;
  const errorMessage = params.error ? LOGIN_ERROR_MESSAGES[params.error] ?? "Nao foi possivel entrar com a Steam." : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-12">
      <div className="fixed inset-0 grid-bg opacity-50 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--primary)] mb-4 shadow-lg glow">
              <Swords className="w-7 h-7 text-black" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Blue<span className="text-[var(--primary)]">Strike</span>
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1 text-center">
              Entre com sua conta da Steam para competir e completar seu cadastro competitivo.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <a
              href={steamLoginHref}
              className="w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-[#1b2838] hover:bg-[#253547] border border-[#1b2838] hover:border-[#4c6b8a] text-white font-bold text-sm transition-all duration-200 shadow-md hover:shadow-[0_0_20px_rgba(70,130,180,0.3)] active:scale-[0.98]"
            >
              <SteamIcon />
              Entrar com Steam
            </a>

            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-[var(--border)] bg-transparent text-[var(--muted-foreground)] font-medium text-sm opacity-60 cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google em breve
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]/80">
              Cadastro obrigatorio apos login
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
              Vamos pedir Nome Completo, CPF, Celular e Data de Nascimento para liberar o seu perfil competitivo.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
              Login seguro
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
              Sessao protegida
            </span>
          </div>

          <p className="text-center text-xs text-[var(--muted-foreground)] mt-6 leading-relaxed">
            Ao entrar, voce concorda com nossos{" "}
            <Link href="/terms" className="text-[var(--primary)] hover:underline">
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="text-[var(--primary)] hover:underline">
              Politica de Privacidade
            </Link>
            .
          </p>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Voltar para o inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
