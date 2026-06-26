"use client";

import { useEffect } from "react";
import Image from "next/image";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // surface in the console for debugging; no external reporting wired yet
    console.error(error);
  }, [error]);

  return (
    <div className="relative grid min-h-screen place-items-center px-6">
      <div className="card flex max-w-md flex-col items-center gap-5 p-10 text-center">
        <Image
          src="/zapster_raw/zapster_ghost.png"
          alt="Zapster"
          width={132}
          height={132}
          priority
        />
        <div>
          <h1 className="font-display text-3xl font-semibold">
            Something glitched
          </h1>
          <p className="mt-2 text-muted">
            That’s on us, not your money — nothing moved. Try again.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={reset} className="btn-primary px-6 py-3 text-sm">
            Try again
          </button>
          <a href="/" className="btn-ghost px-6 py-3 text-sm">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
