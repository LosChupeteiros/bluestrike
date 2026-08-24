import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, Lock, ShieldCheck, Trophy, Zap } from "lucide-react";
import type { Metadata } from "next";
import { sanitizeNextPath } from "@/lib/auth/steam";
import { getCurrentProfile, resolveProfilePath } from "@/lib/profiles";

export const metadata: Metadata = {
  title: "Entrar",
  // Fora da busca: e pagina de fluxo, e a URL carrega o parametro ?next=.
  robots: { index: false, follow: false },
};

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  steam_not_configured: "A chave da Steam ainda não foi configurada no ambiente.",
  supabase_not_configured: "As variáveis do Supabase ainda não foram configuradas no ambiente.",
  steam_validation_failed: "Não foi possível validar o retorno da Steam. Tente novamente.",
  steam_profile_fetch_failed: "A Steam autenticou, mas falhou ao buscar os dados públicos do perfil.",
  profile_save_failed: "A Steam autenticou, mas o BlueStrike não conseguiu salvar seu perfil no Supabase. Use uma chave secreta de backend em SUPABASE_SECRET_KEY.",
  steam_login_failed: "A Steam autenticou, mas houve uma falha ao criar sua sessão no BlueStrike.",
};

function SteamIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.187.008l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z" />
    </svg>
  );
}

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [currentProfile, params] = await Promise.all([getCurrentProfile(), searchParams]);
  const nextPath = sanitizeNextPath(params.next);

  if (currentProfile) {
    redirect(nextPath === "/profile" ? resolveProfilePath(currentProfile) : nextPath);
  }

  const steamLoginHref = nextPath === "/profile"
    ? "/api/auth/steam"
    : `/api/auth/steam?next=${encodeURIComponent(nextPath)}`;
  const errorMessage = params.error
    ? LOGIN_ERROR_MESSAGES[params.error] ?? "Não foi possível entrar com a Steam."
    : null;

  return (
    <div className="bs-app-page flex items-center">
      <div className="bs-page-shell">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" /> Voltar ao início
        </Link>

        <section className="bs-command-card grid min-h-[42rem] overflow-hidden lg:grid-cols-[1.08fr_.92fr]">
          <div className="relative hidden min-h-full overflow-hidden bg-[#0b0d0e] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
            <Image src="/assets/banner_bluestrike_home.png" alt="Competição BlueStrike" fill priority sizes="52vw" className="object-cover object-center opacity-75 saturate-125" />
            <span className="absolute inset-0 bg-[linear-gradient(115deg,rgba(5,8,10,.96)_10%,rgba(5,8,10,.68)_55%,rgba(5,8,10,.3))]" />

            <div className="relative inline-flex items-center gap-3">
              <Image src="/assets/logo/bluestrike_logo_header.png" alt="BlueStrike" width={44} height={44} className="rounded-xl" />
              <span className="text-xl font-black tracking-[-0.045em]">Blue<span className="text-[var(--primary)]">Strike</span></span>
            </div>

            <div className="relative max-w-xl">
              <span className="bs-kicker"><Trophy className="h-3.5 w-3.5" /> Sua carreira competitiva</span>
              <h1 className="mt-5 text-4xl font-black leading-[.98] tracking-[-0.055em] xl:text-6xl">
                Entre. Compita.<br /><span className="text-[var(--primary)]">Deixe sua marca.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-white/64">
                Campeonatos de CS2, ELO, times e premiações em PIX reunidos em uma única identidade competitiva.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {["Conta Steam verificada", "1x1 até 5x5", "Premiação em PIX"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/28 px-3 py-2 text-xs text-white/76 backdrop-blur-md">
                    <Check className="h-3.5 w-3.5 text-green-400" /> {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center p-6 sm:p-10 xl:p-14">
            <div className="mx-auto w-full max-w-md">
              <span className="bs-kicker"><Zap className="h-3.5 w-3.5" /> Acesso competitivo</span>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] sm:text-4xl">Continue sua jornada.</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">Use sua Steam para acessar o perfil, seus times, inscrições e partidas.</p>

              {errorMessage && (
                <div className="mt-6 rounded-2xl border border-red-500/24 bg-red-500/8 px-4 py-3 text-sm text-red-300">
                  <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{errorMessage}</span></div>
                </div>
              )}

              <div className="mt-8 space-y-3">
                <a href={steamLoginHref} className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-[#5f7d99]/42 bg-[#1b2838] text-sm font-bold text-white shadow-[0_14px_34px_rgba(13,26,40,.26)] transition-[transform,background-color,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#78a7cf]/58 hover:bg-[#25384b] active:translate-y-0">
                  <SteamIcon /> Entrar com Steam
                </a>
                <p className="text-center text-xs leading-5 text-[var(--muted-foreground)]">
                  A Steam é o único login: é ela que garante que a SteamID do servidor é a mesma
                  do perfil aqui.
                </p>
              </div>

              <div className="mt-7 space-y-2.5">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Só a Steam entra em campo",
                    body: "Nada de senha nova: a autenticação acontece no domínio da Valve e o BlueStrike só recebe a confirmação.",
                  },
                  {
                    icon: Lock,
                    title: "Seus dados ficam privados",
                    body: "CPF, celular e chave PIX são usados para inscrição e premiação. Nunca aparecem no seu perfil público.",
                  },
                  {
                    icon: Trophy,
                    title: "Do 1x1 ao 5x5",
                    body: "Uma line por modalidade, veto de mapas, servidor dedicado e prêmio pago em PIX.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--field)] p-3.5 shadow-[var(--inset-shadow)]"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--foreground)]">
                          {item.title}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{item.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-7 text-xs leading-5 text-[var(--muted-foreground)]">
                Ao entrar, você concorda com nossos <Link href="/terms" className="text-[var(--primary)] hover:underline">Termos de Uso</Link> e <Link href="/privacy" className="text-[var(--primary)] hover:underline">Política de Privacidade</Link>.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
