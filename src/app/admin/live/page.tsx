import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OverrideCloseButton } from "@/components/sessions/override-close-button";
import { formatDuration, formatTime } from "@/lib/utils";

export const revalidate = 0;

export default async function LiveUsagePage() {
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("vehicle_portal_usage_sessions")
    .select("id, start_time, identification_method, employee_id, vehicles:vehicle_portal_vehicles(code, name), employees:vehicle_portal_employees(full_name)")
    .eq("status", "ACTIVE")
    .order("start_time", { ascending: false });

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Live Vehicle Usage</h1>
      <p className="text-sm text-slate-500">Refresh the page to see the latest status.</p>

      <Card className="mt-4">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="p-3">Vehicle</th>
                <th className="p-3">Driver</th>
                <th className="p-3">Start</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Status</th>
                <th className="p-3">Source</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {sessions?.map((s) => {
                const v = s.vehicles as unknown as { code: string; name: string } | null;
                const emp = s.employees as unknown as { full_name: string } | null;
                const isUnidentified = !s.employee_id;
                return (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-900">{v?.code}</td>
                    <td className="p-3 text-slate-600">
                      {emp?.full_name ?? "UNKNOWN / UNIDENTIFIED"}
                    </td>
                    <td className="p-3 text-slate-600">{formatTime(s.start_time)}</td>
                    <td className="p-3 text-slate-600">{formatDuration(s.start_time)}</td>
                    <td className="p-3">
                      <Badge tone={isUnidentified ? "ALERT" : "ACTIVE"}>
                        {isUnidentified ? "ALERT" : "ACTIVE"}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-600">{s.identification_method}</td>
                    <td className="p-3">
                      <OverrideCloseButton sessionId={s.id} />
                    </td>
                  </tr>
                );
              })}
              {!sessions?.length && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-500">
                    No vehicles currently in use.
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
