"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEmployee } from "@/app/admin/actions";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Option {
  id: string;
  name: string;
}

export function NewEmployeeForm({
  departments,
  projects,
}: {
  departments: Option[];
  projects: Option[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = await createEmployee(formData);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create employee");
      }
    });
  }

  if (result) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm font-medium text-emerald-700">Employee created.</p>
          <p className="mt-2 text-sm text-slate-600">
            Share these temporary sign-in details securely with the employee. They should sign in
            once and change their password (via "forgot password") as soon as possible.
          </p>
          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
            <p>
              Email: <span className="font-mono">{result.email}</span>
            </p>
            <p>
              Temporary password: <span className="font-mono">{result.tempPassword}</span>
            </p>
          </div>
          <Button className="mt-4" onClick={() => router.push("/admin/employees")}>
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="employee_code">Employee ID</Label>
              <Input id="employee_code" name="employee_code" required placeholder="EMP-1004" />
            </div>
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="mobile_number">Mobile</Label>
              <Input id="mobile_number" name="mobile_number" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="department_id">Department</Label>
              <Select id="department_id" name="department_id" defaultValue="">
                <option value="">—</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="project_id">Project / Site</Label>
              <Select id="project_id" name="project_id" defaultValue="">
                <option value="">—</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select id="role" name="role" defaultValue="EMPLOYEE">
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGEMENT">Management (read-only)</option>
              <option value="FLEET_ADMIN">Fleet Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </Select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Creating..." : "Create employee"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
