import { NextResponse } from "next/server";
import { getAdmin } from "../../../../lib/admin";
import { createSecretClient } from "../../../../lib/supabase";
import { saveSourceSnapshot } from "../../../../lib/sync-source";

export async function POST(request) {
  if (!await getAdmin()) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  const supabase = createSecretClient();
  const body = await request.json().catch(() => ({}));
  let query = supabase.from("event_sources").select("id,exclusive_code");
  if (body?.sourceId) query = query.eq("id", body.sourceId);
  const { data: sources, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const source of sources ?? []) {
    try {
      await supabase.from("event_sources").update({
        sync_status: "syncing", last_attempt_at: new Date().toISOString(), sync_error: null,
      }).eq("id", source.id);
      const response = await fetch(`https://jkt48.com/api/v1/exclusives/${encodeURIComponent(source.exclusive_code)}/bonus?lang=id`, {
        cache: "no-store",
        headers: { accept: "application/json", "user-agent": "AyoSenyumlah/1.0" },
      });
      if (!response.ok) throw new Error(`API JKT48 merespons ${response.status}.`);
      const payload = await response.json();
      const count = await saveSourceSnapshot(supabase, source.id, payload);
      results.push({ id: source.id, ok: true, count });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Sinkronisasi gagal.";
      await supabase.from("event_sources").update({
        sync_status: "error", sync_error: message, last_attempt_at: new Date().toISOString(),
      }).eq("id", source.id);
      results.push({ id: source.id, ok: false, error: message });
    }
  }
  return NextResponse.json({ ok: results.every((item) => item.ok), results });
}
