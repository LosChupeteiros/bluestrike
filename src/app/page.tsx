import { getCurrentProfile } from "@/lib/profiles";
import Hero from "@/components/home/hero";
import FeaturedTournaments from "@/components/home/featured-tournaments";
import RankingPreview from "@/components/home/ranking-preview";
import SocialProof from "@/components/home/social-proof";

export default async function HomePage() {
  const currentProfile = await getCurrentProfile();
  const isLoggedIn = currentProfile !== null;

  return (
    <>
      <Hero isLoggedIn={isLoggedIn} />
      <FeaturedTournaments />
      <RankingPreview />
      <SocialProof isLoggedIn={isLoggedIn} />
    </>
  );
}
