import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, Shield, Sparkles, Users } from "lucide-react";
import CreateTeamFormClient from "./create-team-form-client";
import { getCurrentProfile, resolveProfilePath } from "@/lib/profiles";

export const metadata: Metadata = {
  title: "Criar time",
};

export default async function CreateTeamPage() {
  const currentProfile = await getCurrentProfile();
  const backHref = currentProfile ? resolveProfilePath(currentProfile) : "/profile/1";
  const successRedirectPath = currentProfile
    ? `${resolveProfilePath(currentProfile)}?tab=teams&teamCreated=1`
    : "/auth/login?next=/teams/create";

  return (
    <div className="bs-app-page">
      <div className="bs-page-shell">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao perfil
        </Link>

        <div className="bs-command-card relative mb-8 overflow-hidden p-6 sm:p-8 lg:p-10">
          <span className="pointer-events-none absolute -right-20 -top-36 h-80 w-80 rounded-full border-[46px] border-[var(--primary)]/10" aria-hidden="true" />
          <span className="pointer-events-none absolute right-24 top-10 h-2 w-2 rounded-full bg-[var(--primary)] shadow-[0_0_0_8px_color-mix(in_srgb,var(--primary)_8%,transparent)]" aria-hidden="true" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="bs-kicker"><Shield className="h-3.5 w-3.5" /> Gestão de equipes</div>
              <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">Construa sua próxima line.</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
                Defina a identidade, configure o acesso e convide sua equipe. O time nasce pronto para entrar no circuito BlueStrike.
              </p>
            </div>
            <div className="hidden gap-3 lg:flex">
              <span className="bs-pill inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold"><Users className="h-4 w-4 text-[var(--primary)]" /> Line 5v5</span>
              <span className="bs-pill inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold"><Sparkles className="h-4 w-4 text-[var(--primary)]" /> Perfil público</span>
            </div>
          </div>
        </div>

        <CreateTeamFormClient backHref={backHref} successRedirectPath={successRedirectPath} />
      </div>
    </div>
  );
}
