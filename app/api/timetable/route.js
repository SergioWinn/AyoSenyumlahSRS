import { NextResponse } from "next/server";
import { createPublicClient, isSupabaseConfigured } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ configured: false, event: null, slots: [] });
  const supabase = createPublicClient();
  const { data: event, error: eventError } = await supabase
    .from("events").select("id,name,event_date").eq("is_active", true)
    .order("event_date", { ascending: true }).limit(1).maybeSingle();
  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });
  if (!event) return NextResponse.json({ configured: true, event: null, slots: [] });

  const { data: slots, error } = await supabase
    .from("session_slots")
    .select("id,session_label,lane_label,member_name,group_name,ticket_type,schedules(id,participant_name)")
    .eq("event_id", event.id).eq("active", true)
    .order("session_label").order("lane_label").order("member_name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ configured: true, event, slots: slots ?? [] });
}
