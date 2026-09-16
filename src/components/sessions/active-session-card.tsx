"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatDuration, formatTime } from "@/lib/utils";

interface Props {
  vehicleCode: string;
  vehicleName: string;
  startTime: string;
}

export function ActiveSessionCard({ vehicleCode, vehicleName, startTime }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  function handleEnd() {
    setError(null);
    startTransition(async () => {
      const location = await new Promise<{ latitude?: number; longitude?: number }>((resolve) => {
        if (!navigator.geolocation) return resolve({});
        const timeout = setTimeout(() => resolve({}), 4000);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeout);
            resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          },
          () => {
            clearTimeout(timeout);
            resolve({});
          },
          { timeout: 4000 }
        );
      });
      const res = await fetch("/api/sessions/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(location),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || data.error || "Could not end vehicle use.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
        My active vehicle
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{vehicleCode}</p>
      <p className="text-sm text-slate-600">{vehicleName}</p>
      <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
        <span>Started {formatTime(startTime)}</span>
        <span className="font-medium">{formatDuration(startTime)}</span>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <Button
        variant="destructive"
        size="lg"
        className="mt-3"
        onClick={handleEnd}
        disabled={isPending}
      >
        {isPending ? "Ending..." : "🔴 End vehicle use"}
      </Button>
    </div>
  );
}
