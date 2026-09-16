import { parseBonusPayload } from "./jkt48.js";

export async function saveSourceSnapshot(supabase, sourceId, payload) {
  const slots = parseBonusPayload(payload);
  if (!slots.length) throw new Error("JSON tidak berisi sesi. Data lama dipertahankan.");

  const { error } = await supabase.rpc("sync_event_source", {
    p_source_id: sourceId, p_payload: payload, p_slots: slots,
  });
  if (error) throw error;
  await supabase.from("event_sources").update({
    sync_status: "success", last_success_at: new Date().toISOString(), sync_error: null,
  }).eq("id", sourceId);
  return slots.length;
}
