import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server client (Server Components, Route Handlers, Server Actions).
// Runs with the caller's own session, so all vt_* RLS policies apply exactly
// as they would in the browser - this is the client to use for anything an
// employee does on their own behalf.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "vehicle_tracker" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component - middleware refreshes the session instead.
          }
        },
      },
    }
  );
}
