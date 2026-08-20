import { getCurrentProfile } from "@/lib/profiles";
import Hero from "@/components/home/hero";
import PlatformGrid from "@/components/home/platform-grid";
import HowItWorks from "@/components/home/how-it-works";
import RankingPreview from "@/components/home/ranking-preview";
import ClosingCta from "@/components/home/closing-cta";

export default async function HomePage() {
  const currentProfile = await getCurrentProfile();
  const isLoggedIn = currentProfile !== null;

  return (
    <>
      {/* Attention */}
      <Hero isLoggedIn={isLoggedIn} />
      {/* Interest */}
      <PlatformGrid />
      {/* Desire — how it plays out, and who is winning */}
      <HowItWorks />
      <RankingPreview />
      {/* Action */}
      <ClosingCta isLoggedIn={isLoggedIn} />
    </>
  );
}
