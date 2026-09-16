import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "../../../../lib/admin";
import { createPublicClient, createSecretClient } from "../../../../lib/supabase";

export async function POST(request) {
  const publicClient = createPublicClient();
  const secretClient = createSecretClient();
  if (!publicClient || !secretClient) return NextResponse.json({ error: "Supabase belum dikonfigurasi." }, { status: 503 });
  const body = await request.json().catch(() => null);
  const { data, error } = await publicClient.auth.signInWithPassword({ email: body?.email ?? "", password: body?.password ?? "" });
  if (error || !data.session) return NextResponse.json({ error: "Email atau password tidak cocok." }, { status: 401 });
  const { data: admin } = await secretClient.from("admin_users").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) return NextResponse.json({ error: "Akun ini bukan admin." }, { status: 403 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, data.session.access_token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict",
    path: "/", maxAge: Math.min(data.session.expires_in, 3600),
  });
  return response;
}

