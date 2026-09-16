import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth";
import { SiteHeader } from "@/components/nav/site-header";
import { ActiveSessionCard } from "@/components/sessions/active-session-card";
import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { formatDate, formatDuration, formatTime } from "@/lib/utils";

export default async function DashboardPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login");

  const supabase = await createClient();

  const { data: activeSession } = await supabase
    .from("vehicle_portal_usage_sessions")
    .select("id, start_time, vehicles:vehicle_portal_vehicles(code, name)")
    .eq("employee_id", employee.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  const { data: recentSessions } = await supabase
    .from("vehicle_portal_usage_sessions")
    .select("id, start_time, end_time, status, vehicles:vehicle_portal_vehicles(code, name)")
    .eq("employee_id", employee.id)
    .order("start_time", { ascending: false })
    .limit(10);

  const activeVehicle = activeSession?.vehicles as unknown as
    | { code: string; name: string }
    | undefined;

  return (
    <>
      <SiteHeader employee={employee} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <h1 className="text-lg font-semibold text-slate-900">Vehicle Management</h1>

        <div className="mt-4">
          {activeSession && activeVehicle ? (
            <ActiveSessionCard
              vehicleCode={activeVehicle.code}
              vehicleName={activeVehicle.name}
              startTime={activeSession.start_time}
            />
          ) : (
            <Card>
              <CardContent className="text-center">
                <p className="text-sm text-slate-500">You are not using any vehicle right now.</p>
                <LinkButton href="/scan" variant="primary" size="lg" className="mt-4">
                  Scan vehicle QR
                </LinkButton>
              </CardContent>
            </Card>
          )}
        </div>

        {!activeSession && (
          <div className="mt-3 text-center">
            <Link href="/scan" className="text-sm text-slate-500 underline">
              Scan vehicle QR
            </Link>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-900">My recent vehicle usage</h2>
          <Card className="mt-2">
            <CardContent className="divide-y divide-slate-100 p-0">
              {!recentSessions?.length && (
                <p className="p-4 text-sm text-slate-500">No usage recorded yet.</p>
              )}
              {recentSessions?.map((s) => {
                const v = s.vehicles as unknown as { code: string; name: string } | null;
                return (
                  <div key={s.id} className="flex items-center justify-between p-4 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{v?.code ?? "—"}</p>
                      <p className="text-slate-500">{formatDate(s.start_time)}</p>
                    </div>
                    <div className="text-right text-slate-600">
                      <p>
                        {formatTime(s.start_time)}
                        {s.end_time ? ` – ${formatTime(s.end_time)}` : " – ongoing"}
                      </p>
                      <p className="text-slate-400">{formatDuration(s.start_time, s.end_time)}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
