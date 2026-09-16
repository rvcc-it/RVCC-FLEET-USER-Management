import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth";
import { VehicleScanView } from "./scan-view";

export default async function VehicleScanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const employee = await getCurrentEmployee();

  const { data: qrToken } = await supabase
    .from("vehicle_portal_qr_tokens")
    .select("vehicle_id, is_active, vehicles:vehicle_portal_vehicles(id, code, name, make, model, status)")
    .eq("token", token)
    .maybeSingle();

  if (!qrToken || !qrToken.is_active || !qrToken.vehicles) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-900">QR code not recognized</p>
          <p className="mt-1 text-sm text-slate-500">
            This code may have been rotated or deactivated. Contact your fleet administrator.
          </p>
        </div>
      </main>
    );
  }

  const vehicle = qrToken.vehicles as unknown as {
    id: string;
    code: string;
    name: string;
    make: string | null;
    model: string | null;
    status: string;
  };

  const { data: myActiveSession } = employee
    ? await supabase
        .from("vehicle_portal_usage_sessions")
        .select("id, vehicle_id, start_time, vehicles:vehicle_portal_vehicles(code, name)")
        .eq("employee_id", employee.id)
        .eq("status", "ACTIVE")
        .maybeSingle()
    : { data: null };

  const { data: vehicleActiveSession } = await supabase
    .from("vehicle_portal_usage_sessions")
    .select("id, start_time")
    .eq("vehicle_id", vehicle.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  return (
    <VehicleScanView
      token={token}
      vehicle={vehicle}
      myActiveSession={
        myActiveSession && myActiveSession.vehicle_id === vehicle.id ? myActiveSession : null
      }
      myOtherActiveSession={
        myActiveSession && myActiveSession.vehicle_id !== vehicle.id ? myActiveSession : null
      }
      vehicleInUseByOther={!!vehicleActiveSession && !myActiveSession}
    />
  );
}
