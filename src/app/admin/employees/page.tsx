import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("vehicle_portal_employees")
    .select("id, employee_code, full_name, email, role, is_active, departments:vehicle_portal_departments(name)")
    .order("full_name");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Employees</h1>
        <LinkButton href="/admin/employees/new" variant="primary" size="sm">
          + Add employee
        </LinkButton>
      </div>

      <Card className="mt-4">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="p-3">Employee</th>
                <th className="p-3">Department</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((e) => {
                const dept = e.departments as unknown as { name: string } | null;
                return (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-3">
                      <Link
                        href={`/admin/employees/${e.id}`}
                        className="font-medium text-slate-900 underline-offset-2 hover:underline"
                      >
                        {e.full_name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {e.employee_code} · {e.email}
                      </p>
                    </td>
                    <td className="p-3 text-slate-600">{dept?.name ?? "—"}</td>
                    <td className="p-3 text-slate-600">{e.role.replace("_", " ")}</td>
                    <td className="p-3">
                      <Badge tone={e.is_active ? "ACTIVE" : "INACTIVE"}>
                        {e.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {!employees?.length && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-500">
                    No employees yet.
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
