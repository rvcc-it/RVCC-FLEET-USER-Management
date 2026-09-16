import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

// Ends the current employee's own active session. Admin force-closes of
// someone else's session go through /api/sessions/override-close instead,
// which is a distinct, audited action.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { latitude, longitude } = body as { latitude?: number; longitude?: number };

  const { data: activeSession, error: findError } = await supabase
    .from("vehicle_portal_usage_sessions")
    .select("id, vehicle_id")
    .eq("employee_id", userData.user.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (findError || !activeSession) {
    return NextResponse.json({ error: "No active vehicle usage session found" }, { status: 404 });
  }

  const userAgent = request.headers.get("user-agent");

  const { data: session, error: updateError } = await supabase
    .from("vehicle_portal_usage_sessions")
    .update({
      end_time: new Date().toISOString(),
      status: "COMPLETED",
      end_latitude: latitude ?? null,
      end_longitude: longitude ?? null,
      end_device_info: userAgent,
    })
    .eq("id", activeSession.id)
    .select("*, vehicles:vehicle_portal_vehicles(code, name)")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase
    .from("vehicle_portal_vehicles")
    .update({ status: "AVAILABLE" })
    .eq("id", activeSession.vehicle_id)
    .eq("status", "IN_USE");

  await logAudit(supabase, {
    actorId: userData.user.id,
    action: "SESSION_END",
    entityType: "vehicle_usage_session",
    entityId: session.id,
  });

  return NextResponse.json({ session });
}
