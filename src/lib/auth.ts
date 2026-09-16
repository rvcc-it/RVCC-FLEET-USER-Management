import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/lib/types";

export { isAdmin, isAdminOrManagement } from "@/lib/rbac";

// The logged-in employee's own profile row, loaded server-side via the
// caller's session. Returns null only when there's genuinely no session or
// no employee row - callers then redirect to /login. A query failure (e.g.
// the database is unreachable) throws instead of returning null: returning
// null here for both cases would make an authenticated-but-failed lookup
// redirect to /login, which the proxy immediately bounces back to /dashboard
// since the user IS authenticated - an infinite redirect loop.
export async function getCurrentEmployee(): Promise<Employee | null> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("vehicle_portal_employees")
    .select("*")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load employee profile: ${error.message}`);
  }

  return (data as Employee) ?? null;
}
