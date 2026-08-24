import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProfileShellView from "./profile-shell-view";
import { getProfileAge, getPublicDisplayName, isProfileComplete, toPublicProfile, type UserProfile } from "@/lib/profile";
import { getCurrentProfile, getFaceitRankingPosition, getProfileByPublicId, refreshFaceitStats, syncFaceitTeams } from "@/lib/profiles";
import { getTeamsForProfile } from "@/lib/teams";
import { getRecentMatchesForProfile } from "@/lib/matches";
import type { FaceitTeam } from "@/lib/faceit";

interface ProfilePageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    edit?: string;
    welcome?: string;
    complete?: string;
    tab?: string;
    teamCreated?: string;
    teamDeleted?: string;
  }>;
}

function parsePublicId(value: string) {
  const publicId = Number(value);

  if (!Number.isInteger(publicId) || publicId <= 0) {
    return null;
  }

  return publicId;
}

async function getPageProfile(publicId: number) {
  return getProfileByPublicId(publicId);
}

async function getProfilePresentation(profile: UserProfile) {
  // Só estatística real. Antes, quem não tinha FACEIT vinculado recebia números
  // derivados do ELO (`getFallbackProfileStats`) — um jogador de verdade via
  // 50% de vitória, 1.00 de K/D e 40% de HS que ninguém tinha jogado para
  // conquistar, apresentados como se fossem o desempenho dele. `null` aqui é o
  // que faz a tela mostrar estado vazio em vez de número inventado.
  const stats =
    profile.faceitKdRatio != null
      ? {
          winRate: profile.faceitWinRate ?? 0,
          kdRatio: profile.faceitKdRatio,
          hsRate: profile.faceitHsRate ?? 0,
        }
      : null;

  return {
    stats,
    teams: await getTeamsForProfile(profile.id),
    recentMatches: await getRecentMatchesForProfile(profile.id),
  };
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const publicId = parsePublicId(id);

  if (!publicId) {
    return { title: "Perfil" };
  }

  const profile = await getPageProfile(publicId);

  if (!profile) {
    return { title: "Perfil" };
  }

  return {
    title: getPublicDisplayName(profile),
  };
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const [{ id }, query, currentProfile] = await Promise.all([params, searchParams, getCurrentProfile()]);
  const publicId = parsePublicId(id);

  if (!publicId) {
    notFound();
  }

  let profile = await getPageProfile(publicId);

  if (!profile) {
    notFound();
  }

  // Atualiza ELO/level Faceit a cada carregamento de página (perfis reais com conta vinculada)
  if (profile.faceitId) {
    profile = await refreshFaceitStats(profile);
  }

  const isOwner = currentProfile?.id === profile.id;

  const [presentation, faceitTeams, faceitRankingPosition] = await Promise.all([
    getProfilePresentation(profile),
    profile.faceitId
      ? syncFaceitTeams(profile)
      : Promise.resolve<FaceitTeam[]>([]),
    profile.faceitId
      ? getFaceitRankingPosition(profile.id)
      : Promise.resolve(null),
  ]);

  // Visitante nunca recebe CPF, telefone, data de nascimento nem e-mail.
  // O dono continua recebendo tudo porque o modal de edição precisa preencher.
  const profileForClient = isOwner ? profile : toPublicProfile(profile);

  return (
    <ProfileShellView
      profile={profileForClient}
      stats={presentation.stats}
      teams={presentation.teams}
      faceitTeams={faceitTeams}
      recentMatches={presentation.recentMatches}
      isOwner={isOwner}
      defaultEditOpen={isOwner && query.edit === "1"}
      showWelcome={isOwner && query.welcome === "1"}
      showCompletionAlert={isOwner && (query.complete === "1" || !isProfileComplete(profile))}
      publicAge={getProfileAge(profile.birthDate)}
      showTeamCreatedNotice={isOwner && query.teamCreated === "1"}
      showTeamDeletedNotice={isOwner && query.teamDeleted === "1"}
      faceitRankingPosition={faceitRankingPosition}
    />
  );
}
