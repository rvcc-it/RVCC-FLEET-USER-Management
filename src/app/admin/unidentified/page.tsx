import { createClient } from "@/lib/supabase/server";
import { reportUnidentifiedUsage } from "@/app/admin/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnidentifiedRowActions } from "@/components/sessions/unidentified-row-actions";
import { formatDateTime } from "@/lib/utils";

export default async function UnidentifiedUsagePage() {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("vehicle_portal_usage_sessions")
    .select("id, start_time, end_time, status, admin_note, vehicles:vehicle_portal_vehicles(code, name)")
    .is("employee_id", null)
    .in("status", ["UNKNOWN", "ACTIVE"])
    .order("start_time", { ascending: false });

  const [{ data: vehicles }, { data: employees }] = await Promise.all([
    supabase.from("vehicle_portal_vehicles").select("id, code, name").order("code"),
    supabase.from("vehicle_portal_employees").select("id, full_name, employee_code").eq("is_active", true).order("full_name"),
  ]);

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Unidentified Vehicle Usage</h1>
      <p className="text-sm text-slate-500">
        Vehicle movement that happened without an employee scanning the QR code. In Phase 1, these
        are logged manually here; once AWTL GPS integration is connected (Phase 2), matching
        movement events will appear automatically.
      </p>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Report unidentified usage</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={reportUnidentifiedUsage} className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="vehicle_id">Vehicle</Label>
              <Select id="vehicle_id" name="vehicle_id" required defaultValue="">
                <option value="" disabled>
                  Select vehicle
                </option>
                {vehicles?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.code} — {v.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="start_time">Start</Label>
                <Input id="start_time" name="start_time" type="datetime-local" required />
              </div>
              <div>
                <Label htmlFor="end_time">End (optional)</Label>
                <Input id="end_time" name="end_time" type="datetime-local" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="note">Note</Label>
              <Textarea id="note" name="note" placeholder="How was this movement detected?" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" variant="primary">
                Log unidentified usage
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="p-3">Vehicle</th>
                <th className="p-3">Start</th>
                <th className="p-3">End</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {sessions?.map((s) => {
                const v = s.vehicles as unknown as { code: string; name: string } | null;
                return (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-900">{v?.code}</td>
                    <td className="p-3 text-slate-600">{formatDateTime(s.start_time)}</td>
                    <td className="p-3 text-slate-600">
                      {s.end_time ? formatDateTime(s.end_time) : "—"}
                    </td>
                    <td className="p-3">
                      <Badge tone="ALERT">{s.status}</Badge>
                    </td>
                    <td className="p-3">
                      <UnidentifiedRowActions sessionId={s.id} employees={employees ?? []} />
                    </td>
                  </tr>
                );
              })}
              {!sessions?.length && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">
                    No unidentified usage recorded.
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
