import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

// Starts a vehicle usage session for the currently logged-in employee.
// Employee identity comes from the session (never from the request body) so
// nobody can start a trip "as" someone else - see vt_sessions_insert RLS policy,
// which independently enforces employee_id = auth.uid() at the database level too.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { token, latitude, longitude } = body as {
    token?: string;
    latitude?: number;
    longitude?: number;
  };

  if (!token) {
    return NextResponse.json({ error: "Missing vehicle token" }, { status: 400 });
  }

  const { data: qrToken, error: tokenError } = await supabase
    .from("vehicle_portal_qr_tokens")
    .select("vehicle_id, is_active, vehicles:vehicle_portal_vehicles(id, code, name, status)")
    .eq("token", token)
    .eq("is_active", true)
    .single();

  if (tokenError || !qrToken) {
    return NextResponse.json({ error: "Invalid or expired QR code" }, { status: 404 });
  }

  const { data: myActiveSession } = await supabase
    .from("vehicle_portal_usage_sessions")
    .select("id, vehicle_id, start_time, vehicles:vehicle_portal_vehicles(code, name)")
    .eq("employee_id", userData.user.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (myActiveSession) {
    return NextResponse.json(
      {
        error: "ALREADY_ACTIVE",
        message: "You are already using another vehicle. End that session first.",
        activeSession: myActiveSession,
      },
      { status: 409 }
    );
  }

  const { data: vehicleActiveSession } = await supabase
    .from("vehicle_portal_usage_sessions")
    .select("id")
    .eq("vehicle_id", qrToken.vehicle_id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (vehicleActiveSession) {
    return NextResponse.json(
      {
        error: "VEHICLE_IN_USE",
        message: "This vehicle is currently in use by another employee.",
      },
      { status: 409 }
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const startIp = forwardedFor ? forwardedFor.split(",")[0].trim() : null;
  const userAgent = request.headers.get("user-agent");

  const { data: session, error: insertError } = await supabase
    .from("vehicle_portal_usage_sessions")
    .insert({
      vehicle_id: qrToken.vehicle_id,
      employee_id: userData.user.id,
      identification_method: "QR",
      status: "ACTIVE",
      start_latitude: latitude ?? null,
      start_longitude: longitude ?? null,
      start_ip: startIp,
      start_device_info: userAgent,
    })
    .select("*, vehicles:vehicle_portal_vehicles(code, name)")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "VEHICLE_IN_USE", message: "This vehicle just became in-use. Please refresh." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase
    .from("vehicle_portal_vehicles")
    .update({ status: "IN_USE" })
    .eq("id", qrToken.vehicle_id)
    .eq("status", "AVAILABLE");

  await logAudit(supabase, {
    actorId: userData.user.id,
    action: "SESSION_START",
    entityType: "vehicle_usage_session",
    entityId: session.id,
    newValue: { vehicle_id: qrToken.vehicle_id, identification_method: "QR" },
  });

  return NextResponse.json({ session });
}
