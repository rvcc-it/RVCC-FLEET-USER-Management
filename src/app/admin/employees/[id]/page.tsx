import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmployeeStatusToggle } from "@/components/employees/employee-status-toggle";
import { formatDateTime, formatDuration } from "@/lib/utils";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: employee } = await supabase
    .from("vehicle_portal_employees")
    .select("*, departments:vehicle_portal_departments(name), projects:vehicle_portal_projects(name)")
    .eq("id", id)
    .single();
  if (!employee) notFound();

  const dept = employee.departments as unknown as { name: string } | null;
  const proj = employee.projects as unknown as { name: string } | null;

  const { data: history } = await supabase
    .from("vehicle_portal_usage_sessions")
    .select("id, start_time, end_time, status, vehicles:vehicle_portal_vehicles(code, name)")
    .eq("employee_id", id)
    .order("start_time", { ascending: false })
    .limit(50);

  return (
    <div>
      <Link href="/admin/employees" className="text-sm text-slate-500 hover:underline">
        ← Employees
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{employee.full_name}</h1>
          <p className="text-slate-500">
            {employee.employee_code} · {employee.email} · {employee.role.replace("_", " ")}
          </p>
          <p className="text-sm text-slate-400">
            {dept?.name ?? "No department"} {proj?.name ? `· ${proj.name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={employee.is_active ? "ACTIVE" : "INACTIVE"}>
            {employee.is_active ? "Active" : "Inactive"}
          </Badge>
          <EmployeeStatusToggle employeeId={employee.id} isActive={employee.is_active} />
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Vehicle Usage History</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100 p-0">
          {!history?.length && <p className="p-4 text-sm text-slate-500">No usage recorded.</p>}
          {history?.map((s) => {
            const v = s.vehicles as unknown as { code: string; name: string } | null;
            return (
              <div key={s.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{v?.code}</p>
                  <p className="text-slate-500">{v?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-600">{formatDateTime(s.start_time)}</p>
                  <p className="text-slate-400">{formatDuration(s.start_time, s.end_time)}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
