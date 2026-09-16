import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { FindDriverResult } from "@/lib/types";

export default async function WhoWasDrivingPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle_id?: string; date?: string; time?: string }>;
}) {
  const { vehicle_id, date, time } = await searchParams;
  const supabase = await createClient();

  const { data: vehicles } = await supabase.from("vehicle_portal_vehicles").select("id, code, name").order("code");

  let result: FindDriverResult | null = null;
  let searched = false;

  if (vehicle_id && date && time) {
    searched = true;
    const { data } = await supabase.rpc("find_driver_at", {
      p_vehicle_id: vehicle_id,
      p_at: `${date}T${time}:00`,
    });
    result = Array.isArray(data) ? data[0] ?? null : data ?? null;
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-lg font-semibold text-slate-900">Who Was Using This Vehicle?</h1>
      <p className="text-sm text-slate-500">
        The fastest way to answer a fine or incident: pick the vehicle, date, and time.
      </p>

      <Card className="mt-4">
        <CardContent>
          <form method="GET" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <Label htmlFor="vehicle_id">Vehicle</Label>
              <Select id="vehicle_id" name="vehicle_id" defaultValue={vehicle_id ?? ""} required>
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
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={date ?? ""} required />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input id="time" name="time" type="time" defaultValue={time ?? ""} required />
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="primary" className="w-full">
                Find driver
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {searched && (
        <Card className="mt-4">
          <CardContent>
            {result ? (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-slate-900">
                    {result.employee_name ?? "UNKNOWN / UNIDENTIFIED"}
                  </p>
                  <Badge tone={result.confidence}>{result.confidence} confidence</Badge>
                </div>
                {result.employee_code && (
                  <p className="text-sm text-slate-500">{result.employee_code}</p>
                )}
                <p className="mt-2 text-sm text-slate-600">
                  Session {result.session_code}: {formatDateTime(result.session_start)} –{" "}
                  {result.session_end ? formatDateTime(result.session_end) : "ongoing"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Identification source: {result.identification_method}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold text-red-700">⚠ UNIDENTIFIED DRIVER</p>
                <p className="mt-1 text-sm text-slate-600">
                  No employee usage session was found covering this vehicle at that date/time.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
