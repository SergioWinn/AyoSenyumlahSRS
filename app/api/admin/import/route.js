import { NextResponse } from "next/server";
import { getAdmin } from "../../../../lib/admin";
import { createSecretClient } from "../../../../lib/supabase";
import { saveSourceSnapshot, snapshotFailureMessage } from "../../../../lib/sync-source";
import { serverError } from "../../../../lib/api-response";

export async function POST(request) {
  if (!await getAdmin()) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.sourceId !== "string" || !body?.payload) {
    return NextResponse.json({ error: "Source dan payload JSON wajib diisi." }, { status: 400 });
  }

  const supabase = createSecretClient();
  const { data: source, error: sourceError } = await supabase.from("event_sources").select("id").eq("id", body.sourceId).maybeSingle();
  if (sourceError) return serverError(sourceError, "Sumber event belum bisa diperiksa.");
  if (!source) return NextResponse.json({ error: "Sumber event tidak ditemukan." }, { status: 404 });

  try {
    const count = await saveSourceSnapshot(supabase, source.id, body.payload);
    return NextResponse.json({ ok: true, count });
  } catch (caught) {
    const message = snapshotFailureMessage(caught);
    await supabase.from("event_sources").update({
      sync_status: "error", sync_error: message, last_attempt_at: new Date().toISOString(),
    }).eq("id", source.id);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
