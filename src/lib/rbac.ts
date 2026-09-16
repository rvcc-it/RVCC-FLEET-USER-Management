import type { EmployeeRole } from "@/lib/types";
import { ADMIN_OR_MANAGEMENT_ROLES, ADMIN_ROLES } from "@/lib/types";

// Pure, import-free-of-server-code role checks - safe to import from Client
// Components (e.g. the site header deciding whether to show the Admin link).
export function isAdmin(role: EmployeeRole | undefined | null) {
  return !!role && ADMIN_ROLES.includes(role);
}

export function isAdminOrManagement(role: EmployeeRole | undefined | null) {
  return !!role && ADMIN_OR_MANAGEMENT_ROLES.includes(role);
}
