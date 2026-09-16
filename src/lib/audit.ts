// Minimal shape instead of the full SupabaseClient<...> generic - callers pass
// clients scoped to different schemas ("vehicle_tracker" vs "public"), which
// don't unify under a single strict SupabaseClient type parameter.
interface MinimalSupabaseClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => { insert: (values: Record<string, unknown>) => PromiseLike<{ error: any }> };
}

interface LogAuditParams {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
}

// Records an immutable audit trail entry. Never throws into the caller's flow -
// a failed audit write should never block the underlying action, but is logged
// to the server console so it isn't silently lost.
export async function logAudit(supabase: MinimalSupabaseClient, params: LogAuditParams) {
  const { error } = await supabase.from("vehicle_portal_audit_logs").insert({
    actor_id: params.actorId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
    reason: params.reason ?? null,
    source: "WEB",
  });

  if (error) {
    console.error("audit log write failed", params.action, params.entityType, error);
  }
}
