"use client";

import { MotionBackground } from "@/components/MotionBackground";
import { PreAuth } from "@/components/landing/PreAuth";
import { Shell } from "@/components/app/Shell";
import { useApp } from "@/lib/store";

export default function Page() {
  const { ready, session } = useApp();

  return (
    <div className="relative min-h-screen">
      <MotionBackground />
      {!ready ? (
        <div className="grid min-h-screen place-items-center text-muted">Loading…</div>
      ) : session ? (
        <Shell />
      ) : (
        <PreAuth />
      )}
    </div>
  );
}
