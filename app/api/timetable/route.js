import { NextResponse } from "next/server";
import { createPublicClient, isSupabaseConfigured } from "../../../lib/supabase";
import { serverError } from "../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ configured: false, event: null, slots: [] });
  const supabase = createPublicClient();
  const { data: event, error: eventError } = await supabase
    .from("events").select("id,name,event_date").eq("is_active", true)
    .order("event_date", { ascending: true }).limit(1).maybeSingle();
  if (eventError) return serverError(eventError, "Jadwal belum bisa dimuat. Coba lagi sebentar.");
  if (!event) return NextResponse.json({ configured: true, event: null, slots: [] });

  const { data: slots, error } = await supabase
    .from("session_slots")
    .select("id,session_label,lane_label,member_name,group_name,ticket_type,schedules(id,participant_name)")
    .eq("event_id", event.id).eq("active", true)
    .order("session_label").order("lane_label").order("member_name");
  if (error) return serverError(error, "Detail jadwal belum bisa dimuat. Coba lagi sebentar.");
  return NextResponse.json({ configured: true, event, slots: slots ?? [] });
}
