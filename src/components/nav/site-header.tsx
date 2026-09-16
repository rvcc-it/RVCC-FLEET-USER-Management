"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isAdminOrManagement } from "@/lib/rbac";
import type { Employee } from "@/lib/types";

export function SiteHeader({ employee }: { employee: Employee }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-sm font-semibold text-slate-900">
          Vehicle Usage Tracker
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {isAdminOrManagement(employee.role) && (
            <Link href="/admin" className="text-slate-600 hover:text-slate-900">
              Admin
            </Link>
          )}
          <span className="hidden text-slate-500 sm:inline">{employee.full_name}</span>
          <button onClick={handleSignOut} className="text-slate-500 hover:text-slate-900">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
