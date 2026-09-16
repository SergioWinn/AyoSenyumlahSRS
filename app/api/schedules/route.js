import { NextResponse } from "next/server";
import { createSecretClient } from "../../../lib/supabase";

export async function POST(request) {
  const supabase = createSecretClient();
  if (!supabase) return NextResponse.json({ error: "Supabase belum dikonfigurasi." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const participantName = typeof body?.participantName === "string" ? body.participantName.trim() : "";
  const slotIds = [...new Set(Array.isArray(body?.slotIds) ? body.slotIds.filter((id) => typeof id === "string") : [])];
  if (participantName.length < 2 || participantName.length > 80) {
    return NextResponse.json({ error: "Nama harus 2 sampai 80 karakter." }, { status: 400 });
  }
  if (!slotIds.length || slotIds.length > 100) {
    return NextResponse.json({ error: "Pilih 1 sampai 100 jadwal." }, { status: 400 });
  }

  const { data: validSlots, error: slotError } = await supabase
    .from("session_slots").select("id").in("id", slotIds).eq("active", true);
  if (slotError || validSlots?.length !== slotIds.length) {
    return NextResponse.json({ error: "Ada jadwal yang sudah tidak aktif. Muat ulang lalu coba lagi." }, { status: 409 });
  }

  const { error } = await supabase.from("schedules").upsert(
    slotIds.map((slotId) => ({ slot_id: slotId, participant_name: participantName })),
    { onConflict: "slot_id,participant_name_key", ignoreDuplicates: true },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: slotIds.length });
}
