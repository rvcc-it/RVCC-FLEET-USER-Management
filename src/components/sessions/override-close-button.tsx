"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { overrideCloseSession } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function OverrideCloseButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        End (admin)
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        placeholder="Reason (required)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="h-8 rounded-md border border-slate-300 px-2 text-xs"
      />
      <Button
        variant="destructive"
        size="sm"
        disabled={isPending || !note.trim()}
        onClick={() =>
          startTransition(async () => {
            await overrideCloseSession(sessionId, note.trim());
            router.refresh();
          })
        }
      >
        Confirm
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}
