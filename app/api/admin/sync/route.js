import { NextResponse } from "next/server";
import { getAdmin } from "../../../../lib/admin";
import { parseBonusPayload } from "../../../../lib/jkt48";
import { createSecretClient } from "../../../../lib/supabase";

export async function POST(request) {
  if (!await getAdmin()) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  const supabase = createSecretClient();
  const body = await request.json().catch(() => ({}));
  let query = supabase.from("event_sources").select("id,api_url");
  if (body?.sourceId) query = query.eq("id", body.sourceId);
  const { data: sources, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const source of sources ?? []) {
    try {
      const response = await fetch(source.api_url, {
        cache: "no-store",
        headers: { accept: "application/json", "user-agent": "AyoSenyumlah/1.0" },
      });
      if (!response.ok) throw new Error(`API JKT48 merespons ${response.status}.`);
      const payload = await response.json();
      const slots = parseBonusPayload(payload);
      if (!slots.length) throw new Error("API tidak berisi sesi. Data lama dipertahankan.");
      const { error: syncError } = await supabase.rpc("sync_event_source", {
        p_source_id: source.id, p_payload: payload, p_slots: slots,
      });
      if (syncError) throw syncError;
      results.push({ id: source.id, ok: true, count: slots.length });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Sinkronisasi gagal.";
      await supabase.from("event_sources").update({
        last_sync_status: "error", last_sync_error: message,
      }).eq("id", source.id);
      results.push({ id: source.id, ok: false, error: message });
    }
  }
  return NextResponse.json({ ok: results.every((item) => item.ok), results });
}

