import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export default async function IncidentsPage() {
  const supabase = await createClient();
  const { data: incidents } = await supabase
    .from("vehicle_portal_incidents")
    .select(
      "id, incident_code, incident_type, incident_at, status, identification_confidence, vehicles:vehicle_portal_vehicles(code), employees:matched_employee_id(full_name)"
    )
    .order("incident_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Incidents</h1>
        <LinkButton href="/admin/incidents/new" variant="primary" size="sm">
          + New incident
        </LinkButton>
      </div>

      <Card className="mt-4">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="p-3">Incident</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">When</th>
                <th className="p-3">Driver</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {incidents?.map((i) => {
                const v = i.vehicles as unknown as { code: string } | null;
                const emp = i.employees as unknown as { full_name: string } | null;
                return (
                  <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-3">
                      <Link
                        href={`/admin/incidents/${i.id}`}
                        className="font-medium text-slate-900 underline-offset-2 hover:underline"
                      >
                        {i.incident_code}
                      </Link>
                      <p className="text-xs text-slate-500">{i.incident_type.replace("_", " ")}</p>
                    </td>
                    <td className="p-3 text-slate-600">{v?.code}</td>
                    <td className="p-3 text-slate-600">{formatDateTime(i.incident_at)}</td>
                    <td className="p-3 text-slate-600">
                      {emp?.full_name ?? (
                        <Badge tone={i.identification_confidence}>Unidentified</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge tone={i.status}>{i.status}</Badge>
                    </td>
                  </tr>
                );
              })}
              {!incidents?.length && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">
                    No incidents recorded.
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
