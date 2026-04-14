import Hero from "@/components/home/hero";
import FeaturedTournaments from "@/components/home/featured-tournaments";
import RankingPreview from "@/components/home/ranking-preview";
import SocialProof from "@/components/home/social-proof";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedTournaments />
      <RankingPreview />
      <SocialProof />
    </>
  );
}
