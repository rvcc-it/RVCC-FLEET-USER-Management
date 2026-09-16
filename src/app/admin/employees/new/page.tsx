import { createClient } from "@/lib/supabase/server";
import { NewEmployeeForm } from "@/components/employees/new-employee-form";

export default async function NewEmployeePage() {
  const supabase = await createClient();
  const [{ data: departments }, { data: projects }] = await Promise.all([
    supabase.from("vehicle_portal_departments").select("id, name").order("name"),
    supabase.from("vehicle_portal_projects").select("id, name").order("name"),
  ]);

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-semibold text-slate-900">Add Employee</h1>
      <div className="mt-4">
        <NewEmployeeForm departments={departments ?? []} projects={projects ?? []} />
      </div>
    </div>
  );
}
