import { NextResponse } from "next/server";
import { getAdmin } from "../../../../lib/admin";
import { createSecretClient } from "../../../../lib/supabase";
import { serverError } from "../../../../lib/api-response";
import { safeSyncError } from "../../../../lib/sync-source";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ authenticated: false });
  const supabase = createSecretClient();
  const { data: sources, error } = await supabase.from("event_sources")
    .select("id,group_name,ticket_type,exclusive_code,purchase_url,sync_status,last_attempt_at,last_success_at,sync_error")
    .order("group_name").order("ticket_type");
  if (error) return serverError(error, "Daftar sumber belum bisa dimuat.");
  const { data: event, error: eventError } = await supabase.from("events")
    .select("id,name,event_date").eq("is_active", true).limit(1).maybeSingle();
  if (eventError) return serverError(eventError, "Event aktif belum bisa dimuat.");
  const { data: slots, error: slotsError } = event ? await supabase.from("session_slots")
    .select("id,session_label,lane_label,member_name,group_name,ticket_type,schedules(id,participant_name)")
    .eq("event_id", event.id).eq("active", true)
    .order("session_label").order("lane_label").order("member_name") : { data: [] };
  if (slotsError) return serverError(slotsError, "Jadwal peserta belum bisa dimuat.");
  return NextResponse.json({ authenticated: true, email: admin.user.email, event, sources: (sources ?? []).map((source) => ({ ...source, sync_error: source.sync_error ? safeSyncError(source.sync_error) : null })), slots: slots ?? [] });
}
