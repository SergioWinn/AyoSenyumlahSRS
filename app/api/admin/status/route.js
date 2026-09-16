import { NextResponse } from "next/server";
import { getAdmin } from "../../../../lib/admin";
import { createSecretClient } from "../../../../lib/supabase";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ authenticated: false });
  const { data: sources, error } = await createSecretClient().from("event_sources")
    .select("id,group_name,ticket_type,exclusive_code,purchase_url,sync_status,last_attempt_at,last_success_at,sync_error")
    .order("group_name").order("ticket_type");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ authenticated: true, email: admin.user.email, sources: sources ?? [] });
}
