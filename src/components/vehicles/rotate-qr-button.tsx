"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { rotateVehicleQr } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function RotateQrButton({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Rotate this vehicle's QR code? The old sticker will stop working immediately.")) {
          return;
        }
        startTransition(async () => {
          await rotateVehicleQr(vehicleId);
          router.refresh();
        });
      }}
    >
      {isPending ? "Rotating..." : "Rotate QR code"}
    </Button>
  );
}
