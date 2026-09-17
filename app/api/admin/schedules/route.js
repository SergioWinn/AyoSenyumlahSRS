import { NextResponse } from "next/server";
import { getAdmin } from "../../../../lib/admin";
import { createSecretClient } from "../../../../lib/supabase";

function participantName(value) {
  const name = String(value ?? "").trim();
  return name.length >= 2 && name.length <= 80 ? name : null;
}

async function activeSlot(supabase, slotId) {
  if (!slotId) return false;
  const { data } = await supabase.from("session_slots").select("id").eq("id", slotId).eq("active", true).maybeSingle();
  return Boolean(data);
}

function failure(error) {
  return NextResponse.json({ error: error.code === "23505" ? "Nama tersebut sudah ada di sesi ini." : error.message }, { status: error.code === "23505" ? 409 : 500 });
}

export async function POST(request) {
  if (!await getAdmin()) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  const body = await request.json();
  const name = participantName(body.participantName);
  const supabase = createSecretClient();
  if (!name || !await activeSlot(supabase, body.slotId)) return NextResponse.json({ error: "Nama atau sesi tidak valid." }, { status: 400 });
  const { error } = await supabase.from("schedules").insert({ participant_name: name, slot_id: body.slotId });
  if (error) return failure(error);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request) {
  if (!await getAdmin()) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  const body = await request.json();
  const name = participantName(body.participantName);
  const supabase = createSecretClient();
  if (!body.id || !name || !await activeSlot(supabase, body.slotId)) return NextResponse.json({ error: "Data jadwal tidak valid." }, { status: 400 });
  const { data, error } = await supabase.from("schedules").update({ participant_name: name, slot_id: body.slotId }).eq("id", body.id).select("id").maybeSingle();
  if (error) return failure(error);
  if (!data) return NextResponse.json({ error: "Jadwal tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  if (!await getAdmin()) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "ID jadwal wajib diisi." }, { status: 400 });
  const { data, error } = await createSecretClient().from("schedules").delete().eq("id", id).select("id").maybeSingle();
  if (error) return failure(error);
  if (!data) return NextResponse.json({ error: "Jadwal tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
