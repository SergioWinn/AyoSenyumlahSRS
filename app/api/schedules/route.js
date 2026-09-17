import { NextResponse } from "next/server";
import { createSecretClient } from "../../../lib/supabase";
import { PARTICIPANT_NAME_MAX, PARTICIPANT_NAME_MIN, participantNameIsValid } from "../../../lib/schedule-limits";
import { serverError } from "../../../lib/api-response";

export async function POST(request) {
  const supabase = createSecretClient();
  if (!supabase) return NextResponse.json({ error: "Supabase belum dikonfigurasi." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const participantName = typeof body?.participantName === "string" ? body.participantName.trim() : "";
  const slotIds = [...new Set(Array.isArray(body?.slotIds) ? body.slotIds.filter((id) => typeof id === "string") : [])];
  if (!participantNameIsValid(participantName)) {
    return NextResponse.json({ error: `Nama harus ${PARTICIPANT_NAME_MIN} sampai ${PARTICIPANT_NAME_MAX} karakter.` }, { status: 400 });
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
  if (error?.code === "23514") return NextResponse.json({ error: `Nama harus ${PARTICIPANT_NAME_MIN} sampai ${PARTICIPANT_NAME_MAX} karakter.` }, { status: 400 });
  if (error) return serverError(error, "Jadwal belum tersimpan. Coba lagi sebentar.");
  return NextResponse.json({ ok: true, count: slotIds.length });
}
