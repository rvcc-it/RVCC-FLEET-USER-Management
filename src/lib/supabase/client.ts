import { createBrowserClient } from "@supabase/ssr";

// Browser client, scoped to the vehicle_tracker schema. RLS enforces access control
// per authenticated employee - see the vt_* policies applied via Supabase migrations.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: "vehicle_tracker" } }
  );
}
