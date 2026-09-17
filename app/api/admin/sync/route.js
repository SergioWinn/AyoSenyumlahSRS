import { NextResponse } from "next/server";
import { getAdmin } from "../../../../lib/admin";
import { buildJkt48Cookie, jkt48RequestHeaders } from "../../../../lib/jkt48";
import { createSecretClient } from "../../../../lib/supabase";
import { saveSourceSnapshot, snapshotFailureMessage } from "../../../../lib/sync-source";
import { serverError } from "../../../../lib/api-response";

export async function POST(request) {
  if (!await getAdmin()) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  const supabase = createSecretClient();
  const body = await request.json().catch(() => ({}));
  let cookie;
  try {
    cookie = buildJkt48Cookie(body?.waitingRoomCookie || process.env.JKT48_COOKIE || "");
  } catch (caught) {
    return NextResponse.json({ error: caught.message }, { status: 400 });
  }
  let query = supabase.from("event_sources").select("id,exclusive_code");
  if (body?.sourceId) query = query.eq("id", body.sourceId);
  const { data: sources, error } = await query;
  if (error) return serverError(error, "Daftar sumber belum bisa dimuat.");
  if (!sources?.length) return NextResponse.json({ error: body?.sourceId ? "Sumber event tidak ditemukan." : "Belum ada sumber event untuk disinkronkan." }, { status: body?.sourceId ? 404 : 400 });

  const results = [];
  for (const source of sources ?? []) {
    try {
      await supabase.from("event_sources").update({
        sync_status: "syncing", last_attempt_at: new Date().toISOString(), sync_error: null,
      }).eq("id", source.id);
      const response = await fetch(`https://jkt48.com/api/v1/exclusives/${encodeURIComponent(source.exclusive_code)}/bonus?lang=id`, {
        cache: "no-store",
        headers: jkt48RequestHeaders(cookie),
      });
      if (!response.ok) throw new Error(`API JKT48 merespons ${response.status}${response.status === 403 ? ". Cookie Waiting Room mungkin dibutuhkan atau sudah kedaluwarsa" : ""}.`);
      const payload = await response.json().catch(() => { throw new Error("API JKT48 mengirim respons yang tidak valid."); });
      const count = await saveSourceSnapshot(supabase, source.id, payload);
      results.push({ id: source.id, ok: true, count });
    } catch (caught) {
      const rawMessage = caught instanceof Error ? caught.message : "";
      const message = rawMessage.startsWith("API JKT48 merespons") || rawMessage === "API JKT48 mengirim respons yang tidak valid."
        ? rawMessage : snapshotFailureMessage(caught);
      await supabase.from("event_sources").update({
        sync_status: "error", sync_error: message, last_attempt_at: new Date().toISOString(),
      }).eq("id", source.id);
      results.push({ id: source.id, ok: false, error: message });
    }
  }
  return NextResponse.json({ ok: results.every((item) => item.ok), results });
}
