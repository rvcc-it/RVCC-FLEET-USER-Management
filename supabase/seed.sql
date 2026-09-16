-- Vehicle Usage Tracker — seed data (dev/test only)
-- Already applied to the live project. Re-running is safe (all inserts are
-- idempotent via ON CONFLICT / NOT EXISTS guards).
--
-- Seeded logins all use password: Passw0rd!123 — change or remove before
-- going live. Real employees should instead be created through the app
-- (Admin -> Employees -> Add employee), which uses the Supabase Auth Admin
-- API and needs no manual SQL.

insert into vehicle_tracker.vehicle_portal_departments (name) values
  ('Operations'), ('Logistics'), ('Maintenance'), ('Administration'), ('Projects')
on conflict (name) do nothing;

insert into vehicle_tracker.vehicle_portal_projects (name, code) values
  ('Head Office', 'HO'), ('Site A - Jeddah', 'SITE-A'), ('Site B - Riyadh', 'SITE-B')
on conflict (code) do nothing;

-- auth.users: GoTrue (Supabase Auth) needs every text column populated with
-- '' rather than NULL, or password-grant login fails with a 500
-- ("converting NULL to string is unsupported").
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  x.email, extensions.crypt('Passw0rd!123', extensions.gen_salt('bf')),
  now(), '', '', '', '', '', '', '', '',
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
from (values
  ('admin@rvce.com.sa'),
  ('fleet.admin@rvce.com.sa'),
  ('manager@rvce.com.sa'),
  ('ahmed.mohammed@rvce.com.sa'),
  ('mohammed.ali@rvce.com.sa'),
  ('ravi.kumar@rvce.com.sa')
) as x(email)
where not exists (select 1 from auth.users u where u.email = x.email);

-- auth.identities: GoTrue also requires an identity row per user for
-- password-grant login to succeed (not just the auth.users row).
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select u.id::text, u.id, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', now(), now(), now()
from auth.users u
where u.email like '%rvce.com.sa%'
and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

insert into vehicle_tracker.vehicle_portal_employees (id, employee_code, full_name, email, mobile_number, department_id, project_id, role, is_active)
select u.id, v.employee_code, v.full_name, v.email, v.mobile_number,
  (select id from vehicle_tracker.vehicle_portal_departments where name = v.dept),
  (select id from vehicle_tracker.vehicle_portal_projects where code = v.proj),
  v.role::vehicle_tracker.employee_role, true
from auth.users u
join (values
  ('admin@rvce.com.sa','EMP-0001','System Administrator','0500000001','Administration','HO','SUPER_ADMIN'),
  ('fleet.admin@rvce.com.sa','EMP-0002','Fleet Admin User','0500000002','Operations','HO','FLEET_ADMIN'),
  ('manager@rvce.com.sa','EMP-0003','Management User','0500000003','Administration','HO','MANAGEMENT'),
  ('ahmed.mohammed@rvce.com.sa','EMP-1001','Ahmed Mohammed','0500000011','Operations','SITE-A','EMPLOYEE'),
  ('mohammed.ali@rvce.com.sa','EMP-1002','Mohammed Ali','0500000012','Operations','SITE-A','EMPLOYEE'),
  ('ravi.kumar@rvce.com.sa','EMP-1003','Ravi Kumar','0500000013','Logistics','SITE-B','EMPLOYEE')
) as v(email, employee_code, full_name, mobile_number, dept, proj, role) on v.email = u.email
on conflict (id) do nothing;

insert into vehicle_tracker.vehicle_portal_vehicles (code, plate_number, name, make, model, year, vehicle_type, department_id, project_id, status)
select v.code, v.plate, v.name, v.make, v.model, v.year, v.vtype,
  (select id from vehicle_tracker.vehicle_portal_departments where name = v.dept),
  (select id from vehicle_tracker.vehicle_portal_projects where code = v.proj), 'AVAILABLE'
from (values
  ('RVCC-001','ABC-1234','Toyota Hilux','Toyota','Hilux',2023,'Pickup','Operations','SITE-A'),
  ('RVCC-002','ABC-1235','Toyota Hilux','Toyota','Hilux',2023,'Pickup','Operations','SITE-A'),
  ('RVCC-003','ABC-1236','Nissan Patrol','Nissan','Patrol',2022,'SUV','Logistics','SITE-B'),
  ('RVCC-004','ABC-1237','Toyota Land Cruiser','Toyota','Land Cruiser',2024,'SUV','Operations','HO'),
  ('RVCC-005','ABC-1238','Hyundai H1','Hyundai','H1',2021,'Van','Logistics','SITE-B')
) as v(code, plate, name, make, model, year, vtype, dept, proj)
on conflict (code) do nothing;

insert into vehicle_tracker.vehicle_portal_qr_tokens (vehicle_id)
select id from vehicle_tracker.vehicle_portal_vehicles v
where not exists (select 1 from vehicle_tracker.vehicle_portal_qr_tokens t where t.vehicle_id = v.id);
