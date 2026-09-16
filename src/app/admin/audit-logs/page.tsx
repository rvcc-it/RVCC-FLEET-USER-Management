import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

export default async function AuditLogsPage() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("vehicle_portal_audit_logs")
    .select("id, action, entity_type, entity_id, reason, created_at, employees:actor_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Audit Log</h1>
      <p className="text-sm text-slate-500">Most recent 200 actions. This log is append-only.</p>

      <Card className="mt-4">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="p-3">When</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs?.map((l) => {
                const actor = l.employees as unknown as { full_name: string } | null;
                return (
                  <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-3 whitespace-nowrap text-slate-600">
                      {formatDateTime(l.created_at)}
                    </td>
                    <td className="p-3 text-slate-900">{actor?.full_name ?? "System"}</td>
                    <td className="p-3 font-mono text-xs text-slate-700">{l.action}</td>
                    <td className="p-3 text-slate-500">
                      {l.entity_type}
                      {l.entity_id ? ` · ${l.entity_id.slice(0, 8)}` : ""}
                    </td>
                    <td className="p-3 text-slate-500">{l.reason || "—"}</td>
                  </tr>
                );
              })}
              {!logs?.length && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">
                    No audit entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
