"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/live", label: "Live Usage" },
  { href: "/admin/search", label: "Who Was Driving?" },
  { href: "/admin/vehicles", label: "Vehicles" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/unidentified", label: "Unidentified Usage" },
  { href: "/admin/incidents", label: "Incidents" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/audit-logs", label: "Audit Log" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav className="w-full shrink-0 border-b border-slate-200 bg-white sm:w-56 sm:border-b-0 sm:border-r sm:min-h-[calc(100vh-49px)]">
      <ul className="flex gap-1 overflow-x-auto p-2 sm:flex-col sm:overflow-visible">
        {LINKS.map((link) => {
          const active =
            link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm whitespace-nowrap",
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
