import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IncidentStatusSelect } from "@/components/incidents/incident-status-select";
import { formatDateTime } from "@/lib/utils";

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: incident } = await supabase
    .from("vehicle_portal_incidents")
    .select(
      "*, vehicles:vehicle_portal_vehicles(code, name, plate_number), matched_employee:matched_employee_id(full_name, employee_code), created_by_employee:created_by(full_name)"
    )
    .eq("id", id)
    .single();
  if (!incident) notFound();

  const vehicle = incident.vehicles as unknown as {
    code: string;
    name: string;
    plate_number: string;
  } | null;
  const matchedEmployee = incident.matched_employee as unknown as {
    full_name: string;
    employee_code: string;
  } | null;

  const { data: session } = incident.matched_session_id
    ? await supabase
        .from("vehicle_portal_usage_sessions")
        .select("session_code, start_time, end_time, identification_method, start_latitude, start_longitude")
        .eq("id", incident.matched_session_id)
        .single()
    : { data: null };

  return (
    <div className="max-w-2xl">
      <Link href="/admin/incidents" className="text-sm text-slate-500 hover:underline">
        ← Incidents
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{incident.incident_code}</h1>
          <p className="text-slate-500">
            {incident.incident_type.replace("_", " ")} · {formatDateTime(incident.incident_at)}
          </p>
        </div>
        <IncidentStatusSelect incidentId={incident.id} status={incident.status} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Driver Identification</CardTitle>
        </CardHeader>
        <CardContent>
          {matchedEmployee ? (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-emerald-700">
                  {matchedEmployee.full_name}
                </p>
                <Badge tone={incident.identification_confidence}>
                  {incident.identification_confidence} confidence
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{matchedEmployee.employee_code}</p>
              {session && (
                <div className="mt-3 text-sm text-slate-600">
                  <p>
                    Usage session {session.session_code}: {formatDateTime(session.start_time)} –{" "}
                    {session.end_time ? formatDateTime(session.end_time) : "ongoing"}
                  </p>
                  <p>Identification source: {session.identification_method}</p>
                  {session.start_latitude && (
                    <p>
                      GPS at start: {session.start_latitude.toFixed(5)},{" "}
                      {session.start_longitude?.toFixed(5)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold text-red-700">⚠ UNIDENTIFIED DRIVER</p>
              <p className="mt-1 text-sm text-slate-600">
                No employee usage session was found covering this vehicle at this date/time. Check
                the Unidentified Usage page or assign a driver manually if known.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Incident Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-400">Vehicle</p>
            <p className="text-slate-900">
              {vehicle?.code} · {vehicle?.plate_number}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Location</p>
            <p className="text-slate-900">{incident.location || "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">Reference number</p>
            <p className="text-slate-900">{incident.reference_number || "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">Fine number</p>
            <p className="text-slate-900">{incident.fine_number || "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">Amount</p>
            <p className="text-slate-900">{incident.amount ? `SAR ${incident.amount}` : "—"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-slate-400">Description</p>
            <p className="text-slate-900">{incident.description || "—"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
