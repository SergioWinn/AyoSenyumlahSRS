import { parseBonusPayload } from "./jkt48.js";

export async function saveSourceSnapshot(supabase, sourceId, payload) {
  const slots = parseBonusPayload(payload);
  if (!slots.length) throw new Error("JSON tidak berisi sesi. Data lama dipertahankan.");

  const { error } = await supabase.rpc("sync_event_source", {
    p_source_id: sourceId, p_payload: payload, p_slots: slots,
  });
  if (error) {
    console.error("Snapshot gagal disimpan.", error);
    throw new Error("Snapshot gagal disimpan ke database.");
  }
  await supabase.from("event_sources").update({
    sync_status: "success", last_success_at: new Date().toISOString(), sync_error: null,
  }).eq("id", sourceId);
  return slots.length;
}

export function snapshotFailureMessage(error) {
  const message = error instanceof Error ? error.message : "";
  if (["JSON tidak berisi sesi. Data lama dipertahankan.", "Format API JKT48 tidak dikenali.", "Snapshot gagal disimpan ke database."].includes(message)) return message;
  console.error("Impor snapshot gagal.", error);
  return "Snapshot belum bisa diproses. Periksa file lalu coba lagi.";
}

export function safeSyncError(message) {
  const value = typeof message === "string" ? message : "";
  const safePrefixes = ["API JKT48 merespons", "API JKT48 mengirim", "Cookie Waiting Room", "JSON tidak berisi", "Format API JKT48", "Snapshot gagal"];
  return safePrefixes.some((prefix) => value.startsWith(prefix)) ? value : "Sinkronisasi terakhir gagal. Coba sinkronkan ulang atau impor JSON secara manual.";
}
