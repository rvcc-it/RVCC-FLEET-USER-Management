import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  AVAILABLE: "bg-emerald-100 text-emerald-800",
  IN_USE: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-slate-100 text-slate-700",
  RESERVED: "bg-amber-100 text-amber-800",
  MAINTENANCE: "bg-amber-100 text-amber-800",
  INACTIVE: "bg-slate-200 text-slate-600",
  UNKNOWN: "bg-red-100 text-red-800",
  ALERT: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-100 text-slate-500",
  ADMIN_CLOSED: "bg-slate-100 text-slate-700",
  OPEN: "bg-red-100 text-red-800",
  INVESTIGATING: "bg-amber-100 text-amber-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  CLOSED: "bg-slate-100 text-slate-700",
  HIGH: "bg-emerald-100 text-emerald-800",
  MEDIUM: "bg-amber-100 text-amber-800",
  LOW: "bg-orange-100 text-orange-800",
  NONE: "bg-slate-100 text-slate-600",
};

export function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  const style = (tone && STATUS_STYLES[tone]) || "bg-slate-100 text-slate-700";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        style
      )}
    >
      {children}
    </span>
  );
}
