import { cookies } from "next/headers";
import { createSecretClient } from "./supabase";

export const ADMIN_COOKIE = "ayo-admin-token";

export async function getAdmin() {
  const supabase = createSecretClient();
  if (!supabase) return null;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;
  const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  return data ? { user, token } : null;
}

