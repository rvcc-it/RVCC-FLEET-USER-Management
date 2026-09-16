import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS entirely - server-only, never import from
// a Client Component. Used only for actions that must happen outside an
// employee's own session: creating a new employee's auth login, and (Phase 2)
// ingesting AWTL webhook events.
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (see .env.local.example)."
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      db: { schema: "vehicle_tracker" },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
