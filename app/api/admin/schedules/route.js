import { NextResponse } from "next/server";
import { getAdmin } from "../../../../lib/admin";
import { createSecretClient } from "../../../../lib/supabase";
import { PARTICIPANT_NAME_MAX, PARTICIPANT_NAME_MIN, participantNameIsValid } from "../../../../lib/schedule-limits";
import { serverError } from "../../../../lib/api-response";

function participantName(value) {
  const name = String(value ?? "").trim();
  return participantNameIsValid(name) ? name : null;
}

async function activeSlot(supabase, slotId) {
  if (!slotId) return { valid: false };
  const { data, error } = await supabase.from("session_slots").select("id").eq("id", slotId).eq("active", true).maybeSingle();
  return { valid: Boolean(data), error };
}

function failure(error) {
  if (error.code === "23505") return NextResponse.json({ error: "Nama tersebut sudah ada di sesi ini." }, { status: 409 });
  if (error.code === "23514") return NextResponse.json({ error: `Nama harus ${PARTICIPANT_NAME_MIN} sampai ${PARTICIPANT_NAME_MAX} karakter.` }, { status: 400 });
  return serverError(error, "Perubahan jadwal belum bisa disimpan. Coba lagi.");
}

export async function POST(request) {
  if (!await getAdmin()) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Data jadwal tidak dapat dibaca." }, { status: 400 });
  const name = participantName(body.participantName);
  const supabase = createSecretClient();
  if (!name) return NextResponse.json({ error: `Nama harus ${PARTICIPANT_NAME_MIN} sampai ${PARTICIPANT_NAME_MAX} karakter.` }, { status: 400 });
  const slot = await activeSlot(supabase, body.slotId);
  if (slot.error) return serverError(slot.error, "Sesi belum bisa diperiksa. Coba lagi.");
  if (!slot.valid) return NextResponse.json({ error: "Sesi tidak ditemukan atau sudah tidak aktif." }, { status: 400 });
  const { error } = await supabase.from("schedules").insert({ participant_name: name, slot_id: body.slotId });
  if (error) return failure(error);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request) {
  if (!await getAdmin()) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Data jadwal tidak dapat dibaca." }, { status: 400 });
  const name = participantName(body.participantName);
  const supabase = createSecretClient();
  if (!body.id) return NextResponse.json({ error: "ID jadwal wajib diisi." }, { status: 400 });
  if (!name) return NextResponse.json({ error: `Nama harus ${PARTICIPANT_NAME_MIN} sampai ${PARTICIPANT_NAME_MAX} karakter.` }, { status: 400 });
  const slot = await activeSlot(supabase, body.slotId);
  if (slot.error) return serverError(slot.error, "Sesi belum bisa diperiksa. Coba lagi.");
  if (!slot.valid) return NextResponse.json({ error: "Sesi tidak ditemukan atau sudah tidak aktif." }, { status: 400 });
  const { data, error } = await supabase.from("schedules").update({ participant_name: name, slot_id: body.slotId }).eq("id", body.id).select("id").maybeSingle();
  if (error) return failure(error);
  if (!data) return NextResponse.json({ error: "Jadwal tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  if (!await getAdmin()) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "ID jadwal wajib diisi." }, { status: 400 });
  const { data, error } = await createSecretClient().from("schedules").delete().eq("id", id).select("id").maybeSingle();
  if (error) return failure(error);
  if (!data) return NextResponse.json({ error: "Jadwal tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
