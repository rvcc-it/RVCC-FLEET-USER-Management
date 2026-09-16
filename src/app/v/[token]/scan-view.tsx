"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration, formatTime } from "@/lib/utils";

interface VehicleInfo {
  id: string;
  code: string;
  name: string;
  make: string | null;
  model: string | null;
  status: string;
}

interface ActiveSessionInfo {
  id: string;
  start_time: string;
  vehicles?: { code: string; name: string } | { code: string; name: string }[] | null;
}

function nameOf(v?: ActiveSessionInfo["vehicles"]) {
  if (!v) return "";
  const one = Array.isArray(v) ? v[0] : v;
  return one ? `${one.code} - ${one.name}` : "";
}

// Best-effort browser geolocation. GPS permission must never block starting or
// ending a trip - see spec section 6/28 - so this always resolves, never rejects.
function tryGetLocation(): Promise<{ latitude?: number; longitude?: number }> {
  return new Promise((resolve) => {
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
      { timeout: 4000, maximumAge: 60000 }
    );
  });
}

export function VehicleScanView({
  token,
  vehicle,
  myActiveSession,
  myOtherActiveSession,
  vehicleInUseByOther,
}: {
  token: string;
  vehicle: VehicleInfo;
  myActiveSession: ActiveSessionInfo | null;
  myOtherActiveSession: ActiveSessionInfo | null;
  vehicleInUseByOther: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const location = await tryGetLocation();
      const res = await fetch("/api/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...location }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Could not start vehicle usage.");
        return;
      }
      router.refresh();
    });
  }

  function handleEnd() {
    setError(null);
    startTransition(async () => {
      const location = await tryGetLocation();
      const res = await fetch("/api/sessions/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(location),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Could not end vehicle usage.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm text-center">
        <p className="text-2xl font-bold tracking-tight text-slate-900">{vehicle.code}</p>
        <p className="mt-1 text-slate-500">
          {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || vehicle.name}
        </p>

        <Card className="mt-6">
          <CardContent className="space-y-4">
            {myOtherActiveSession && (
              <>
                <p className="text-sm text-slate-600">
                  You are currently using{" "}
                  <span className="font-semibold">{nameOf(myOtherActiveSession.vehicles)}</span>{" "}
                  (started {formatTime(myOtherActiveSession.start_time)}).
                </p>
                <p className="text-sm text-slate-500">
                  Please end that vehicle usage before starting another vehicle.
                </p>
                <Button variant="outline" size="lg" onClick={() => router.push("/dashboard")}>
                  Go to my dashboard
                </Button>
              </>
            )}

            {!myOtherActiveSession && myActiveSession && (
              <>
                <p className="text-sm font-medium text-emerald-700">
                  🟢 You are using this vehicle
                </p>
                <p className="text-sm text-slate-500">
                  Started: {formatTime(myActiveSession.start_time)} (
                  {formatDuration(myActiveSession.start_time)})
                </p>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleEnd}
                  disabled={isPending}
                >
                  {isPending ? "Ending..." : "🔴 End vehicle use"}
                </Button>
              </>
            )}

            {!myOtherActiveSession && !myActiveSession && vehicleInUseByOther && (
              <p className="text-sm text-slate-600">
                This vehicle is currently in use by another employee. Try again once it's free.
              </p>
            )}

            {!myOtherActiveSession && !myActiveSession && !vehicleInUseByOther && (
              <Button variant="primary" size="lg" onClick={handleStart} disabled={isPending}>
                {isPending ? "Starting..." : "🟢 Start using vehicle"}
              </Button>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>

        <p className="mt-6 text-xs text-slate-400">
          Location access is optional and never required to start or end a trip.
        </p>
      </div>
    </main>
  );
}
