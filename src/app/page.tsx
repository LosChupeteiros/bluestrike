import { getHomeSnapshot } from "@/lib/home";
import Hero from "@/components/home/hero";
import FeaturedTournaments from "@/components/home/featured-tournaments";
import PlatformGrid from "@/components/home/platform-grid";
import HowItWorks from "@/components/home/how-it-works";
import RankingPreview from "@/components/home/ranking-preview";
import HomeMotion from "@/components/home/home-motion";

export default async function HomePage() {
  const snapshot = await getHomeSnapshot();

  return (
    <HomeMotion>
      <Hero />
      <FeaturedTournaments />
      <PlatformGrid />
      <HowItWorks />
      <RankingPreview players={snapshot.topPlayers} />
    </HomeMotion>
  );
}
