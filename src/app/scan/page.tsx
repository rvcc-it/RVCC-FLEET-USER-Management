"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

// Camera-based QR scanning using the browser's native BarcodeDetector API
// (supported on Chrome/Android, not on Safari/iOS at this time). Falls back
// to typing the vehicle's short code when the API or camera isn't available -
// this is a real fallback, not a stand-in for the primary flow, which is an
// employee's phone camera app reading the physical QR sticker directly.
export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "BarcodeDetector" in window);
  }, []);

  useEffect(() => {
    if (!supported) return;
    let stream: MediaStream | null = null;
    let stop = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (stop) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });

        const tick = async () => {
          if (stop || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const raw = codes[0]?.rawValue as string | undefined;
            if (raw) {
              const match = raw.match(/\/v\/([A-Za-z0-9]+)/);
              if (match) {
                stop = true;
                router.push(`/v/${match[1]}`);
                return;
              }
            }
          } catch {
            // keep scanning
          }
          requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setCameraError("Could not access the camera. You can enter the vehicle code below instead.");
      }
    })();

    return () => {
      stop = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [supported, router]);

  async function handleManualLookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupError(null);
    const res = await fetch(`/api/vehicles/resolve-code?code=${encodeURIComponent(manualCode)}`);
    const data = await res.json();
    if (!res.ok) {
      setLookupError(data.error || "Vehicle not found");
      return;
    }
    router.push(`/v/${data.token}`);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-4 text-center text-lg font-semibold text-slate-900">Scan Vehicle QR</h1>

        {supported && !cameraError && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-black">
            <video ref={videoRef} className="w-full" muted playsInline />
          </div>
        )}

        {(supported === false || cameraError) && (
          <p className="mb-4 text-center text-sm text-slate-500">
            {cameraError ||
              "Camera scanning isn't supported on this browser. Point your phone's camera app at the QR sticker instead, or enter the vehicle code below."}
          </p>
        )}

        <Card className="mt-4">
          <CardContent>
            <form onSubmit={handleManualLookup} className="flex gap-2">
              <Input
                placeholder="Vehicle code, e.g. RVCC-001"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
              />
              <Button type="submit">Go</Button>
            </form>
            {lookupError && <p className="mt-2 text-sm text-red-600">{lookupError}</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
