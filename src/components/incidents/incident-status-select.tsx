"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateIncidentStatus } from "@/app/admin/actions";
import { Select } from "@/components/ui/input";

const STATUSES = ["OPEN", "INVESTIGATING", "ASSIGNED", "CLOSED"];

export function IncidentStatusSelect({ incidentId, status }: { incidentId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={status}
      disabled={isPending}
      className="w-40"
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          await updateIncidentStatus(incidentId, next);
          router.refresh();
        });
      }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </Select>
  );
}
