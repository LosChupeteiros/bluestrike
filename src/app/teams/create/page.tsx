import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, Shield } from "lucide-react";
import CreateTeamForm from "./create-team-form";
import { getCurrentProfile, resolveProfilePath } from "@/lib/profiles";

export const metadata: Metadata = {
  title: "Criar time",
};

export default async function CreateTeamPage() {
  const currentProfile = await getCurrentProfile();
  const backHref = currentProfile ? resolveProfilePath(currentProfile) : "/profile/1";

  return (
    <div className="min-h-screen pb-20 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao perfil
        </Link>

        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
            <Shield className="h-4 w-4" />
            Gestão de equipes
          </div>
          <h1 className="text-4xl font-black tracking-tight">Crie seu time competitivo</h1>
          <p className="mt-2 max-w-3xl text-[var(--muted-foreground)]">
            Defina identidade, senha de convite e distribua o link para os amigos. À medida que o
            time enche, você ajusta a função in-game de cada jogador e inscreve em campeonatos.
          </p>
        </div>

        <CreateTeamForm backHref={backHref} />
      </div>
    </div>
  );
}
