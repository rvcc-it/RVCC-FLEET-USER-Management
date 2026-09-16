"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateVehicleStatus } from "@/app/admin/actions";
import { Select } from "@/components/ui/input";

const STATUSES = ["AVAILABLE", "IN_USE", "RESERVED", "MAINTENANCE", "INACTIVE"];

export function VehicleStatusSelect({ vehicleId, status }: { vehicleId: string; status: string }) {
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
          await updateVehicleStatus(vehicleId, next);
          router.refresh();
        });
      }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace("_", " ")}
        </option>
      ))}
    </Select>
  );
}
