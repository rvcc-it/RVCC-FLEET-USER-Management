"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee, isAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const employee = await getCurrentEmployee();
  if (!employee || !isAdmin(employee.role)) {
    throw new Error("Forbidden: fleet admin access required");
  }
  return employee;
}

export async function createVehicle(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const payload = {
    code: String(formData.get("code")).trim().toUpperCase(),
    plate_number: String(formData.get("plate_number")).trim().toUpperCase(),
    name: String(formData.get("name")).trim(),
    make: (formData.get("make") as string) || null,
    model: (formData.get("model") as string) || null,
    year: formData.get("year") ? Number(formData.get("year")) : null,
    vehicle_type: (formData.get("vehicle_type") as string) || null,
    notes: (formData.get("notes") as string) || null,
  };

  const { data: vehicle, error } = await supabase
    .from("vehicle_portal_vehicles")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("vehicle_portal_qr_tokens").insert({ vehicle_id: vehicle.id });

  await logAudit(supabase, {
    actorId: admin.id,
    action: "VEHICLE_CREATE",
    entityType: "vehicle",
    entityId: vehicle.id,
    newValue: payload,
  });

  revalidatePath("/admin/vehicles");
}

export async function updateVehicleStatus(vehicleId: string, status: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("vehicle_portal_vehicles")
    .select("status")
    .eq("id", vehicleId)
    .single();

  const { error } = await supabase.from("vehicle_portal_vehicles").update({ status }).eq("id", vehicleId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    actorId: admin.id,
    action: "VEHICLE_STATUS_CHANGE",
    entityType: "vehicle",
    entityId: vehicleId,
    oldValue: before,
    newValue: { status },
  });

  revalidatePath("/admin/vehicles");
  revalidatePath(`/admin/vehicles/${vehicleId}`);
}

export async function rotateVehicleQr(vehicleId: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from("vehicle_portal_qr_tokens")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("vehicle_id", vehicleId)
    .eq("is_active", true);

  await supabase.from("vehicle_portal_qr_tokens").insert({ vehicle_id: vehicleId });

  await logAudit(supabase, {
    actorId: admin.id,
    action: "VEHICLE_QR_ROTATE",
    entityType: "vehicle",
    entityId: vehicleId,
    reason: "QR sticker lost, damaged, or suspected compromised",
  });

  revalidatePath(`/admin/vehicles/${vehicleId}`);
}

export async function createEmployee(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const email = String(formData.get("email")).trim().toLowerCase();
  const tempPassword = randomBytes(9).toString("base64url");

  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (authError || !authUser.user) {
    throw new Error(authError?.message || "Could not create login for this employee");
  }

  const payload = {
    id: authUser.user.id,
    employee_code: String(formData.get("employee_code")).trim().toUpperCase(),
    full_name: String(formData.get("full_name")).trim(),
    email,
    mobile_number: (formData.get("mobile_number") as string) || null,
    department_id: (formData.get("department_id") as string) || null,
    project_id: (formData.get("project_id") as string) || null,
    role: String(formData.get("role")) as "SUPER_ADMIN" | "FLEET_ADMIN" | "MANAGEMENT" | "EMPLOYEE",
  };

  const { error } = await supabase.from("vehicle_portal_employees").insert(payload);
  if (error) {
    await adminClient.auth.admin.deleteUser(authUser.user.id);
    throw new Error(error.message);
  }

  await logAudit(supabase, {
    actorId: admin.id,
    action: "EMPLOYEE_CREATE",
    entityType: "employee",
    entityId: authUser.user.id,
    newValue: { ...payload, temp_password_issued: true },
  });

  revalidatePath("/admin/employees");
  return { tempPassword, email };
}

export async function updateEmployeeStatus(employeeId: string, isActive: boolean) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("vehicle_portal_employees")
    .update({ is_active: isActive })
    .eq("id", employeeId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    actorId: admin.id,
    action: isActive ? "EMPLOYEE_ACTIVATE" : "EMPLOYEE_DEACTIVATE",
    entityType: "employee",
    entityId: employeeId,
  });

  revalidatePath("/admin/employees");
}

export async function overrideCloseSession(sessionId: string, note: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("vehicle_portal_usage_sessions")
    .select("vehicle_id")
    .eq("id", sessionId)
    .single();

  const { error } = await supabase
    .from("vehicle_portal_usage_sessions")
    .update({
      status: "ADMIN_CLOSED",
      end_time: new Date().toISOString(),
      ended_by: admin.id,
      admin_note: note,
    })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);

  if (session) {
    await supabase
      .from("vehicle_portal_vehicles")
      .update({ status: "AVAILABLE" })
      .eq("id", session.vehicle_id)
      .eq("status", "IN_USE");
  }

  await logAudit(supabase, {
    actorId: admin.id,
    action: "SESSION_ADMIN_CLOSE",
    entityType: "vehicle_usage_session",
    entityId: sessionId,
    reason: note,
  });

  revalidatePath("/admin/live");
}

export async function reportUnidentifiedUsage(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const payload = {
    vehicle_id: String(formData.get("vehicle_id")),
    identification_method: "UNKNOWN" as const,
    status: "UNKNOWN" as const,
    start_time: String(formData.get("start_time")),
    end_time: (formData.get("end_time") as string) || null,
    admin_note: (formData.get("note") as string) || null,
  };

  const { data: session, error } = await supabase
    .from("vehicle_portal_usage_sessions")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    actorId: admin.id,
    action: "UNIDENTIFIED_USAGE_REPORTED",
    entityType: "vehicle_usage_session",
    entityId: session.id,
    newValue: payload,
  });

  revalidatePath("/admin/unidentified");
}

export async function assignUnidentifiedSession(
  sessionId: string,
  employeeId: string,
  reason: string
) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("vehicle_portal_usage_sessions")
    .select("employee_id, status")
    .eq("id", sessionId)
    .single();

  const { error } = await supabase
    .from("vehicle_portal_usage_sessions")
    .update({
      employee_id: employeeId,
      identification_method: "MANUAL",
      status: "COMPLETED",
    })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    actorId: admin.id,
    action: "UNIDENTIFIED_USAGE_ASSIGNED",
    entityType: "vehicle_usage_session",
    entityId: sessionId,
    oldValue: before,
    newValue: { employee_id: employeeId },
    reason,
  });

  revalidatePath("/admin/unidentified");
}

export async function closeUnidentifiedSession(sessionId: string, reason: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("vehicle_portal_usage_sessions")
    .update({ status: "ADMIN_CLOSED", ended_by: admin.id, admin_note: reason })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    actorId: admin.id,
    action: "UNIDENTIFIED_USAGE_CLOSED",
    entityType: "vehicle_usage_session",
    entityId: sessionId,
    reason,
  });

  revalidatePath("/admin/unidentified");
}

export async function createIncident(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const vehicleId = String(formData.get("vehicle_id"));
  const incidentAt = String(formData.get("incident_at"));

  const { data: match } = await supabase.rpc("find_driver_at", {
    p_vehicle_id: vehicleId,
    p_at: incidentAt,
  });
  const driverMatch = Array.isArray(match) ? match[0] : match;

  const payload = {
    vehicle_id: vehicleId,
    incident_type: String(formData.get("incident_type")),
    incident_at: incidentAt,
    reference_number: (formData.get("reference_number") as string) || null,
    fine_number: (formData.get("fine_number") as string) || null,
    description: (formData.get("description") as string) || null,
    location: (formData.get("location") as string) || null,
    amount: formData.get("amount") ? Number(formData.get("amount")) : null,
    matched_session_id: driverMatch?.session_id ?? null,
    matched_employee_id: driverMatch?.employee_id ?? null,
    identification_confidence: driverMatch?.confidence ?? "NONE",
    created_by: admin.id,
  };

  const { data: incident, error } = await supabase
    .from("vehicle_portal_incidents")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    actorId: admin.id,
    action: "INCIDENT_CREATE",
    entityType: "vehicle_incident",
    entityId: incident.id,
    newValue: payload,
  });

  revalidatePath("/admin/incidents");
  return { incidentId: incident.id };
}

export async function updateIncidentStatus(incidentId: string, status: string, notes?: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("vehicle_portal_incidents")
    .update({ status, admin_notes: notes ?? null })
    .eq("id", incidentId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    actorId: admin.id,
    action: "INCIDENT_STATUS_CHANGE",
    entityType: "vehicle_incident",
    entityId: incidentId,
    newValue: { status },
    reason: notes,
  });

  revalidatePath("/admin/incidents");
  revalidatePath(`/admin/incidents/${incidentId}`);
}
