import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalVehicles },
    { count: inUse },
    { count: available },
    { count: maintenance },
    { count: unidentified },
    { count: activeEmployees },
  ] = await Promise.all([
    supabase.from("vehicle_portal_vehicles").select("id", { count: "exact", head: true }),
    supabase.from("vehicle_portal_vehicles").select("id", { count: "exact", head: true }).eq("status", "IN_USE"),
    supabase
      .from("vehicle_portal_vehicles")
      .select("id", { count: "exact", head: true })
      .eq("status", "AVAILABLE"),
    supabase
      .from("vehicle_portal_vehicles")
      .select("id", { count: "exact", head: true })
      .eq("status", "MAINTENANCE"),
    supabase
      .from("vehicle_portal_usage_sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "UNKNOWN"),
    supabase
      .from("vehicle_portal_employees")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  const cards = [
    { label: "Total Vehicles", value: totalVehicles ?? 0 },
    { label: "Currently In Use", value: inUse ?? 0 },
    { label: "Available", value: available ?? 0 },
    { label: "Maintenance", value: maintenance ?? 0 },
    { label: "Unidentified Usage", value: unidentified ?? 0, alert: (unidentified ?? 0) > 0 },
    { label: "Active Employees", value: activeEmployees ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Admin Dashboard</h1>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {c.label}
              </p>
              <p
                className={`mt-1 text-2xl font-bold ${c.alert ? "text-red-600" : "text-slate-900"}`}
              >
                {c.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
