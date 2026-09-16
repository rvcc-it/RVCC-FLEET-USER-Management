"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 text-center">
      <div>
        <p className="text-lg font-semibold text-slate-900">Something went wrong</p>
        <p className="mt-1 text-sm text-slate-500">
          Please try again. If this keeps happening, contact your fleet administrator.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </main>
  );
}
