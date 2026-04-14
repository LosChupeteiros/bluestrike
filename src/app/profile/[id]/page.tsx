import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProfileShell from "./profile-shell";
import {
  getFallbackProfileStats,
  getMockProfileByPublicId,
  getMockProfileStats,
  getMockRecentMatchesForProfile,
  getMockTeamsForProfile,
} from "@/data/competitive-mock";
import { getPublicDisplayName, isProfileComplete, type UserProfile } from "@/lib/profile";
import { getCurrentProfile, getProfileByPublicId } from "@/lib/profiles";

interface ProfilePageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    edit?: string;
    welcome?: string;
    complete?: string;
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

function getProfilePresentation(profile: UserProfile) {
  return {
    stats: getMockProfileStats(profile.publicId) ?? getFallbackProfileStats(profile),
    teams: getMockTeamsForProfile(profile.publicId),
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

  const profile = await getPageProfile(publicId);

  if (!profile) {
    notFound();
  }

  const isOwner = currentProfile?.id === profile.id;
  const presentation = getProfilePresentation(profile);

  return (
    <ProfileShell
      profile={profile}
      stats={presentation.stats}
      teams={presentation.teams}
      recentMatches={presentation.recentMatches}
      isOwner={isOwner}
      defaultEditOpen={isOwner && query.edit === "1"}
      showWelcome={isOwner && query.welcome === "1"}
      showCompletionAlert={isOwner && (query.complete === "1" || !isProfileComplete(profile))}
    />
  );
}
