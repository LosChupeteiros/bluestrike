import Header from "./header";
import { getCurrentProfile } from "@/lib/profiles";

export default async function HeaderWithUser() {
  const currentProfile = await getCurrentProfile();

  return (
    <Header
      user={
        currentProfile
          ? {
              displayName: currentProfile.steamPersonaName,
              steamAvatarUrl: currentProfile.steamAvatarUrl,
              elo: currentProfile.elo,
              publicId: currentProfile.publicId,
              isAdmin: currentProfile.isAdmin,
            }
          : null
      }
    />
  );
}
