import { redirect } from "next/navigation";
import { requireCurrentProfile, resolveProfilePath } from "@/lib/profiles";

export default async function ProfileIndexPage() {
  const profile = await requireCurrentProfile("/profile");

  redirect(resolveProfilePath(profile));
}
