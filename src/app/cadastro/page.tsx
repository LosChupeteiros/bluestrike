import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentProfile, resolveProfilePath } from "@/lib/profiles";
import { isProfileComplete } from "@/lib/profile";
import CadastroForm from "./cadastro-form";

export const metadata: Metadata = {
  title: "Cadastro competitivo",
};

interface CadastroPageProps {
  searchParams: Promise<{ welcome?: string }>;
}

export default async function CadastroPage({ searchParams }: CadastroPageProps) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/auth/login?next=/cadastro");
  }

  if (isProfileComplete(profile)) {
    redirect(resolveProfilePath(profile));
  }

  const { welcome } = await searchParams;

  return (
    <div className="min-h-screen pb-20 pt-20">
      <CadastroForm profile={profile} isWelcome={welcome === "1"} />
    </div>
  );
}
