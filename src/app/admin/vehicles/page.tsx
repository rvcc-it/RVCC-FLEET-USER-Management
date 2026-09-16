import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";

export default async function VehiclesPage() {
  const supabase = await createClient();
  const { data: vehicles } = await supabase
    .from("vehicle_portal_vehicles")
    .select("id, code, plate_number, name, status, vehicle_type")
    .order("code");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Vehicles</h1>
        <LinkButton href="/admin/vehicles/new" variant="primary" size="sm">
          + Add vehicle
        </LinkButton>
      </div>

      <Card className="mt-4">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="p-3">Code</th>
                <th className="p-3">Plate</th>
                <th className="p-3">Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles?.map((v) => (
                <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="p-3">
                    <Link href={`/admin/vehicles/${v.id}`} className="font-medium text-slate-900 underline-offset-2 hover:underline">
                      {v.code}
                    </Link>
                  </td>
                  <td className="p-3 text-slate-600">{v.plate_number}</td>
                  <td className="p-3 text-slate-600">{v.name}</td>
                  <td className="p-3 text-slate-600">{v.vehicle_type ?? "—"}</td>
                  <td className="p-3">
                    <Badge tone={v.status}>{v.status.replace("_", " ")}</Badge>
                  </td>
                </tr>
              ))}
              {!vehicles?.length && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">
                    No vehicles yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
