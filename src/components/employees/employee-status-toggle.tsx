"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateEmployeeStatus } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function EmployeeStatusToggle({ employeeId, isActive }: { employeeId: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant={isActive ? "outline" : "primary"}
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await updateEmployeeStatus(employeeId, !isActive);
          router.refresh();
        })
      }
    >
      {isPending ? "Saving..." : isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
