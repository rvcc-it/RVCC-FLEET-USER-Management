"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignUnidentifiedSession, closeUnidentifiedSession } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

interface EmployeeOption {
  id: string;
  full_name: string;
  employee_code: string;
}

export function UnidentifiedRowActions({
  sessionId,
  employees,
}: {
  sessionId: string;
  employees: EmployeeOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"idle" | "assign">("idle");
  const [employeeId, setEmployeeId] = useState("");
  const [reason, setReason] = useState("");

  if (mode === "assign") {
    return (
      <div className="flex flex-wrap items-center gap-1">
        <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="h-8 w-40 text-xs">
          <option value="">Select employee</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.full_name} ({e.employee_code})
            </option>
          ))}
        </Select>
        <input
          placeholder="Reason (required)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="h-8 rounded-md border border-slate-300 px-2 text-xs"
        />
        <Button
          size="sm"
          variant="primary"
          disabled={isPending || !employeeId || !reason.trim()}
          onClick={() =>
            startTransition(async () => {
              await assignUnidentifiedSession(sessionId, employeeId, reason.trim());
              router.refresh();
            })
          }
        >
          Confirm
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setMode("idle")}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <Button size="sm" variant="outline" onClick={() => setMode("assign")}>
        Assign employee
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => {
          const reasonInput = prompt("Reason for closing this record (e.g. authorized, false alarm):");
          if (!reasonInput) return;
          startTransition(async () => {
            await closeUnidentifiedSession(sessionId, reasonInput);
            router.refresh();
          });
        }}
      >
        Close
      </Button>
    </div>
  );
}
