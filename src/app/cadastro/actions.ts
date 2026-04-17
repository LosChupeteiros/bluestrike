"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { getSession } from "@/lib/auth/session";
import { updateProfile } from "@/lib/profiles";
import { type ProfileUpdateInput } from "@/lib/profile";

export async function saveProfile(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const session = await getSession();
  if (!session) return "Você precisa estar logado.";

  try {
    // bio and inGameRole are optional in the schema.
    // Omit them when the form doesn't include them so Zod treats the field as
    // undefined → transforms to null, instead of receiving null directly which
    // Zod v4 rejects for z.string().optional() fields.
    const rawBio = formData.get("bio");
    const rawInGameRole = formData.get("inGameRole");

    const input = {
      fullName: formData.get("fullName")?.toString() ?? "",
      cpf: formData.get("cpf")?.toString() ?? "",
      phone: formData.get("phone")?.toString() ?? "",
      birthDate: formData.get("birthDate")?.toString() ?? "",
      email: formData.get("email")?.toString() ?? "",
      ...(rawBio != null ? { bio: rawBio.toString() } : {}),
      ...(rawInGameRole != null ? { inGameRole: rawInGameRole.toString() } : {}),
    } as ProfileUpdateInput; // runtime shape matches what profileUpdateSchema.parse() accepts

    const profile = await updateProfile(session.profileId, input);

    redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ZodError) return error.issues[0]?.message ?? "Dados inválidos.";
    return error instanceof Error ? error.message : "Não foi possível salvar o perfil.";
  }

  return null;
}
