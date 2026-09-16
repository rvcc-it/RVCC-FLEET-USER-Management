import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Resolves a vehicle's short code (e.g. "RVCC-001") to its active QR token,
// for the manual-entry fallback when a camera / native QR scan isn't available.
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Missing vehicle code" }, { status: 400 });
  }

  const { data: vehicle } = await supabase
    .from("vehicle_portal_vehicles")
    .select("id")
    .eq("code", code)
    .maybeSingle();

  if (!vehicle) {
    return NextResponse.json({ error: "No vehicle found with that code" }, { status: 404 });
  }

  const { data: qrToken } = await supabase
    .from("vehicle_portal_qr_tokens")
    .select("token")
    .eq("vehicle_id", vehicle.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!qrToken) {
    return NextResponse.json({ error: "No active QR code for that vehicle" }, { status: 404 });
  }

  return NextResponse.json({ token: qrToken.token });
}
