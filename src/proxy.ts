import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_OR_MANAGEMENT_ROLES } from "@/lib/types";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "vehicle_tracker" },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: userData } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!userData.user && !isPublic) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (userData.user && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (userData.user && path.startsWith("/admin")) {
    const { data: employee } = await supabase
      .from("vehicle_portal_employees")
      .select("role, is_active")
      .eq("id", userData.user.id)
      .single();

    const role = employee?.role as string | undefined;
    if (!employee?.is_active || !role || !ADMIN_OR_MANAGEMENT_ROLES.includes(role as never)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/awtl|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
