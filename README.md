# Vehicle Usage Tracker

Company vehicle usage tracking system: QR-scan a vehicle, the system already knows who you are,
one tap starts/ends the trip. Built to answer "who was using vehicle X at time Y?" months later
for fine/incident investigation, with zero paper forms.

Phase 1 (this build): auth, employee & vehicle management, QR generation/scan, start/end
sessions, employee + admin dashboards, vehicle/employee history, live usage board, unidentified
usage log, incident management with automatic driver matching, the "who was driving" search tool,
audit log, RBAC, and CSV reports.

Phase 2/3 (not built yet, by design - see spec): AWTL GPS integration, WhatsApp commands, AI
camera / facial ID. The `awtl_vehicle_mapping` / `awtl_events` tables and the `find_driver_at`
Postgres function exist already so Phase 2 slots in without a schema rewrite.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS, Supabase (Postgres + Auth), hand-rolled
Tailwind UI primitives (shadcn/ui-equivalent, no extra CLI dependency).

The app's tables live in an isolated `vehicle_tracker` Postgres schema inside the existing
**RVCC-ERP-DASHBOARD** Supabase project (a separate free-tier project wasn't available - the
account was already at its 2-project limit). Row-Level Security enforces every permission rule
described in the spec (employees see only their own sessions, admins see everything, history is
immutable, etc.) at the database level, not just in the UI.

## One-time setup required before this app will work

1. **Expose the `vehicle_tracker` schema in Supabase.** Supabase's REST API only exposes `public`
   by default. Go to the Supabase Dashboard → this project → **Project Settings → Data API →
   Exposed schemas**, add `vehicle_tracker`, and save. Without this every data page shows a
   "could not load" error (auth/login still works, since that's unaffected by this setting).
2. **Add the service-role key.** Copy `.env.local.example` to `.env.local` if you haven't, then
   fill in `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard → Project Settings → API →
   service_role key. This is only used server-side, to create an employee's login when an admin
   adds them (Admin → Employees → Add employee).

## Running locally

```bash
npm install
npm run dev
```

If port 3000 is already in use (e.g. by another local project), Next.js will pick the next free
port and print it - check the terminal output for the actual URL.

## Seeded test accounts

All seeded users share the password `Passw0rd!123` (change/remove before going live):

| Email | Role |
|---|---|
| admin@rvce.com.sa | Super Admin |
| fleet.admin@rvce.com.sa | Fleet Admin |
| manager@rvce.com.sa | Management (read-only) |
| ahmed.mohammed@rvce.com.sa | Employee |
| mohammed.ali@rvce.com.sa | Employee |
| ravi.kumar@rvce.com.sa | Employee |

5 sample vehicles are seeded too: `RVCC-001` … `RVCC-005`, each with an active QR token.

## Trying the core flow

1. Log in as an employee (e.g. `ahmed.mohammed@rvce.com.sa`).
2. Go to `/scan` → type a vehicle code (e.g. `RVCC-001`) → this simulates scanning the QR
   sticker (in real use, the employee's phone camera reads the physical sticker directly and
   opens the `/v/{token}` URL - no in-app scan step needed).
3. Tap **Start using vehicle**. Dashboard now shows the active trip with a running duration.
4. Tap **End vehicle use**. The trip appears in "My recent vehicle usage", immutable from here.
5. Log in as `admin@rvce.com.sa` → `/admin/live` shows who's using what right now; `/admin/search`
   answers "who was using RVCC-001 at 14:32 on 15-Sep?"; `/admin/incidents/new` auto-matches the
   driver from usage history when you log a fine/accident.

## Known Phase 1 limitations (intentional)

- Departments/projects are seeded via SQL; there's no admin UI for managing them yet (vehicles
  and employees have full CRUD/UI).
- "Unidentified usage" is logged manually by an admin for now (Phase 2's AWTL integration would
  create these automatically from GPS movement with no matching session).
- In-app QR camera scanning uses the browser's `BarcodeDetector` API (Chrome/Android only) with a
  manual vehicle-code fallback. The primary real-world flow doesn't need it: an employee's phone
  camera app reads the physical QR sticker and opens the browser directly.
