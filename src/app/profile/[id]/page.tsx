import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProfileShellView from "./profile-shell-view";
import {
  getFallbackProfileStats,
  getMockProfileByPublicId,
  getMockProfileStats,
  getMockRecentMatchesForProfile,
  getMockTeamsForProfile,
} from "@/data/competitive-mock";
import { getPublicDisplayName, isProfileComplete, type UserProfile } from "@/lib/profile";
import { getCurrentProfile, getFaceitRankingPosition, getProfileByPublicId, refreshFaceitStats, syncFaceitTeams } from "@/lib/profiles";
import { getTeamsForProfile } from "@/lib/teams";
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
  const dbProfile = await getProfileByPublicId(publicId);

  if (dbProfile) {
    return dbProfile;
  }

  return getMockProfileByPublicId(publicId);
}

async function getProfilePresentation(profile: UserProfile, useRealTeams: boolean) {
  const faceitStats =
    profile.faceitKdRatio != null
      ? {
          winRate: profile.faceitWinRate ?? 50,
          kdRatio: profile.faceitKdRatio,
          hsRate: profile.faceitHsRate ?? 40,
        }
      : null;

  return {
    stats: faceitStats ?? getMockProfileStats(profile.publicId) ?? getFallbackProfileStats(profile),
    teams: useRealTeams ? await getTeamsForProfile(profile.id) : getMockTeamsForProfile(profile.publicId),
    recentMatches: getMockRecentMatchesForProfile(profile.publicId),
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
  if (profile.faceitId && !profile.id.startsWith("mock-profile-")) {
    profile = await refreshFaceitStats(profile);
  }

  const isOwner = currentProfile?.id === profile.id;
  const isRealProfile = Boolean(profile.id && !profile.id.startsWith("mock-profile-"));

  const [presentation, faceitTeams, faceitRankingPosition] = await Promise.all([
    getProfilePresentation(profile, isRealProfile),
    isRealProfile && profile.faceitId
      ? syncFaceitTeams(profile)
      : Promise.resolve<FaceitTeam[]>([]),
    isRealProfile && profile.faceitId
      ? getFaceitRankingPosition(profile.id)
      : Promise.resolve(null),
  ]);

  return (
    <ProfileShellView
      profile={profile}
      stats={presentation.stats}
      teams={presentation.teams}
      faceitTeams={faceitTeams}
      recentMatches={presentation.recentMatches}
      isOwner={isOwner}
      defaultEditOpen={isOwner && query.edit === "1"}
      showWelcome={isOwner && query.welcome === "1"}
      showCompletionAlert={isOwner && (query.complete === "1" || !isProfileComplete(profile))}
      defaultTab={query.tab === "teams" ? "teams" : "matches"}
      showTeamCreatedNotice={isOwner && query.teamCreated === "1"}
      showTeamDeletedNotice={isOwner && query.teamDeleted === "1"}
      faceitRankingPosition={faceitRankingPosition}
    />
  );
}
