import { redirect } from "next/navigation";
import { getCurrentEmployee, isAdminOrManagement } from "@/lib/auth";
import { SiteHeader } from "@/components/nav/site-header";
import { AdminSidebar } from "@/components/nav/admin-sidebar";

// Middleware already blocks non-admin/management from /admin, but every
// server-rendered admin page re-checks here too - defense in depth, since a
// client-side or middleware-only check is not a substitute for server-side
// authorization (see spec section 30).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login");
  if (!isAdminOrManagement(employee.role)) redirect("/dashboard");

  return (
    <>
      <SiteHeader employee={employee} />
      <div className="flex flex-1 flex-col sm:flex-row">
        <AdminSidebar />
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </>
  );
}
