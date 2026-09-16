-- Vehicle Usage Tracker — schema
-- Runs inside the "vehicle_tracker" Postgres schema, isolated from any other
-- app sharing the same Supabase project. Already applied to the live project
-- via the Supabase migration tool; kept here for reference/reproducibility.

create schema if not exists vehicle_tracker;

-- ── Enums ────────────────────────────────────────────────────────────────

create type vehicle_tracker.employee_role as enum ('SUPER_ADMIN','FLEET_ADMIN','MANAGEMENT','EMPLOYEE');
create type vehicle_tracker.vehicle_status as enum ('AVAILABLE','IN_USE','RESERVED','MAINTENANCE','INACTIVE');
create type vehicle_tracker.identification_method as enum ('QR','WHATSAPP','RFID','AWTL','MANUAL','UNKNOWN');
create type vehicle_tracker.session_status as enum ('ACTIVE','COMPLETED','UNKNOWN','CANCELLED','ADMIN_CLOSED');
create type vehicle_tracker.incident_type as enum ('TRAFFIC_FINE','ACCIDENT','PARKING_FINE','SPEEDING','VEHICLE_DAMAGE','OTHER');
create type vehicle_tracker.incident_status as enum ('OPEN','INVESTIGATING','ASSIGNED','CLOSED');
create type vehicle_tracker.confidence_level as enum ('HIGH','MEDIUM','LOW','NONE');

-- ── Core tables ──────────────────────────────────────────────────────────

create table vehicle_tracker.vehicle_portal_departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table vehicle_tracker.vehicle_portal_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  created_at timestamptz not null default now()
);

create table vehicle_tracker.vehicle_portal_employees (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_code text not null unique,
  full_name text not null,
  email text not null unique,
  mobile_number text,
  department_id uuid references vehicle_tracker.vehicle_portal_departments(id),
  project_id uuid references vehicle_tracker.vehicle_portal_projects(id),
  role vehicle_tracker.employee_role not null default 'EMPLOYEE',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table vehicle_tracker.vehicle_portal_vehicles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  plate_number text not null unique,
  name text not null,
  make text,
  model text,
  year int,
  vehicle_type text,
  department_id uuid references vehicle_tracker.vehicle_portal_departments(id),
  project_id uuid references vehicle_tracker.vehicle_portal_projects(id),
  status vehicle_tracker.vehicle_status not null default 'AVAILABLE',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table vehicle_tracker.vehicle_portal_qr_tokens (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicle_tracker.vehicle_portal_vehicles(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(24),'hex'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create unique index vt_one_active_token_per_vehicle on vehicle_tracker.vehicle_portal_qr_tokens(vehicle_id) where is_active;

create table vehicle_tracker.vehicle_portal_usage_sessions (
  id uuid primary key default gen_random_uuid(),
  session_code text unique,
  vehicle_id uuid not null references vehicle_tracker.vehicle_portal_vehicles(id),
  employee_id uuid references vehicle_tracker.vehicle_portal_employees(id),
  start_time timestamptz not null default now(),
  end_time timestamptz,
  start_latitude double precision,
  start_longitude double precision,
  end_latitude double precision,
  end_longitude double precision,
  start_ip text,
  end_ip text,
  start_device_info text,
  end_device_info text,
  identification_method vehicle_tracker.identification_method not null default 'QR',
  status vehicle_tracker.session_status not null default 'ACTIVE',
  ended_by uuid references vehicle_tracker.vehicle_portal_employees(id),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vt_session_end_after_start check (end_time is null or end_time >= start_time)
);
create unique index vt_one_active_session_per_employee on vehicle_tracker.vehicle_portal_usage_sessions(employee_id) where status = 'ACTIVE' and employee_id is not null;
create unique index vt_one_active_session_per_vehicle on vehicle_tracker.vehicle_portal_usage_sessions(vehicle_id) where status = 'ACTIVE';
create index vt_sessions_vehicle_time on vehicle_tracker.vehicle_portal_usage_sessions(vehicle_id, start_time, end_time);
create index vt_sessions_employee_time on vehicle_tracker.vehicle_portal_usage_sessions(employee_id, start_time);

create table vehicle_tracker.vehicle_portal_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_code text unique,
  vehicle_id uuid not null references vehicle_tracker.vehicle_portal_vehicles(id),
  incident_type vehicle_tracker.incident_type not null,
  incident_at timestamptz not null,
  reference_number text,
  fine_number text,
  description text,
  location text,
  amount numeric(12,2),
  status vehicle_tracker.incident_status not null default 'OPEN',
  matched_session_id uuid references vehicle_tracker.vehicle_portal_usage_sessions(id),
  matched_employee_id uuid references vehicle_tracker.vehicle_portal_employees(id),
  identification_confidence vehicle_tracker.confidence_level not null default 'NONE',
  admin_notes text,
  created_by uuid references vehicle_tracker.vehicle_portal_employees(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vt_incidents_vehicle_time on vehicle_tracker.vehicle_portal_incidents(vehicle_id, incident_at);

create table vehicle_tracker.vehicle_portal_incident_attachments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references vehicle_tracker.vehicle_portal_incidents(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  uploaded_by uuid references vehicle_tracker.vehicle_portal_employees(id),
  uploaded_at timestamptz not null default now()
);

create table vehicle_tracker.vehicle_portal_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references vehicle_tracker.vehicle_portal_employees(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  reason text,
  source text not null default 'WEB',
  created_at timestamptz not null default now()
);
create index vt_audit_entity on vehicle_tracker.vehicle_portal_audit_logs(entity_type, entity_id);

create table vehicle_tracker.vehicle_portal_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  message text not null,
  severity text not null default 'INFO',
  related_entity_type text,
  related_entity_id uuid,
  is_read boolean not null default false,
  target_role vehicle_tracker.employee_role,
  created_at timestamptz not null default now()
);

create table vehicle_tracker.vehicle_portal_awtl_vehicle_mapping (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicle_tracker.vehicle_portal_vehicles(id) on delete cascade,
  awtl_vehicle_id text not null unique,
  created_at timestamptz not null default now()
);

create table vehicle_tracker.vehicle_portal_awtl_events (
  id uuid primary key default gen_random_uuid(),
  awtl_vehicle_id text not null,
  event_type text not null,
  latitude double precision,
  longitude double precision,
  speed numeric(6,2),
  ignition_status text,
  event_timestamp timestamptz not null,
  raw_payload jsonb,
  is_mock boolean not null default true,
  created_at timestamptz not null default now()
);
create index vt_awtl_events_vehicle_time on vehicle_tracker.vehicle_portal_awtl_events(awtl_vehicle_id, event_timestamp);

-- ── Helper functions & triggers ─────────────────────────────────────────

create or replace function vehicle_tracker.is_admin() returns boolean
language sql stable security definer set search_path = vehicle_tracker, public as $$
  select exists (
    select 1 from vehicle_tracker.vehicle_portal_employees e
    where e.id = auth.uid() and e.role in ('SUPER_ADMIN','FLEET_ADMIN') and e.is_active
  );
$$;

create or replace function vehicle_tracker.is_admin_or_management() returns boolean
language sql stable security definer set search_path = vehicle_tracker, public as $$
  select exists (
    select 1 from vehicle_tracker.vehicle_portal_employees e
    where e.id = auth.uid() and e.role in ('SUPER_ADMIN','FLEET_ADMIN','MANAGEMENT') and e.is_active
  );
$$;

create or replace function vehicle_tracker.current_role() returns vehicle_tracker.employee_role
language sql stable security definer set search_path = vehicle_tracker, public as $$
  select role from vehicle_tracker.vehicle_portal_employees where id = auth.uid();
$$;

create or replace function vehicle_tracker.vt_touch_updated_at() returns trigger
language plpgsql security definer set search_path = vehicle_tracker, public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger trg_touch_employees before update on vehicle_tracker.vehicle_portal_employees for each row execute function vehicle_tracker.vt_touch_updated_at();
create trigger trg_touch_vehicles before update on vehicle_tracker.vehicle_portal_vehicles for each row execute function vehicle_tracker.vt_touch_updated_at();
create trigger trg_touch_incidents before update on vehicle_tracker.vehicle_portal_incidents for each row execute function vehicle_tracker.vt_touch_updated_at();

create or replace function vehicle_tracker.vt_set_session_code() returns trigger
language plpgsql security definer set search_path = vehicle_tracker, public as $$
declare
  seq int;
begin
  if new.session_code is null then
    select count(*) + 1 into seq from vehicle_tracker.vehicle_portal_usage_sessions
      where start_time::date = coalesce(new.start_time, now())::date;
    new.session_code := 'TRIP-' || to_char(coalesce(new.start_time, now()), 'YYYYMMDD') || '-' || lpad(seq::text, 4, '0');
  end if;
  return new;
end;
$$;
create trigger trg_session_code before insert on vehicle_tracker.vehicle_portal_usage_sessions for each row execute function vehicle_tracker.vt_set_session_code();

create or replace function vehicle_tracker.vt_protect_session_fields() returns trigger
language plpgsql security definer set search_path = vehicle_tracker, public as $$
begin
  if not vehicle_tracker.is_admin() then
    if new.vehicle_id is distinct from old.vehicle_id
       or new.employee_id is distinct from old.employee_id
       or new.start_time is distinct from old.start_time
       or new.identification_method is distinct from old.identification_method then
      raise exception 'Cannot modify vehicle, employee, start time, or identification method of a usage session';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;
create trigger trg_protect_session before update on vehicle_tracker.vehicle_portal_usage_sessions for each row execute function vehicle_tracker.vt_protect_session_fields();

create or replace function vehicle_tracker.vt_set_incident_code() returns trigger
language plpgsql security definer set search_path = vehicle_tracker, public as $$
declare
  seq int;
begin
  if new.incident_code is null then
    select count(*) + 1 into seq from vehicle_tracker.vehicle_portal_incidents
      where created_at::date = now()::date;
    new.incident_code := 'INC-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(seq::text, 4, '0');
  end if;
  return new;
end;
$$;
create trigger trg_incident_code before insert on vehicle_tracker.vehicle_portal_incidents for each row execute function vehicle_tracker.vt_set_incident_code();

-- Core investigation function: "who was driving vehicle X at timestamp Y?"
create or replace function vehicle_tracker.find_driver_at(p_vehicle_id uuid, p_at timestamptz)
returns table (
  session_id uuid,
  session_code text,
  employee_id uuid,
  employee_name text,
  employee_code text,
  session_start timestamptz,
  session_end timestamptz,
  identification_method vehicle_tracker.identification_method,
  confidence vehicle_tracker.confidence_level
)
language sql stable security definer set search_path = vehicle_tracker, public as $$
  select
    s.id, s.session_code, s.employee_id, e.full_name, e.employee_code,
    s.start_time, s.end_time, s.identification_method,
    case when s.employee_id is not null then 'HIGH' else 'NONE' end::vehicle_tracker.confidence_level
  from vehicle_tracker.vehicle_portal_usage_sessions s
  left join vehicle_tracker.vehicle_portal_employees e on e.id = s.employee_id
  where s.vehicle_id = p_vehicle_id
    and s.start_time <= p_at
    and (s.end_time is null or s.end_time >= p_at)
    and s.status in ('ACTIVE','COMPLETED','UNKNOWN','ADMIN_CLOSED')
  order by s.start_time desc
  limit 1;
$$;

-- ── Row-Level Security ───────────────────────────────────────────────────

alter table vehicle_tracker.vehicle_portal_departments enable row level security;
alter table vehicle_tracker.vehicle_portal_projects enable row level security;
alter table vehicle_tracker.vehicle_portal_employees enable row level security;
alter table vehicle_tracker.vehicle_portal_vehicles enable row level security;
alter table vehicle_tracker.vehicle_portal_qr_tokens enable row level security;
alter table vehicle_tracker.vehicle_portal_usage_sessions enable row level security;
alter table vehicle_tracker.vehicle_portal_incidents enable row level security;
alter table vehicle_tracker.vehicle_portal_incident_attachments enable row level security;
alter table vehicle_tracker.vehicle_portal_audit_logs enable row level security;
alter table vehicle_tracker.vehicle_portal_notifications enable row level security;
alter table vehicle_tracker.vehicle_portal_awtl_vehicle_mapping enable row level security;
alter table vehicle_tracker.vehicle_portal_awtl_events enable row level security;

create policy vt_departments_select on vehicle_tracker.vehicle_portal_departments for select to authenticated using (true);
create policy vt_departments_write on vehicle_tracker.vehicle_portal_departments for all to authenticated using (vehicle_tracker.is_admin()) with check (vehicle_tracker.is_admin());

create policy vt_projects_select on vehicle_tracker.vehicle_portal_projects for select to authenticated using (true);
create policy vt_projects_write on vehicle_tracker.vehicle_portal_projects for all to authenticated using (vehicle_tracker.is_admin()) with check (vehicle_tracker.is_admin());

create policy vt_employees_select_own on vehicle_tracker.vehicle_portal_employees for select to authenticated using (id = auth.uid());
create policy vt_employees_select_admin on vehicle_tracker.vehicle_portal_employees for select to authenticated using (vehicle_tracker.is_admin_or_management());
create policy vt_employees_write_admin on vehicle_tracker.vehicle_portal_employees for update to authenticated using (vehicle_tracker.is_admin()) with check (vehicle_tracker.is_admin());
create policy vt_employees_insert_admin on vehicle_tracker.vehicle_portal_employees for insert to authenticated with check (vehicle_tracker.is_admin());

create policy vt_vehicles_select on vehicle_tracker.vehicle_portal_vehicles for select to authenticated using (true);
create policy vt_vehicles_write on vehicle_tracker.vehicle_portal_vehicles for all to authenticated using (vehicle_tracker.is_admin()) with check (vehicle_tracker.is_admin());

create policy vt_qr_select on vehicle_tracker.vehicle_portal_qr_tokens for select to authenticated using (is_active = true or vehicle_tracker.is_admin());
create policy vt_qr_write on vehicle_tracker.vehicle_portal_qr_tokens for all to authenticated using (vehicle_tracker.is_admin()) with check (vehicle_tracker.is_admin());

create policy vt_sessions_select_own on vehicle_tracker.vehicle_portal_usage_sessions for select to authenticated using (employee_id = auth.uid());
create policy vt_sessions_select_admin on vehicle_tracker.vehicle_portal_usage_sessions for select to authenticated using (vehicle_tracker.is_admin_or_management());
create policy vt_sessions_insert on vehicle_tracker.vehicle_portal_usage_sessions for insert to authenticated with check (employee_id = auth.uid() or vehicle_tracker.is_admin());
create policy vt_sessions_update on vehicle_tracker.vehicle_portal_usage_sessions for update to authenticated using (employee_id = auth.uid() or vehicle_tracker.is_admin()) with check (employee_id = auth.uid() or vehicle_tracker.is_admin());
-- no delete policy: usage history is immutable for everyone, including admin

create policy vt_incidents_select on vehicle_tracker.vehicle_portal_incidents for select to authenticated using (vehicle_tracker.is_admin_or_management());
create policy vt_incidents_write on vehicle_tracker.vehicle_portal_incidents for all to authenticated using (vehicle_tracker.is_admin()) with check (vehicle_tracker.is_admin());

create policy vt_attachments_select on vehicle_tracker.vehicle_portal_incident_attachments for select to authenticated using (vehicle_tracker.is_admin_or_management());
create policy vt_attachments_write on vehicle_tracker.vehicle_portal_incident_attachments for all to authenticated using (vehicle_tracker.is_admin()) with check (vehicle_tracker.is_admin());

create policy vt_audit_select on vehicle_tracker.vehicle_portal_audit_logs for select to authenticated using (vehicle_tracker.is_admin_or_management());
create policy vt_audit_insert on vehicle_tracker.vehicle_portal_audit_logs for insert to authenticated with check (actor_id = auth.uid() or vehicle_tracker.is_admin());

create policy vt_notifications_select on vehicle_tracker.vehicle_portal_notifications for select to authenticated using (vehicle_tracker.is_admin_or_management());
create policy vt_notifications_write on vehicle_tracker.vehicle_portal_notifications for all to authenticated using (vehicle_tracker.is_admin()) with check (vehicle_tracker.is_admin());

create policy vt_awtl_map_select on vehicle_tracker.vehicle_portal_awtl_vehicle_mapping for select to authenticated using (vehicle_tracker.is_admin_or_management());
create policy vt_awtl_map_write on vehicle_tracker.vehicle_portal_awtl_vehicle_mapping for all to authenticated using (vehicle_tracker.is_admin()) with check (vehicle_tracker.is_admin());
create policy vt_awtl_events_select on vehicle_tracker.vehicle_portal_awtl_events for select to authenticated using (vehicle_tracker.is_admin_or_management());
create policy vt_awtl_events_write on vehicle_tracker.vehicle_portal_awtl_events for all to authenticated using (vehicle_tracker.is_admin()) with check (vehicle_tracker.is_admin());

-- ── Storage bucket for incident evidence ────────────────────────────────

insert into storage.buckets (id, name, public)
values ('vt-incident-attachments', 'vt-incident-attachments', false)
on conflict (id) do nothing;

create policy vt_storage_select on storage.objects for select to authenticated
  using (bucket_id = 'vt-incident-attachments' and vehicle_tracker.is_admin_or_management());
create policy vt_storage_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'vt-incident-attachments' and vehicle_tracker.is_admin());
create policy vt_storage_delete on storage.objects for delete to authenticated
  using (bucket_id = 'vt-incident-attachments' and vehicle_tracker.is_admin());
