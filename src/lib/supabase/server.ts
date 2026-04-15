import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl() {
  const value = process.env.SUPABASE_URL;

  if (!value) {
    throw new Error("SUPABASE_URL nao foi configurada.");
  }

  return value;
}

function getSupabaseSecretKey() {
  const value = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!value) {
    throw new Error(
      "SUPABASE_SECRET_KEY nao foi configurada. Use SUPABASE_SERVICE_ROLE_KEY apenas se estiver no formato legado."
    );
  }

  return value;
}

export function createSupabaseAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
