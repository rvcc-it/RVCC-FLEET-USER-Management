import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee, isAdminOrManagement } from "@/lib/auth";

function toCsvRow(values: (string | number | null)[]) {
  return values
    .map((v) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(",");
}

export async function GET() {
  const employee = await getCurrentEmployee();
  if (!employee || !isAdminOrManagement(employee.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("vehicle_portal_employees")
    .select("id, full_name, employee_code")
    .order("full_name");

  const { data: sessions } = await supabase
    .from("vehicle_portal_usage_sessions")
    .select("employee_id, start_time, end_time, vehicles:vehicle_portal_vehicles(code)")
    .not("employee_id", "is", null);

  const header = ["Employee", "Employee Code", "Number of Trips", "Total Usage Hours", "Vehicles Used"];
  const lines = [toCsvRow(header)];

  for (const e of employees ?? []) {
    const rows = (sessions ?? []).filter((s) => s.employee_id === e.id);
    const totalMinutes = rows.reduce((sum, r) => {
      const start = new Date(r.start_time).getTime();
      const end = r.end_time ? new Date(r.end_time).getTime() : Date.now();
      return sum + (end - start) / 60000;
    }, 0);
    const vehicleCodes = new Set(
      rows.map((r) => (r.vehicles as unknown as { code: string } | null)?.code).filter(Boolean)
    );

    lines.push(
      toCsvRow([
        e.full_name,
        e.employee_code,
        rows.length,
        (totalMinutes / 60).toFixed(1),
        Array.from(vehicleCodes).join("; "),
      ])
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="employee-usage-report.csv"',
    },
  });
}
