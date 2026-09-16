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
  const { data: sessions } = await supabase
    .from("vehicle_portal_usage_sessions")
    .select(
      "session_code, start_time, end_time, status, identification_method, vehicles:vehicle_portal_vehicles(code, plate_number), employees:vehicle_portal_employees(full_name, employee_code)"
    )
    .order("start_time", { ascending: false })
    .limit(5000);

  const header = [
    "Session",
    "Vehicle Code",
    "Plate Number",
    "Employee",
    "Employee Code",
    "Start",
    "End",
    "Status",
    "Identification Method",
  ];
  const lines = [toCsvRow(header)];

  for (const s of sessions ?? []) {
    const v = s.vehicles as unknown as { code: string; plate_number: string } | null;
    const e = s.employees as unknown as { full_name: string; employee_code: string } | null;
    lines.push(
      toCsvRow([
        s.session_code,
        v?.code ?? "",
        v?.plate_number ?? "",
        e?.full_name ?? "UNKNOWN",
        e?.employee_code ?? "",
        s.start_time,
        s.end_time ?? "",
        s.status,
        s.identification_method,
      ])
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="vehicle-usage-report.csv"',
    },
  });
}
