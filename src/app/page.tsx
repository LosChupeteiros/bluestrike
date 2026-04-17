import { getCurrentProfile } from "@/lib/profiles";
import Hero from "@/components/home/hero";
import RankingPreview from "@/components/home/ranking-preview";
import SocialProof from "@/components/home/social-proof";

export default async function HomePage() {
  const currentProfile = await getCurrentProfile();
  const isLoggedIn = currentProfile !== null;

  return (
    <>
      <Hero isLoggedIn={isLoggedIn} />
      <RankingPreview />
      <SocialProof isLoggedIn={isLoggedIn} />
    </>
  );
}
