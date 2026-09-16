// Hand-written row types for the `vehicle_tracker` Postgres schema.
// Supabase's typegen only covers the `public` schema, so these are maintained
// alongside the SQL migrations rather than generated.

export type EmployeeRole = "SUPER_ADMIN" | "FLEET_ADMIN" | "MANAGEMENT" | "EMPLOYEE";
export type VehicleStatus = "AVAILABLE" | "IN_USE" | "RESERVED" | "MAINTENANCE" | "INACTIVE";
export type IdentificationMethod = "QR" | "WHATSAPP" | "RFID" | "AWTL" | "MANUAL" | "UNKNOWN";
export type SessionStatus = "ACTIVE" | "COMPLETED" | "UNKNOWN" | "CANCELLED" | "ADMIN_CLOSED";
export type IncidentType =
  | "TRAFFIC_FINE"
  | "ACCIDENT"
  | "PARKING_FINE"
  | "SPEEDING"
  | "VEHICLE_DAMAGE"
  | "OTHER";
export type IncidentStatus = "OPEN" | "INVESTIGATING" | "ASSIGNED" | "CLOSED";
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW" | "NONE";

export const ADMIN_ROLES: EmployeeRole[] = ["SUPER_ADMIN", "FLEET_ADMIN"];
export const ADMIN_OR_MANAGEMENT_ROLES: EmployeeRole[] = ["SUPER_ADMIN", "FLEET_ADMIN", "MANAGEMENT"];

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export interface ProjectSite {
  id: string;
  name: string;
  code: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  mobile_number: string | null;
  department_id: string | null;
  project_id: string | null;
  role: EmployeeRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  code: string;
  plate_number: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  vehicle_type: string | null;
  department_id: string | null;
  project_id: string | null;
  status: VehicleStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleQrToken {
  id: string;
  vehicle_id: string;
  token: string;
  is_active: boolean;
  created_at: string;
  revoked_at: string | null;
}

export interface VehicleUsageSession {
  id: string;
  session_code: string;
  vehicle_id: string;
  employee_id: string | null;
  start_time: string;
  end_time: string | null;
  start_latitude: number | null;
  start_longitude: number | null;
  end_latitude: number | null;
  end_longitude: number | null;
  start_ip: string | null;
  end_ip: string | null;
  start_device_info: string | null;
  end_device_info: string | null;
  identification_method: IdentificationMethod;
  status: SessionStatus;
  ended_by: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleIncident {
  id: string;
  incident_code: string;
  vehicle_id: string;
  incident_type: IncidentType;
  incident_at: string;
  reference_number: string | null;
  fine_number: string | null;
  description: string | null;
  location: string | null;
  amount: number | null;
  status: IncidentStatus;
  matched_session_id: string | null;
  matched_employee_id: string | null;
  identification_confidence: ConfidenceLevel;
  admin_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentAttachment {
  id: string;
  incident_id: string;
  file_path: string;
  file_name: string;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: unknown;
  new_value: unknown;
  reason: string | null;
  source: string;
  created_at: string;
}

export interface FindDriverResult {
  session_id: string;
  session_code: string;
  employee_id: string | null;
  employee_name: string | null;
  employee_code: string | null;
  session_start: string;
  session_end: string | null;
  identification_method: IdentificationMethod;
  confidence: ConfidenceLevel;
}
