import Link from "next/link";
import { notFound } from "next/navigation";
import { subDays, startOfDay, startOfYesterday, endOfYesterday } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { generateQrDataUrl, vehicleScanUrl } from "@/lib/qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VehicleStatusSelect } from "@/components/vehicles/vehicle-status-select";
import { RotateQrButton } from "@/components/vehicles/rotate-qr-button";
import { formatDateTime, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
];

function rangeToDates(range: string) {
  const now = new Date();
  if (range === "yesterday") return { from: startOfYesterday(), to: endOfYesterday() };
  if (range === "7d") return { from: subDays(now, 7), to: now };
  if (range === "30d") return { from: subDays(now, 30), to: now };
  return { from: startOfDay(now), to: now };
}

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { id } = await params;
  const { range = "7d" } = await searchParams;
  const supabase = await createClient();

  const { data: vehicle } = await supabase.from("vehicle_portal_vehicles").select("*").eq("id", id).single();
  if (!vehicle) notFound();

  const { data: qrToken } = await supabase
    .from("vehicle_portal_qr_tokens")
    .select("token")
    .eq("vehicle_id", id)
    .eq("is_active", true)
    .maybeSingle();

  const qrUrl = qrToken ? vehicleScanUrl(qrToken.token) : null;
  const qrDataUrl = qrUrl ? await generateQrDataUrl(qrUrl) : null;

  const { from, to } = rangeToDates(range);
  const { data: history } = await supabase
    .from("vehicle_portal_usage_sessions")
    .select("id, start_time, end_time, status, identification_method, employees:vehicle_portal_employees(full_name, employee_code)")
    .eq("vehicle_id", id)
    .gte("start_time", from.toISOString())
    .lte("start_time", to.toISOString())
    .order("start_time", { ascending: false });

  return (
    <div>
      <Link href="/admin/vehicles" className="text-sm text-slate-500 hover:underline">
        ← Vehicles
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{vehicle.code}</h1>
          <p className="text-slate-500">
            {vehicle.plate_number} · {[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={vehicle.status}>{vehicle.status.replace("_", " ")}</Badge>
          <VehicleStatusSelect vehicleId={vehicle.id} status={vehicle.status} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-[240px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>QR Sticker</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt={`QR code for ${vehicle.code}`} className="mx-auto" />
            ) : (
              <p className="text-sm text-slate-500">No active QR code.</p>
            )}
            <div className="mt-3 flex flex-col gap-2">
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`${vehicle.code}-qr.png`}
                  className="text-sm text-slate-600 underline"
                >
                  Download PNG
                </a>
              )}
              <RotateQrButton vehicleId={vehicle.id} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Usage History</CardTitle>
            <div className="flex gap-1">
              {RANGES.map((r) => (
                <Link
                  key={r.key}
                  href={`/admin/vehicles/${vehicle.id}?range=${r.key}`}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs",
                    range === r.key ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {r.label}
                </Link>
              ))}
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {!history?.length && (
              <p className="p-4 text-sm text-slate-500">No usage in this period.</p>
            )}
            {history?.map((s) => {
              const emp = s.employees as unknown as { full_name: string; employee_code: string } | null;
              return (
                <div key={s.id} className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">
                      {emp ? emp.full_name : "UNKNOWN / UNIDENTIFIED"}
                    </p>
                    <p className="text-slate-500">{formatDateTime(s.start_time)}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone={emp ? s.status : "ALERT"}>{s.identification_method}</Badge>
                    <p className="mt-1 text-slate-500">{formatDuration(s.start_time, s.end_time)}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
